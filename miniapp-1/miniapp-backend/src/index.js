require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');

const contentRoutes = require('./routes/content');
const metaRoutes = require('./routes/meta');
const favoritesRoutes = require('./routes/favorites');
const subscribeRoutes = require('./routes/subscribe');
const ingestRoutes = require('./routes/ingest');
const historyRoutes = require('./routes/history');

const app = express();
app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    req.db = await initDb();
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db_connection_failed' });
  }
});

app.use('/content', contentRoutes);
app.use('/meta', metaRoutes);
app.use('/favorites', favoritesRoutes);
app.use('/user/subscribe', subscribeRoutes);
app.use('/ingest', ingestRoutes);
app.use('/history', historyRoutes);

// 补充直达路由，兼容前端 callApi('feed/recommend') 和 'user/favorite/toggle'
const { router: feedRouter } = require('./routes/feed');
app.use('/feed', feedRouter);
const { router: userRouter } = require('./routes/user');
app.use('/user', userRouter);

app.get('/health', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on :${port}`)); 