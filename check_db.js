const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'civicpulse_db',
  password: 'civic@12',
  port: 5432,
});
client.connect();
client.query('SELECT application_number, department FROM service_applications', (err, res) => {
  console.log(err ? err.stack : res.rows);
  client.end();
});
