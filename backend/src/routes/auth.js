import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { userId: user.user_id, username: user.username, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { username, name, email, password } = req.body;

    if (!username || !name || !email || !password) {
      return res.status(400).json({ message: 'Username, name, email and password are required.' });
    }
    if (password.length < 5) {
      return res.status(400).json({ message: 'Password must contain at least 5 characters.' });
    }

    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username.trim(), email.trim()]
    );

    if (existing.length) {
      return res.status(409).json({ message: 'Username or email already exists.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [username.trim(), name.trim(), email.trim(), hash, 'user']
    );

    const user = {
      user_id: result.insertId,
      username: username.trim(),
      name: name.trim(),
      role: 'user'
    };

    res.status(201).json({ token: createToken(user), user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const [rows] = await pool.query(
      'SELECT user_id, username, name, email, password, role FROM users WHERE username = ? LIMIT 1',
      [username.trim()]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    delete user.password;
    res.json({ token: createToken(user), user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed.' });
  }
});

export default router;
