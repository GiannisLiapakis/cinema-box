import bcrypt from 'bcryptjs';
import { pool } from './db.js';

export async function seedDatabase() {
  const [cinemas] = await pool.query('SELECT COUNT(*) AS count FROM cinemas');
  if (cinemas[0].count === 0) {
    await pool.query(
      `INSERT INTO cinemas (name, location, description, total_seats)
       VALUES
       (?, ?, ?, ?),
       (?, ?, ?, ?)`,
      [
        'Cinema Box Central', 'Heraklion', 'Cinema Box flagship cinema.', 60,
        'Cinema Box Galaxy', 'Chania', 'Modern cinema with premium seats.', 80
      ]
    );
  }

  const [movies] = await pool.query('SELECT COUNT(*) AS count FROM movies');
  if (movies[0].count === 0) {
    await pool.query(
      `INSERT INTO movies
       (title, cinema_id, duration, rating, description, poster_url)
       VALUES
       (?, 1, ?, ?, ?, ?),
       (?, 1, ?, ?, ?, ?),
       (?, 2, ?, ?, ?, ?)`,
      [
        'The Last Horizon', 128, 8.4, 'An epic science-fiction adventure.', '',
        'Midnight City', 105, 7.9, 'A mystery in a city that never sleeps.', '',
        'Ocean Quest', 112, 8.1, 'A team searches for a legendary treasure.', ''
      ]
    );
  }

  const [showtimes] = await pool.query('SELECT COUNT(*) AS count FROM showtimes');
  if (showtimes[0].count === 0) {
    await pool.query(
      `INSERT INTO showtimes (movie_id, cinema_id, show_date, show_time)
       VALUES
       (1, 1, CURDATE(), '18:00:00'),
       (1, 1, CURDATE(), '21:00:00'),
       (2, 1, CURDATE(), '19:30:00'),
       (3, 2, CURDATE(), '20:00:00')`
    );
  }

  const adminHash = await bcrypt.hash('liapakis', 10);
  const userHash = await bcrypt.hash('12345', 10);

  await pool.query(
    `INSERT INTO users (username, name, email, password, role)
     VALUES (?, ?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE
       password = VALUES(password),
       role = 'admin'`,
    ['giannis', 'Giannis Admin', 'giannis@cinemabox.local', adminHash]
  );

  await pool.query(
    `INSERT INTO users (username, name, email, password, role)
     VALUES (?, ?, ?, ?, 'user')
     ON DUPLICATE KEY UPDATE
       password = VALUES(password),
       role = 'user'`,
    ['gian', 'Gian User', 'gian@cinemabox.local', userHash]
  );
}
