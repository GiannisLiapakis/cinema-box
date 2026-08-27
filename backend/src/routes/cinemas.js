import express from 'express';
import { pool } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const like = `%${search}%`;

    const [rows] = await pool.query(
      `SELECT cinema_id, name, location, description, total_seats
       FROM cinemas
       WHERE name LIKE ? OR location LIKE ?
       ORDER BY name`,
      [like, like]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load cinemas.' });
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, location, description, total_seats } = req.body;
    if (!name || !location) return res.status(400).json({ message: 'Name and location are required.' });

    const [result] = await pool.query(
      'INSERT INTO cinemas (name, location, description, total_seats) VALUES (?, ?, ?, ?)',
      [name, location, description || '', Number(total_seats) || 60]
    );

    const [rows] = await pool.query('SELECT * FROM cinemas WHERE cinema_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create cinema.' });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, location, description, total_seats } = req.body;
    await pool.query(
      'UPDATE cinemas SET name=?, location=?, description=?, total_seats=? WHERE cinema_id=?',
      [name, location, description || '', Number(total_seats) || 60, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM cinemas WHERE cinema_id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update cinema.' });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM cinemas WHERE cinema_id = ?', [req.params.id]);
    res.json({ message: 'Cinema deleted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not delete cinema.' });
  }
});

export default router;
