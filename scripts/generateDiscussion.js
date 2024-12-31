import { Sequelize, DataTypes } from 'sequelize';
import readline from 'readline';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { setTimeout } from 'timers/promises';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Rate limiting settings
const MAX_RETRIES = 3;
const RETRY_DELAY = 20000; // 20 seconds
const TPM_LIMIT = 3; // tokens per minute limit
let lastCallTime = 0;

async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  const minTimeBetweenCalls = (60 / TPM_LIMIT) * 1000; // minimum ms between calls

  if (timeSinceLastCall < minTimeBetweenCalls) {
    const waitTime = minTimeBetweenCalls - timeSinceLastCall;
    console.log(`Rate limiting: waiting ${waitTime/1000} seconds...`);
    await setTimeout(waitTime);
  }
  
  lastCallTime = Date.now();
}

const db = new Sequelize('postgresql://ncymp:zoaWhydre4GxT28J494SxA@chocolate-chip-14096.7tt.aws-us-east-1.cockroachlabs.cloud:26257/mp2', {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: console.log // Enable query logging
});

// Define Article model
const Article = db.define('Article', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  url: DataTypes.STRING,
  type: DataTypes.STRING,
  scope: DataTypes.STRING,
  content: DataTypes.TEXT,
  userId: DataTypes.INTEGER,
  submitDate: DataTypes.DATE
}, {
  tableName: 'Articles',
  timestamps: false
});

async function getNextArticleId() {
  const [result] = await db.query(
    'SELECT MAX(id) + 1 as next_id FROM "Articles"'
  );
  return result[0].next_id || 1;
}

async function createArticle(url) {
  console.log('Creating article...');
  try {
    const nextId = await getNextArticleId();
    console.log('Using ID:', nextId);

    const [result] = await db.query(`
      INSERT INTO "Articles" (
        "id", "url", "type", "scope", "content", "userId", "submitDate"
      ) VALUES (
        :id, :url, 'news', 'public', 'Trump picks for FDA, CDC, and Surgeon General', 1, CURRENT_TIMESTAMP
      ) RETURNING "id"
    `, {
      replacements: { 
        id: nextId,
        url 
      }
    });
    
    console.log('Article created:', result[0].id);
    return result[0].id;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

async function generateDiscussionWithRetry(url, perspectives, tone) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await waitForRateLimit();
      
      console.log(`Generating discussion (attempt ${attempt})...`);
      const prompt = `
        Create a discussion about Trump's picks for FDA, CDC and Surgeon General.
        Using these perspectives: ${perspectives.join(', ')}
        Tone should be: ${tone}
        
        Each comment should be realistic and reflect the perspective's background.
        Format as JSON array with:
        {
          perspective_id: number,
          content: string,
          upvotes: number,
          parent_id: null or number
        }
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are generating realistic discussion threads for a perspective-based social platform." },
          { role: "user", content: prompt }
        ]
      });

      return JSON.parse(completion.choices[0].message.content);
      
    } catch (error) {
      if (error.status === 429 && attempt < MAX_RETRIES) {
        console.log(`Rate limit hit. Waiting ${RETRY_DELAY/1000} seconds before retry...`);
        await setTimeout(RETRY_DELAY);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

async function insertDiscussion(articleId, comments) {
  console.log('Inserting discussion...');
  for (const comment of comments) {
    await db.query(`
      INSERT INTO "Comments" (
        "text", "userId", "articleId", "perspectiveId", 
        "upvotes", "downvotes", "parentID", "replyCount",
        "createdAt", "updatedAt"
      ) VALUES (
        :content, 1, :articleId, :perspectiveId,
        :upvotes, 0, :parentId, 0,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `, {
      replacements: {
        content: comment.content,
        articleId,
        perspectiveId: comment.perspective_id,
        upvotes: comment.upvotes,
        parentId: comment.parent_id
      }
    });
  }
}

async function main() {
  const url = 'https://www.npr.org/sections/shots-health-news/2024/11/23/nx-s1-5203461/trump-nesheiwat-makary-weldon-fda-cdc';
  
  try {
    console.log('Starting process...');
    const articleId = await createArticle(url);
    console.log('Article ID:', articleId);

    const perspectives = [1, 2]; // Denison Alumni and Doctor
    const tone = 'professional';

    const discussion = await generateDiscussionWithRetry(url, perspectives, tone);
    console.log('Generated discussion:', discussion);

    await insertDiscussion(articleId, discussion);
    console.log('Discussion inserted successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.close();
  }
}

main(); 