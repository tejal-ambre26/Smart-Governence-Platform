const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'civicpulse_db',
  password: 'civic@12',
  port: 5432,
});
client.connect();

const updateApplications = async () => {
  try {
    const res = await client.query('SELECT application_id, application_number, service_type, department FROM service_applications WHERE department IS NULL');
    console.log(`Found ${res.rows.length} applications with NULL department`);
    
    for (const app of res.rows) {
      let dept = 'Health'; // Default fallback
      if (app.service_type === 'BIRTH_CERTIFICATE' || app.service_type === 'DEATH_CERTIFICATE') {
        dept = 'Health';
      } else if (app.service_type === 'INCOME_CERTIFICATE' || app.service_type === 'RESIDENCE_CERTIFICATE') {
        dept = 'Revenue';
      } else if (app.service_type === 'TRADE_LICENSE') {
        dept = 'Municipal Corporation';
      }
      
      await client.query('UPDATE service_applications SET department = $1 WHERE application_id = $2', [dept, app.application_id]);
      console.log(`Updated ${app.application_number} to ${dept}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    client.end();
  }
};

updateApplications();
