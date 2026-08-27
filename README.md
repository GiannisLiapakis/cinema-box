# Cinema Box 🎬

Mobile/Web cinema booking application built with Expo + React Native, Node.js + Express and MariaDB.

## Demo accounts

### Admin
- Username: `giannis`
- Password: `liapakis`

### User
- Username: `gian`
- Password: `12345`

The backend automatically creates these accounts on startup if they do not already exist. Passwords are stored hashed with bcryptjs.

## Requirements

- Node.js 20+
- MariaDB 10.6+ / 11 / 12
- npm
- Expo CLI through `npx`

## 1. Database

Create the database and tables:

```sql
SOURCE database/schema.sql;
```

Or open `database/schema.sql` in HeidiSQL/phpMyAdmin/MariaDB client and run it.

The application uses database:

`cinema_box`

## 2. Backend

Open PowerShell:

```powershell
cd C:\Users\User\Downloads\cinema-box\backend
npm install
npm run dev
```

The API runs on:

`http://localhost:4000`

The backend binds to `0.0.0.0`, so another device on the same Wi-Fi can use your computer's local IP.

## 3. Frontend Web

Open a second PowerShell:

```powershell
cd C:\Users\User\Downloads\cinema-box\frontend
npm install
npx expo start --web
```

Expo Web is started with `npx expo start --web`.

If you specifically type `npx expo run --web`, Expo may reject the command because `run` is for native platform builds. For browser testing use `npx expo start --web`.

## Local IP / phone

For the browser on the same PC, the default API URL is:

`http://localhost:4000/api`

For a physical phone on the same Wi-Fi, copy `.env.example` to `.env` and set:

`EXPO_PUBLIC_API_URL=http://YOUR-PC-LOCAL-IP:4000/api`

Example:

`EXPO_PUBLIC_API_URL=http://192.168.1.25:4000/api`

The backend already listens on `0.0.0.0`.

## Features

### User
- Register
- Login with JWT
- Browse cinemas
- Search cinemas/movies
- View movies and showtimes
- Select seats
- Create reservation
- View reservation history
- Cancel future reservation
- Logout

### Admin
- Login as admin
- Admin-only dashboard
- View movies
- Add movie
- Edit movie
- Delete movie
- Add cinema
- Edit cinema
- Delete cinema
- View all reservations

## Project structure

```text
cinema-box/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── db.js
│   │   ├── seed.js
│   │   ├── middleware/auth.js
│   │   ├── routes/auth.js
│   │   ├── routes/cinemas.js
│   │   ├── routes/movies.js
│   │   ├── routes/reservations.js
│   │   └── routes/admin.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── App.js
│   ├── api.js
│   ├── app.json
│   ├── .env
│   └── package.json
├── database/
│   └── schema.sql
└── README.md
```

## MariaDB connection

The backend `.env` is configured for:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=cinema_box
DB_USER=cinema_box
DB_PASSWORD=CinemaBox123!
```

If you followed the previous setup, the `cinema_box` MariaDB user should already exist. If not, run the user section at the top of `database/schema.sql` while logged in as root.

## Important

Do not put a real production database password or JWT secret into a public GitHub repository. The values in this project are development/demo credentials only.
