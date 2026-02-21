require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Route imports
const financeRoutes = require('./routes/finances');
const inventoryRoutes = require('./routes/inventory');
const taskRoutes = require('./routes/tasks');
const profileRoutes = require('./routes/profiles');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & Middleware ──────────────────────────────
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// CORS — allow Vercel frontend
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Routes ─────────────────────────────────────────────
app.use('/api/profiles', profileRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/tasks', taskRoutes);

const techParkRoutes = require('./routes/techPark');
app.use('/api/tech-park', techParkRoutes);

const startupsRoutes = require('./routes/startups');
app.use('/api/startups', startupsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Centralized Error Handling ─────────────────────────
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ── Start Server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`AI4Business backend running on port ${PORT}`);
});
