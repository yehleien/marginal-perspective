import { Sequelize } from 'sequelize';

const devDB = new Sequelize({
  username: "retool",
  password: "kOa18IYRVbfL",
  database: "retool",
  host: "ep-falling-cake-a67kv2p5.us-west-2.retooldb.com",
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

const prodDB = new Sequelize({
  username: "ncymp",
  password: "zoaWhydre4GxT28J494SxA",
  database: "marginal-perspective-db-4494",
  host: "chocolate-chip-14096.7tt.aws-us-east-1.cockroachlabs.cloud",
  port: 26257,
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function getTableColumns(db, tableName) {
  const [columns] = await db.query(`
    SELECT column_name, data_type, character_maximum_length, is_nullable
    FROM information_schema.columns 
    WHERE table_name = '${tableName.toLowerCase()}'
  `);
  return columns;
}

async function syncDatabases() {
  try {
    const tables = ['Users', 'Articles', 'Comments', 'Perspectives', 
                   'UserPerspectives', 'CommunityPosts', 'Votes', 
                   'Sessions', 'GmailTokens'];
    
    for (const table of tables) {
      console.log(`Syncing ${table}...`);
      
      // Get data from dev
      let records;
      if (table === 'Articles') {
        // Explicitly select columns for Articles, excluding title
        [records] = await devDB.query(`
          SELECT id, url, "submitDate", type, scope, content, "perspectiveId", "userId"
          FROM "Articles"
        `);
      } else {
        [records] = await devDB.query(`SELECT * FROM "${table}"`);
      }
      
      if (records.length > 0) {
        // Clear production table
        await prodDB.query(`TRUNCATE TABLE "${table}" CASCADE`);
        
        // Insert records
        for (const record of records) {
          const columns = Object.keys(record).map(key => `"${key}"`);
          const values = Object.keys(record).map((_, i) => `$${i + 1}`);
          
          await prodDB.query(
            `INSERT INTO "${table}" (${columns.join(', ')}) 
             VALUES (${values.join(', ')})`,
            { 
              bind: Object.values(record).map(val => 
                val instanceof Date ? val.toISOString() : val
              )
            }
          );
        }
      }
      
      console.log(`Synced ${records.length} records for ${table}`);
    }
    
    console.log('Database sync complete!');
  } catch (error) {
    console.error('Sync error:', error);
  } finally {
    await devDB.close();
    await prodDB.close();
  }
}

syncDatabases(); 