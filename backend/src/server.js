import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testDb } from './db.js';
import { seedDatabase } from './seed.js';
import authRoutes from './routes/auth.js';
import cinemaRoutes from './routes/cinemas.js';
import movieRoutes from './routes/movies.js';
import reservationRoutes from './routes/reservations.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({ app: 'Cinema Box API', status: 'ok' });
});

app.get('/api/health', async (req, res) => {
  try {
    await testDb();
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/cinemas', cinemaRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error.' });
});

async function start() {
  try {
    await testDb();
    await seedDatabase();

    app.listen(PORT, HOST, () => {
      console.log(`Cinema Box API running on http://localhost:${PORT}`);
      console.log(`Network access enabled on ${HOST}:${PORT}`);
      console.log('Demo admin: giannis / liapakis');
      console.log('Demo user: gian / 12345');
    });
  } catch (error) {
    console.error('MariaDB connection failed.');
    console.error(error.message);
    console.error('Check backend/.env, MariaDB service, database and cinema_box user.');
    process.exit(1);
  }
}

start();
