const router = require('express').Router();

function getUserId(req) {
  return req.headers['x-user-id'] || 'demo-user';
}

router.post('/get', async (req, res) => {
  const db = req.db;
  const userId = getUserId(req);
  const doc = await db.collection('subscriptions').findOne({ userId }) || { sourceIds: [], tagIds: [] };
  res.json(doc);
});

router.post('/set', async (req, res) => {
  const db = req.db;
  const userId = getUserId(req);
  const sourceIds = Array.isArray(req.body.sourceIds) ? req.body.sourceIds : [];
  await db.collection('subscriptions').updateOne(
    { userId },
    { $set: { userId, sourceIds } },
    { upsert: true }
  );
  res.json({ ok: true });
});

module.exports = router; 