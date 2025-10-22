const router = require('express').Router();

function getUserId(req) {
  return req.headers['x-user-id'] || 'demo-user';
}

router.get('/list', async (req, res) => {
  const db = req.db;
  const userId = getUserId(req);
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.min(parseInt(req.query.pageSize || '10', 10), 50);

  const logs = await db.collection('history')
    .find({ userId })
    .sort({ ts: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  const ids = logs.map(l => l.contentId);
  const list = await db.collection('contents').find({ _id: { $in: ids } }, { projection: { coverUrl: 0, posterUrl: 0 } }).toArray();
  const hasMore = logs.length === pageSize;

  res.json({ list, hasMore });
});

module.exports = router; 