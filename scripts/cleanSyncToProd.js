import { homedir } from 'os';
import { join } from 'path';
import fs from 'fs';
import { Sequelize } from 'sequelize';

const certPath = join(homedir(), '.postgresql', 'root.crt');
const certContent = fs.readFileSync(certPath);

const sourceDb = new Sequelize('postgresql://ncymp:zoaWhydre4GxT28J494SxA@chocolate-chip-14096.7tt.aws-us-east-1.cockroachlabs.cloud:26257/mp2', {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      ca: certContent
    }
  }
});

const targetDb = new Sequelize('postgresql://ncymp:zoaWhydre4GxT28J494SxA@chocolate-chip-14096.7tt.aws-us-east-1.cockroachlabs.cloud:26257/defaultdb', {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      ca: certContent
    }
  }
});

async function createTables(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS "Users" (
      "id" bigint PRIMARY KEY,
      "email" text NOT NULL,
      "password" text NOT NULL,
      "username" text NOT NULL,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "Perspectives" (
      "perspectiveId" bigint PRIMARY KEY,
      "userId" bigint NOT NULL,
      "type" character varying NOT NULL,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL,
      "options" jsonb,
      "verificationMethod" text,
      "verificationDate" timestamp with time zone,
      "activityScore" integer DEFAULT 0,
      "expertiseYears" integer,
      "organization" text,
      "verificationDocuments" text[],
      "verificationStatus" text DEFAULT 'pending',
      "categoryType" text
    );

    CREATE INDEX IF NOT EXISTS "perspectives_userid_idx" ON "Perspectives"("userId");
  `);
}

async function copyData() {
  try {
    console.log('Connecting to databases...');
    await targetDb.authenticate();
    await sourceDb.authenticate();
    console.log('Connected to both databases');

    console.log('Getting data from source...');
    const [users] = await targetDb.query('SELECT * FROM "Users"');
    const [perspectives] = await targetDb.query('SELECT * FROM "Perspectives"');

    console.log('Creating tables in target database...');
    await createTables(sourceDb);

    console.log('Copying Users...');
    if (users.length > 0) {
      await sourceDb.query('INSERT INTO "Users" ("id","email","password","username","createdAt","updatedAt") VALUES ' + 
        users.map(u => `(${u.id},'${u.email}','${u.password}','${u.username}','${u.createdAt}','${u.updatedAt}')`).join(',')
      );
    }

    console.log('Copying Perspectives...');
    if (perspectives.length > 0) {
      await sourceDb.query('INSERT INTO "Perspectives" ("perspectiveId","userId","type","createdAt","updatedAt","options","verificationMethod","verificationDate","activityScore","expertiseYears","organization","verificationDocuments","verificationStatus","categoryType") VALUES ' +
        perspectives.map(p => `(${p.perspectiveId},${p.userId},'${p.type}','${p.createdAt}','${p.updatedAt}',${p.options ? `'${JSON.stringify(p.options)}'` : 'NULL'},'${p.verificationMethod || ''}',${p.verificationDate ? `'${p.verificationDate}'` : 'NULL'},${p.activityScore || 0},${p.expertiseYears || 'NULL'},'${p.organization || ''}',${p.verificationDocuments ? `ARRAY['${p.verificationDocuments.join("','")}']` : 'NULL'},'${p.verificationStatus || 'pending'}','${p.categoryType || ''}')`).join(',')
      );
    }

    console.log('Data copy complete');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sourceDb.close();
    await targetDb.close();
  }
}

copyData(); 