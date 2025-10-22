const router = require('express').Router();

router.get('/sources', async (req, res) => {
  const db = req.db;
  const list = await db.collection('sources').find({}).project({}).toArray();
  res.json({ list });
});

router.get('/tags', async (req, res) => {
  const db = req.db;
  const list = await db.collection('tags').find({}).project({}).toArray();
  res.json({ list });
});

module.exports = router; 