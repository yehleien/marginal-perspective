import { Sequelize } from 'sequelize';
import fs from 'fs/promises';

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
  password: "Em9Tlmmb94_I734NLZdnWQ",
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

async function getTableSchema(db, tableName) {
  const [columns] = await db.query(`
    SELECT 
      column_name,
      data_type,
      character_maximum_length,
      is_nullable,
      column_default,
      udt_name
    FROM information_schema.columns 
    WHERE table_name = '${tableName.toLowerCase()}'
    ORDER BY ordinal_position;
  `);

  const [constraints] = await db.query(`
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = '${tableName.toLowerCase()}'
    ORDER BY tc.constraint_name;
  `);

  return { columns, constraints };
}

async function generateSchemas() {
  try {
    const tables = ['Users', 'Articles', 'Comments', 'Perspectives', 
                   'UserPerspectives', 'CommunityPosts', 'Votes', 
                   'Sessions', 'GmailTokens'];
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const devSchema = {};
    const prodSchema = {};
    
    for (const table of tables) {
      console.log(`Getting schema for ${table}...`);
      devSchema[table] = await getTableSchema(devDB, table);
      prodSchema[table] = await getTableSchema(prodDB, table);
    }
    
    // Save schemas to files
    await fs.mkdir('./schemas', { recursive: true });
    
    await fs.writeFile(
      `./schemas/dev_schema_${timestamp}.json`,
      JSON.stringify(devSchema, null, 2)
    );
    
    await fs.writeFile(
      `./schemas/prod_schema_${timestamp}.json`,
      JSON.stringify(prodSchema, null, 2)
    );
    
    // Generate comparison report
    let report = '# Database Schema Comparison\n\n';
    report += `Generated at: ${new Date().toISOString()}\n\n`;
    
    for (const table of tables) {
      report += `## ${table}\n\n`;
      
      // Compare columns
      const devCols = devSchema[table].columns;
      const prodCols = prodSchema[table].columns;
      
      report += '### Columns\n\n';
      report += '| Column Name | Dev Type | Prod Type | Match |\n';
      report += '|------------|----------|-----------|-------|\n';
      
      const allColumns = new Set([
        ...devCols.map(c => c.column_name),
        ...prodCols.map(c => c.column_name)
      ]);
      
      for (const col of allColumns) {
        const devCol = devCols.find(c => c.column_name === col);
        const prodCol = prodCols.find(c => c.column_name === col);
        
        report += `| ${col} | ${devCol?.data_type || 'MISSING'} | ${prodCol?.data_type || 'MISSING'} | ${
          devCol && prodCol && devCol.data_type === prodCol.data_type ? '✅' : '❌'
        } |\n`;
      }
      
      report += '\n### Constraints\n\n';
      // Add constraint comparison here
      
      report += '\n---\n\n';
    }
    
    await fs.writeFile(
      `./schemas/comparison_${timestamp}.md`,
      report
    );
    
    console.log('Schema files generated:');
    console.log(`- ./schemas/dev_schema_${timestamp}.json`);
    console.log(`- ./schemas/prod_schema_${timestamp}.json`);
    console.log(`- ./schemas/comparison_${timestamp}.md`);
    
  } catch (error) {
    console.error('Error generating schemas:', error);
  } finally {
    await devDB.close();
    await prodDB.close();
  }
}

generateSchemas(); 