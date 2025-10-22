const router = require('express').Router();

function getUserId(req) {
  return req.headers['x-user-id'] || 'demo-user';
}

router.post('/favorite/toggle', async (req, res) => {
  const db = req.db;
  const userId = getUserId(req);
  const contentId = req.body.contentId;
  if (!contentId) return res.status(400).json({ error: 'contentId is required' });

  const exists = await db.collection('favorites').findOne({ userId, contentId });
  if (exists) {
    await db.collection('favorites').deleteOne({ userId, contentId });
  } else {
    await db.collection('favorites').insertOne({ userId, contentId, ts: Date.now() });
  }
  res.json({ ok: true });
});

module.exports = { router }; 