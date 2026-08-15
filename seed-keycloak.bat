@echo off
set KCADM=d:\civic plus milestone\keycloak-26.6.4\bin\kcadm.bat
call "%KCADM%" config credentials --server http://localhost:8180 --realm master --user admin --password admin

for %%u in (healthofficer.org revenueofficer.org municipalofficer.org waterofficer.org roadsofficer.org electricityofficer.org socialwelfareofficer.org urbanofficer.org educationofficer.org) do (
    echo Creating user %%u...
    call "%KCADM%" create users -r civicpulse -s username=%%u -s enabled=true -s email=%%u@muni.gov
    call "%KCADM%" set-password -r civicpulse --username %%u --new-password Password123
    call "%KCADM%" add-roles -r civicpulse --uusername %%u --rolename OFFICER
)
echo Done
