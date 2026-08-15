const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'civicpulse_db',
  password: 'civic@12',
  port: 5432,
});
client.connect();
client.query("UPDATE beneficiaries SET status = 'RECOMMENDED' WHERE beneficiary_code = 'BEN-2026-0010'", (err, res) => {
  if (err) console.error(err.stack);
  else console.log('Updated ' + res.rowCount + ' row(s).');
  client.end();
});
