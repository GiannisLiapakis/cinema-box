import express from 'express';
import { pool } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/user', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.reservation_id, r.movie_id, r.cinema_id, r.showtime_id,
              r.show_date, r.show_time, r.seat_numbers, r.status, r.created_at,
              m.title AS movie_title, c.name AS cinema_name
       FROM reservations r
       JOIN movies m ON m.movie_id=r.movie_id
       JOIN cinemas c ON c.cinema_id=r.cinema_id
       WHERE r.user_id=?
       ORDER BY r.show_date DESC, r.show_time DESC, r.created_at DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load reservations.' });
  }
});

router.get('/all', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });

  try {
    const [rows] = await pool.query(
      `SELECT r.reservation_id, r.show_date, r.show_time, r.seat_numbers, r.status,
              r.created_at, u.username, m.title AS movie_title, c.name AS cinema_name
       FROM reservations r
       JOIN users u ON u.user_id=r.user_id
       JOIN movies m ON m.movie_id=r.movie_id
       JOIN cinemas c ON c.cinema_id=r.cinema_id
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load all reservations.' });
  }
});

router.get('/seats/:showtimeId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT seat_numbers FROM reservations
       WHERE showtime_id=? AND status='confirmed'`,
      [req.params.showtimeId]
    );

    const occupied = [];
    for (const row of rows) {
      String(row.seat_numbers).split(',').map(s => s.trim()).filter(Boolean).forEach(s => occupied.push(s));
    }
    res.json({ occupied });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load occupied seats.' });
  }
});

router.post('/', authenticate, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { movie_id, cinema_id, showtime_id, show_date, show_time, seat_numbers } = req.body;
    if (!movie_id || !cinema_id || !showtime_id || !show_date || !show_time || !Array.isArray(seat_numbers) || !seat_numbers.length) {
      return res.status(400).json({ message: 'Movie, cinema, showtime and at least one seat are required.' });
    }

    const seats = [...new Set(seat_numbers.map(String))].sort();
    await connection.beginTransaction();

    const [existing] = await connection.query(
      `SELECT seat_numbers FROM reservations
       WHERE showtime_id=? AND status='confirmed'
       FOR UPDATE`,
      [showtime_id]
    );

    const occupied = new Set();
    for (const row of existing) {
      String(row.seat_numbers).split(',').map(s => s.trim()).filter(Boolean).forEach(s => occupied.add(s));
    }

    const conflict = seats.find(seat => occupied.has(seat));
    if (conflict) {
      await connection.rollback();
      return res.status(409).json({ message: `Seat ${conflict} is already reserved.` });
    }

    const [result] = await connection.query(
      `INSERT INTO reservations
       (user_id, movie_id, cinema_id, showtime_id, show_date, show_time, seat_numbers)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.userId, movie_id, cinema_id, showtime_id, show_date, show_time, seats.join(',')]
    );

    await connection.commit();
    res.status(201).json({ reservation_id: result.insertId, seats });
  } catch (error) {
    try { await connection.rollback(); } catch {}
    console.error(error);
    res.status(500).json({ message: 'Could not create reservation.' });
  } finally {
    connection.release();
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { seat_numbers } = req.body;
    if (!Array.isArray(seat_numbers) || !seat_numbers.length) {
      return res.status(400).json({ message: 'Select at least one seat.' });
    }

    const [owned] = await pool.query(
      'SELECT * FROM reservations WHERE reservation_id=? AND user_id=? AND status="confirmed"',
      [req.params.id, req.user.userId]
    );
    if (!owned.length) return res.status(404).json({ message: 'Reservation not found.' });

    const [result] = await pool.query(
      'UPDATE reservations SET seat_numbers=? WHERE reservation_id=? AND user_id=?',
      [[...new Set(seat_numbers.map(String))].sort().join(','), req.params.id, req.user.userId]
    );

    res.json({ message: 'Reservation updated.', changed: result.affectedRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update reservation.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE reservations
       SET status='cancelled'
       WHERE reservation_id=? AND user_id=? AND status='confirmed'`,
      [req.params.id, req.user.userId]
    );

    if (!result.affectedRows) return res.status(404).json({ message: 'Reservation not found.' });
    res.json({ message: 'Reservation cancelled.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not cancel reservation.' });
  }
});

export default router;
