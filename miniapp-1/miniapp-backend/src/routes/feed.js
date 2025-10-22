const router = require('express').Router();

router.get('/recommend', async (req, res) => {
  const db = req.db;
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.min(parseInt(req.query.pageSize || '10', 10), 50);

  const cursor = db.collection('contents')
    .find({}, { projection: { coverUrl: 0, posterUrl: 0 } })
    .sort({ publishTime: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  const list = await cursor.toArray();
  const hasMore = list.length === pageSize;
  res.json({ list, hasMore });
});

module.exports = { router }; 