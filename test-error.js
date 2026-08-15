async function testFlow() {
  try {
    const tokenRes = await fetch('http://localhost:8180/realms/civicpulse/protocol/openid-connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'client_id=civicpulse-frontend&username=raja&password=password&grant_type=password'
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    
    // Decode token to get citizen ID
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const citizen = JSON.parse(Buffer.from(base64, 'base64').toString());
    const citizenId = citizen.sub;

    console.log("Fetching notifications for:", citizenId);
    const notifRes = await fetch(`http://localhost:8080/notification-service/api/notifications/recipient/${citizenId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log("Status:", notifRes.status);
    const text = await notifRes.text();
    console.log("Body:", text);
    
  } catch (err) {
    console.error(err);
  }
}
testFlow();
