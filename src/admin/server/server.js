import express from 'express';
import { Sequelize } from 'sequelize';
import session from 'express-session';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3001;

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

// Use existing database connection from models/index.js
import db from '../../models/index.js';
const { sequelize } = db;

// Protected admin routes
app.get('/api/schema', authMiddleware, async (req, res) => {
  const tables = await sequelize.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  res.json(tables);
});

app.get('/api/table/:name', authMiddleware, async (req, res) => {
  const data = await sequelize.query(`
    SELECT * FROM "${req.params.name}" 
    LIMIT 100
  `);
  res.json(data);
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

app.listen(PORT, () => {
  console.log(`Admin server running on port ${PORT}`);
}); 