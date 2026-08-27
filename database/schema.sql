CREATE DATABASE IF NOT EXISTS cinema_box
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Run these user commands while logged in as MariaDB root if the app user does not exist.
CREATE USER IF NOT EXISTS 'cinema_box'@'localhost' IDENTIFIED BY 'CinemaBox123!';
CREATE USER IF NOT EXISTS 'cinema_box'@'127.0.0.1' IDENTIFIED BY 'CinemaBox123!';
GRANT ALL PRIVILEGES ON cinema_box.* TO 'cinema_box'@'localhost';
GRANT ALL PRIVILEGES ON cinema_box.* TO 'cinema_box'@'127.0.0.1';
FLUSH PRIVILEGES;

USE cinema_box;

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cinemas (
  cinema_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT,
  total_seats INT NOT NULL DEFAULT 60
);

CREATE TABLE IF NOT EXISTS movies (
  movie_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  cinema_id INT NOT NULL,
  duration INT NOT NULL,
  rating DECIMAL(3,1) DEFAULT 0,
  description TEXT,
  poster_url TEXT,
  FOREIGN KEY (cinema_id) REFERENCES cinemas(cinema_id) ON DELETE CASCADE,
  INDEX idx_movies_cinema (cinema_id)
);

CREATE TABLE IF NOT EXISTS showtimes (
  showtime_id INT AUTO_INCREMENT PRIMARY KEY,
  movie_id INT NOT NULL,
  cinema_id INT NOT NULL,
  show_date DATE NOT NULL,
  show_time TIME NOT NULL,
  FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
  FOREIGN KEY (cinema_id) REFERENCES cinemas(cinema_id) ON DELETE CASCADE,
  INDEX idx_showtimes_movie_date (movie_id, show_date)
);

CREATE TABLE IF NOT EXISTS reservations (
  reservation_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  movie_id INT NOT NULL,
  cinema_id INT NOT NULL,
  showtime_id INT NOT NULL,
  show_date DATE NOT NULL,
  show_time TIME NOT NULL,
  seat_numbers VARCHAR(255) NOT NULL,
  status ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
  FOREIGN KEY (cinema_id) REFERENCES cinemas(cinema_id) ON DELETE CASCADE,
  FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id) ON DELETE CASCADE,
  INDEX idx_reservations_user (user_id),
  INDEX idx_reservations_showtime_status (showtime_id, status)
);

-- Demo cinemas/movies/showtimes are inserted automatically by backend/src/seed.js.
