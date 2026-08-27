import express from 'express';
import { pool } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const cinemaId = req.query.cinema_id;
    const search = (req.query.search || '').trim();
    const params = [];
    const conditions = [];

    if (cinemaId) {
      conditions.push('m.cinema_id = ?');
      params.push(cinemaId);
    }
    if (search) {
      conditions.push('(m.title LIKE ? OR c.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT m.movie_id, m.title, m.cinema_id, c.name AS cinema_name,
              m.duration, m.rating, m.description, m.poster_url
       FROM movies m
       JOIN cinemas c ON c.cinema_id = m.cinema_id
       ${where}
       ORDER BY m.title`,
      params
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load movies.' });
  }
});

router.get('/:id/showtimes', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.showtime_id, s.movie_id, s.cinema_id, s.show_date, s.show_time,
              c.name AS cinema_name, m.title
       FROM showtimes s
       JOIN cinemas c ON c.cinema_id = s.cinema_id
       JOIN movies m ON m.movie_id = s.movie_id
       WHERE s.movie_id = ?
       ORDER BY s.show_date, s.show_time`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load showtimes.' });
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, cinema_id, duration, rating, description, poster_url } = req.body;
    if (!title || !cinema_id || !duration) {
      return res.status(400).json({ message: 'Title, cinema and duration are required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO movies (title, cinema_id, duration, rating, description, poster_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, cinema_id, Number(duration), Number(rating) || 0, description || '', poster_url || '']
    );

    const [rows] = await pool.query(
      `SELECT m.*, c.name AS cinema_name
       FROM movies m JOIN cinemas c ON c.cinema_id=m.cinema_id
       WHERE m.movie_id=?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create movie.' });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, cinema_id, duration, rating, description, poster_url } = req.body;
    await pool.query(
      `UPDATE movies
       SET title=?, cinema_id=?, duration=?, rating=?, description=?, poster_url=?
       WHERE movie_id=?`,
      [title, cinema_id, Number(duration), Number(rating) || 0, description || '', poster_url || '', req.params.id]
    );

    const [rows] = await pool.query(
      `SELECT m.*, c.name AS cinema_name
       FROM movies m JOIN cinemas c ON c.cinema_id=m.cinema_id
       WHERE m.movie_id=?`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update movie.' });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM movies WHERE movie_id = ?', [req.params.id]);
    res.json({ message: 'Movie deleted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not delete movie.' });
  }
});

router.post('/:id/showtimes', authenticate, requireAdmin, async (req, res) => {
  try {
    const { cinema_id, show_date, show_time } = req.body;
    if (!cinema_id || !show_date || !show_time) {
      return res.status(400).json({ message: 'Cinema, date and time are required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO showtimes (movie_id, cinema_id, show_date, show_time)
       VALUES (?, ?, ?, ?)`,
      [req.params.id, cinema_id, show_date, show_time]
    );

    const [rows] = await pool.query('SELECT * FROM showtimes WHERE showtime_id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create showtime.' });
  }
});

export default router;
