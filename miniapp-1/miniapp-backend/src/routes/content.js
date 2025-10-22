const router = require('express').Router();
const dayjs = require('dayjs');

router.get('/list', async (req, res) => {
  const db = req.db;
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.min(parseInt(req.query.pageSize || '10', 10), 50);

  const filter = {};
  const campus = req.query.campus || 'all';
  if (campus && campus !== 'all') filter.campus = campus;
  if (req.query.type) filter.category = req.query.type;

  if (req.query.timeRange === 'today') {
    filter.publishTime = { $gte: dayjs().startOf('day').valueOf() };
  } else if (req.query.timeRange === 'week') {
    filter.publishTime = { $gte: dayjs().startOf('week').valueOf() };
  } else if (req.query.timeRange === 'month') {
    filter.publishTime = { $gte: dayjs().startOf('month').valueOf() };
  }
  if (req.query.q) filter.$text = { $search: req.query.q };

  const sort = req.query.sort === 'hottest' ? { hotScore: -1, publishTime: -1 } : { publishTime: -1 };

  const cursor = db.collection('contents')
    .find(filter, { projection: { coverUrl: 0, posterUrl: 0 } })
    .sort(sort)
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  const list = await cursor.toArray();
  const hasMore = list.length === pageSize;
  res.json({ list, hasMore });
});

router.get('/detail', async (req, res) => {
  const db = req.db;
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'id is required' });
  const detail = await db.collection('contents').findOne({ _id: id })
    || await db.collection('contents').findOne({ _id: { $eq: id } });
  res.json({ detail: detail || {} });
});

module.exports = router; 