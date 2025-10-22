const router = require('express').Router();

function checkKey(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return token && token === process.env.API_INGEST_KEY;
}

router.post('/content', async (req, res) => {
  if (!checkKey(req)) return res.status(401).json({ error: 'unauthorized' });
  const db = req.db;
  const body = req.body || {};

  const doc = {
    externalId: body.externalId,
    title: (body.title || '').trim(),
    summary: (body.summary || '').trim(),
    sourceId: body.sourceId || '',
    sourceName: body.sourceName || '',
    campus: body.campus || 'all',
    category: body.category || '',
    tags: Array.isArray(body.tags) ? body.tags : [],
    publishTime: Number(body.publishTime) || Date.now(),
    createdAt: Number(body.createdAt) || Date.now(),
    sourceUrl: body.sourceUrl || '',
  };

  const filter = doc.externalId ? { externalId: doc.externalId } : (doc.sourceUrl ? { sourceUrl: doc.sourceUrl } : null);
  if (!filter) return res.status(400).json({ error: 'externalId or sourceUrl required' });

  await db.collection('contents').updateOne(filter, { $set: doc, $setOnInsert: { _id: doc.externalId || doc.sourceUrl } }, { upsert: true });
  res.json({ ok: true });
});

module.exports = router; 