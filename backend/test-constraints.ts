import { getPool } from './src/database/connection';

async function main() {
  const pool = await getPool();
  const res = await pool.request().query(`
    SELECT definition 
    FROM sys.check_constraints 
    WHERE parent_object_id = OBJECT_ID('PlayInvitations') 
    AND name LIKE 'CK__PlayInvit__Invit%'
  `);
  console.log(res.recordset);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
