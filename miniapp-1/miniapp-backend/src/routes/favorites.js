const router = require('express').Router();

function getUserId(req) {
  return req.headers['x-user-id'] || 'demo-user';
}

router.get('/list', async (req, res) => {
  const db = req.db;
  const userId = getUserId(req);
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.min(parseInt(req.query.pageSize || '10', 10), 50);

  const favs = await db.collection('favorites')
    .find({ userId })
    .sort({ _id: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  const contentIds = favs.map(f => f.contentId);
  const list = await db.collection('contents').find({ _id: { $in: contentIds } }, { projection: { coverUrl: 0, posterUrl: 0 } }).toArray();
  const hasMore = favs.length === pageSize;
  res.json({ list, hasMore });
});

module.exports = router; 