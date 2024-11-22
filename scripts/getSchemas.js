import { Sequelize } from 'sequelize';
import fs from 'fs/promises';

const devDB = new Sequelize({
  username: "retool",
  password: "kOa18IYRVbfL",
  database: "retool",
  host: "ep-falling-cake-a67kv2p5.us-west-2.retooldb.com",
  dialect: "postgres",
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

const prodDB = new Sequelize({
  username: "ncymp",
  password: "Em9Tlmmb94_I734NLZdnWQ",
  database: "marginal-perspective-db-4494",
  host: "chocolate-chip-14096.7tt.aws-us-east-1.cockroachlabs.cloud",
  port: 26257,
  dialect: "postgres",
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function getSchema(db, name) {
  const [tables] = await db.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);

  const schema = {};
  
  for (const { table_name } of tables) {
    const [columns] = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = '${table_name}'
      ORDER BY ordinal_position
    `);
    schema[table_name] = columns;
  }
  
  return schema;
}

async function saveSchemas() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fs.mkdir('./db-schemas', { recursive: true });

    const devSchema = await getSchema(devDB, 'Development');
    const prodSchema = await getSchema(prodDB, 'Production');

    await fs.writeFile(
      `./db-schemas/schemas_${timestamp}.md`,
      `# Database Schemas (${timestamp})

## Development Database
\`\`\`json
${JSON.stringify(devSchema, null, 2)}
\`\`\`

## Production Database
\`\`\`json
${JSON.stringify(prodSchema, null, 2)}
\`\`\`
`
    );

    console.log(`Schemas saved to ./db-schemas/schemas_${timestamp}.md`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await devDB.close();
    await prodDB.close();
  }
}

saveSchemas();
