# ============================================================
#  Initialize CivicPulse Realm and Users in Keycloak
# ============================================================
$ErrorActionPreference = 'Stop'

Write-Host "Waiting for Keycloak to be ready on http://localhost:8180..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:8180/realms/master" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($resp.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 2
}

if (-not $ready) {
    Write-Warning "Keycloak did not respond on http://localhost:8180 in time."
    exit 1
}

Write-Host "Keycloak is running! Authenticating master admin..."
$tokenBody = @{
    grant_type = "password"
    client_id  = "admin-cli"
    username   = "admin"
    password   = "admin"
}
$auth = Invoke-RestMethod -Uri "http://localhost:8180/realms/master/protocol/openid-connect/token" -Method Post -Body $tokenBody
$token = $auth.access_token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

# 1. Create realm 'civicpulse' if not exists
try {
    Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse" -Method Get -Headers $headers -ErrorAction Stop | Out-Null
    Write-Host "Realm 'civicpulse' already exists."
} catch {
    Write-Host "Creating 'civicpulse' realm..."
    $realmData = @{
        realm   = "civicpulse"
        enabled = $true
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8180/admin/realms" -Method Post -Headers $headers -Body $realmData
    Write-Host "Realm 'civicpulse' created."
}

# Refresh token
$auth = Invoke-RestMethod -Uri "http://localhost:8180/realms/master/protocol/openid-connect/token" -Method Post -Body $tokenBody
$token = $auth.access_token
$headers["Authorization"] = "Bearer $token"

# 2. Create Roles in civicpulse realm
$roles = @("CITIZEN", "OFFICER", "ADMIN")
foreach ($role in $roles) {
    try {
        Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse/roles/$role" -Method Get -Headers $headers -ErrorAction Stop | Out-Null
    } catch {
        Write-Host "Creating role $role..."
        $roleData = @{ name = $role } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse/roles" -Method Post -Headers $headers -Body $roleData
    }
}

# 3. Create / Update 'civicpulse-frontend' client
$clients = Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse/clients?clientId=civicpulse-frontend" -Method Get -Headers $headers
$clientUuid = ""
if ($clients.Count -gt 0) {
    $clientUuid = $clients[0].id
    Write-Host "Client 'civicpulse-frontend' exists with UUID: $clientUuid"
} else {
    Write-Host "Creating client 'civicpulse-frontend'..."
    $clientPayload = @{
        clientId                  = "civicpulse-frontend"
        publicClient              = $true
        directAccessGrantsEnabled = $true
        standardFlowEnabled       = $true
        implicitFlowEnabled       = $false
        redirectUris              = @("*")
        webOrigins                = @("*")
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse/clients" -Method Post -Headers $headers -Body $clientPayload
    
    $clients = Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse/clients?clientId=civicpulse-frontend" -Method Get -Headers $headers
    $clientUuid = $clients[0].id
}

# Ensure directAccessGrantsEnabled and webOrigins are configured
$clientUpdate = @{
    clientId                  = "civicpulse-frontend"
    publicClient              = $true
    directAccessGrantsEnabled = $true
    standardFlowEnabled       = $true
    implicitFlowEnabled       = $false
    redirectUris              = @("*")
    webOrigins                = @("*")
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse/clients/$clientUuid" -Method Put -Headers $headers -Body $clientUpdate

# 4. Attach 'roles' default client scope
$scopes = Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse/client-scopes" -Method Get -Headers $headers
$rolesScope = $scopes | Where-Object { $_.name -eq "roles" }
if ($rolesScope) {
    try {
        Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse/clients/$clientUuid/default-client-scopes/$($rolesScope.id)" -Method Put -Headers $headers -ErrorAction SilentlyContinue
    } catch {}
}

# Helper function to create/update user
function Setup-User($username, $email, $firstName, $lastName, $password, $roleName) {
    $existingUsers = Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse/users?username=$username" -Method Get -Headers $headers
    $userId = ""
    if ($existingUsers.Count -gt 0) {
        $userId = $existingUsers[0].id
    } else {
        Write-Host "Creating user: $username ($roleName)..."
        $userObj = @{
            username      = $username
            email         = $email
            firstName     = $firstName
            lastName      = $lastName
            enabled       = $true
            emailVerified = $true
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse/users" -Method Post -Headers $headers -Body $userObj
        $createdUsers = Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse/users?username=$username" -Method Get -Headers $headers
        $userId = $createdUsers[0].id
    }
    
    # Set password
    $credObj = @{
        type      = "password"
        value     = $password
        temporary = $false
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse/users/$userId/reset-password" -Method Put -Headers $headers -Body $credObj
    
    # Assign Realm Role
    $roleObj = Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse/roles/$roleName" -Method Get -Headers $headers
    $rolePayload = "[{`"id`":`"$($roleObj.id)`",`"name`":`"$($roleObj.name)`"}]"
    try {
        Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse/users/$userId/role-mappings/realm" -Method Post -Headers $headers -Body $rolePayload
        Write-Host "  Role $roleName assigned to user $username."
    } catch {
        Write-Host "  Role mapping status: $($_.Exception.Message)"
    }
}

# Helper function to delete old username if present
function Remove-User($username) {
    $existing = Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse/users?username=$username" -Method Get -Headers $headers
    if ($existing.Count -gt 0) {
        $uId = $existing[0].id
        try {
            Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/civicpulse/users/$uId" -Method Delete -Headers $headers
            Write-Host "Removed old user: $username"
        } catch {}
    }
}

# Clean up old short officer usernames
$oldUsers = @("john", "mark", "ryan", "chris", "ethan", "jack", "david", "will", "emily")
foreach ($old in $oldUsers) {
    Remove-User $old
}

# 5. Create default users
Write-Host "Setting up default users and roles..."
Setup-User "admin_user" "admin@civicpulse.org" "Admin" "User" "Password123" "ADMIN"

$officers = @(
    @{ u = "healthofficer.org"; e = "john@muni.gov"; fn = "John"; ln = "Officer" },
    @{ u = "revenueofficer.org"; e = "mark@muni.gov"; fn = "Mark"; ln = "Officer" },
    @{ u = "municipalofficer.org"; e = "ryan@muni.gov"; fn = "Ryan"; ln = "Officer" },
    @{ u = "waterofficer.org"; e = "chris@muni.gov"; fn = "Chris"; ln = "Officer" },
    @{ u = "roadsofficer.org"; e = "ethan@muni.gov"; fn = "Ethan"; ln = "Officer" },
    @{ u = "electricityofficer.org"; e = "jack@muni.gov"; fn = "Jack"; ln = "Officer" },
    @{ u = "socialwelfareofficer.org"; e = "david@muni.gov"; fn = "David"; ln = "Officer" },
    @{ u = "urbanofficer.org"; e = "will@muni.gov"; fn = "Will"; ln = "Officer" },
    @{ u = "educationofficer.org"; e = "emily@muni.gov"; fn = "Emily"; ln = "Officer" }
)

foreach ($off in $officers) {
    Setup-User $off.u $off.e $off.fn $off.ln "Password123" "OFFICER"
}

$citizens = @("citizen1@gmail.com", "citizen2@gmail.com", "citizen3@gmail.com")
foreach ($cit in $citizens) {
    $name = $cit.Split('@')[0]
    Setup-User $cit $cit $name "Citizen" "Password123" "CITIZEN"
}

Write-Host "CivicPulse Keycloak Realm successfully initialized!"
