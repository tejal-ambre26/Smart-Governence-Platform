async function testFlow() {
  try {
    const tokenRes = await fetch('http://localhost:8180/realms/civicpulse/protocol/openid-connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'client_id=civicpulse-frontend&username=citizen1@gmail.com&password=Password123&grant_type=password'
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    // Decode token to get citizen ID
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const citizen = JSON.parse(Buffer.from(base64, 'base64').toString());
    const citizenId = citizen.sub;
    
    console.log("Logged-in Citizen ID:", citizenId);

    const compRes = await fetch('http://localhost:8080/grievance-service/api/complaints', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: "Test Complaint Kafka Flow",
        description: "Testing end to end kafka notification",
        department: "Electricity",
        location: "Test Location",
        citizenId: citizenId
      })
    });
    const compData = await compRes.json();
    
    console.log("Complaint Response:", compData);
    console.log("Complaint Submitted. ID:", compData.complaintId || compData.id);

    // 3. Wait for Kafka to process
    await new Promise(r => setTimeout(r, 2000));

    const notifRes = await fetch(`http://localhost:8080/notification-service/api/notifications/recipient/${citizenId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const notifData = await notifRes.json();

    console.log("Total Notifications:", notifData.length);
    if (notifData.length > 0) {
      console.log("Latest Notification:");
      console.log("- Title:", notifData[0].title);
      console.log("- Message:", notifData[0].message);
      console.log("- Recipient:", notifData[0].recipient);
    }
    
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

testFlow();
