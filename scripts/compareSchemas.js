import { Sequelize } from 'sequelize';
import fs from 'fs/promises';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

async function getTableNames(sequelize) {
  const [tables] = await sequelize.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  return tables.map(t => t.table_name);
}

async function getTableSchema(sequelize, tableName) {
  // Get columns
  const [columns] = await sequelize.query(`
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = :tableName
    ORDER BY ordinal_position
  `, {
    replacements: { tableName }
  });

  // Get constraints
  const [constraints] = await sequelize.query(`
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
    WHERE tc.table_schema = 'public'
    AND tc.table_name = :tableName
  `, {
    replacements: { tableName }
  });

  return { columns, constraints };
}

async function generateERDiagram(schema, dbName, outputDir) {
  let mermaidDef = `erDiagram\n`;
  
  for (const [tableName, tableInfo] of Object.entries(schema)) {
    // Replace hyphens and spaces in table names with underscores
    const safeTableName = tableName.replace(/[-\s]/g, '_');
    mermaidDef += `    ${safeTableName} {\n`;
    
    for (const column of tableInfo.columns) {
      const isPK = tableInfo.constraints.some(c => 
        c.constraint_type === 'PRIMARY KEY' && 
        c.column_name === column.column_name
      );
      
      const isFK = tableInfo.constraints.some(c => 
        c.constraint_type === 'FOREIGN KEY' && 
        c.column_name === column.column_name
      );

      // Simplify types even further and make them safe
      let type = column.data_type;
      if (type.includes('timestamp') || type.includes('date')) type = 'date';
      if (type.includes('char') || type === 'text') type = 'string';
      if (type === 'ARRAY' || type.includes('json')) type = 'string';
      if (type === 'USER-DEFINED') type = 'string';
      if (type === 'double precision') type = 'float';
      
      // Make column name safe by replacing spaces and special chars
      const safeColumnName = column.column_name.replace(/[-\s]/g, '_');
      
      let line = `        ${type} ${safeColumnName}`;
      if (isPK) line += ' PK';
      if (isFK) line += ' FK';
      mermaidDef += line + '\n';
    }
    
    mermaidDef += `    }\n`;
  }

  // Add relationships
  for (const [tableName, tableInfo] of Object.entries(schema)) {
    const safeTableName = tableName.replace(/[-\s]/g, '_');
    const fkConstraints = tableInfo.constraints.filter(c => c.constraint_type === 'FOREIGN KEY');
    for (const fk of fkConstraints) {
      const safeForeignTable = fk.foreign_table_name.replace(/[-\s]/g, '_');
      mermaidDef += `    ${safeForeignTable} ||--o{ ${safeTableName} : has\n`;
    }
  }

  const mermaidFile = `${outputDir}/${dbName}.mmd`;
  await fs.writeFile(mermaidFile, mermaidDef);

  try {
    execSync(`mmdc -i ${mermaidFile} -o ${outputDir}/${dbName}.svg -b '#bce7ff' -w 2000`);
    execSync(`mmdc -i ${mermaidFile} -o ${outputDir}/${dbName}.pdf -b '#bce7ff' -w 2000`);
  } catch (error) {
    console.error('Error generating diagram:', error);
    console.log('Mermaid Definition:', mermaidDef);
  }
}

async function main() {
  // Create timestamped output directory
  const timestamp = new Date().toISOString().split('T')[0];
  const outputDir = `./db-schemas/${timestamp}`;
  await fs.mkdir(outputDir, { recursive: true });

  // Production DB connection (using working config from syncDatabases.js)
  const prodDb = new Sequelize({
    username: "ncymp",
    password: "zoaWhydre4GxT28J494SxA",
    database: "marginal perspective",
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

  // Development DB connection
  const devDb = new Sequelize({
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

  try {
    // Production schema
    const prodTables = await getTableNames(prodDb);
    console.log('Production tables found:', prodTables);
    const prodSchema = {};
    for (const table of prodTables) {
      prodSchema[table] = await getTableSchema(prodDb, table);
    }
    await generateERDiagram(prodSchema, 'prod', outputDir);
    
    // Development schema
    const devTables = await getTableNames(devDb);
    console.log('Development tables found:', devTables);
    const devSchema = {};
    for (const table of devTables) {
      devSchema[table] = await getTableSchema(devDb, table);
    }
    await generateERDiagram(devSchema, 'dev', outputDir);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prodDb.close();
    await devDb.close();
  }

  console.log(`Schema diagrams generated in: ${outputDir}`);
  console.log(`Files created:
- ${outputDir}/dev.pdf
- ${outputDir}/prod.pdf
- ${outputDir}/dev.svg
- ${outputDir}/prod.svg
- ${outputDir}/dev.mmd
- ${outputDir}/prod.mmd`);
}

main().catch(console.error); 