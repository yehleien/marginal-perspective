import express from 'express';
import { Sequelize } from 'sequelize';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// JWT auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

// Serve index.html for all routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Protected admin routes
app.get('/api/schema', authMiddleware, async (req, res) => {
  try {
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/table/:name', authMiddleware, async (req, res) => {
  try {
    const [data] = await sequelize.query(`
      SELECT * FROM "${req.params.name}" 
      LIMIT 100
    `);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add edit endpoint
app.put('/api/table/:table/:id', authMiddleware, async (req, res) => {
  try {
    const { table, id } = req.params;
    const updates = req.body;
    
    const updateFields = Object.keys(updates)
      .map(key => `"${key}" = :${key}`)
      .join(', ');
    
    await sequelize.query(
      `UPDATE "${table}" SET ${updateFields} WHERE id = :id`,
      {
        replacements: { ...updates, id },
        type: Sequelize.QueryTypes.UPDATE
      }
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this catch-all route at the end
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => {
  console.log(`Admin server running on port ${PORT}`);
}); 