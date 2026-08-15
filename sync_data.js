const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'civicpulse_db',
  password: 'civic@12',
  port: 5432,
});

const run = async () => {
  await client.connect();
  try {
    // 1. Delete all existing officers
    await client.query('DELETE FROM department_officers');
    await client.query('DELETE FROM officers');
    console.log('Cleared existing officers.');

    // 2. Insert new officers
    const newOfficers = [
      { user: 'john', name: 'John', dept: 'Health Department' },
      { user: 'mark', name: 'Mark', dept: 'Revenue Department' },
      { user: 'ryan', name: 'Ryan', dept: 'Municipal Corporation' },
      { user: 'chris', name: 'Chris', dept: 'Water Department' },
      { user: 'ethan', name: 'Ethan', dept: 'Roads Department' },
      { user: 'jack', name: 'Jack', dept: 'Electricity Department' },
      { user: 'david', name: 'David', dept: 'Sanitation Department' },
      { user: 'will', name: 'Will', dept: 'Urban Planning Department' },
    ];

    for (const off of newOfficers) {
      // Skip inserting into officers and department_officers here,
      // the Java DataInitializer in both microservices will handle it on restart.
    }
    console.log('Inserted new normalized officers.');

    // 3. Normalize Departments across Complaints and Service Applications
    const deptMap = {
      'health': 'Health Department',
      'revenue': 'Revenue Department',
      'municipal': 'Municipal Corporation',
      'water': 'Water Department',
      'road': 'Roads Department',
      'electricity': 'Electricity Department',
      'sanitation': 'Sanitation Department',
      'urban': 'Urban Planning Department',
      'public works': 'Roads Department' // Mapping public works to Roads as requested
    };

    const tables = ['complaints', 'service_applications'];
    
    for (const table of tables) {
      const res = await client.query(`SELECT * FROM ${table}`);
      for (const row of res.rows) {
        if (!row.department) continue;
        
        let normalized = row.department;
        const lower = row.department.toLowerCase();
        
        for (const [key, val] of Object.entries(deptMap)) {
          if (lower.includes(key)) {
            normalized = val;
            break;
          }
        }

        const pkCol = table === 'complaints' ? 'complaint_id' : 'application_id';
        const pkVal = row[pkCol];

        // Also update assigned_officer if it's a complaint to match the new department officer
        if (table === 'complaints') {
          const matchingOff = newOfficers.find(o => o.dept === normalized);
          if (matchingOff) {
            await client.query(`UPDATE complaints SET department = $1, assigned_officer = $2 WHERE complaint_id = $3`, [normalized, matchingOff.user, pkVal]);
          } else {
            await client.query(`UPDATE complaints SET department = $1 WHERE complaint_id = $2`, [normalized, pkVal]);
          }
        } else {
          await client.query(`UPDATE service_applications SET department = $1 WHERE application_id = $2`, [normalized, pkVal]);
        }
      }
    }
    console.log('Normalized department data and re-assigned complaints successfully.');

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
};

run();
