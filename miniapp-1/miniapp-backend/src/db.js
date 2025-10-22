const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'miniapp';

const client = new MongoClient(uri, { maxPoolSize: 20 });

let db;
async function initDb() {
  if (db) return db;
  await client.connect();
  db = client.db(dbName);

  await db.collection('contents').createIndexes([
    { key: { publishTime: -1, category: 1, campus: 1 }, name: 'idx_contents_sort_filter' },
    { key: { title: 'text', summary: 'text' }, name: 'idx_contents_text' },
    { key: { externalId: 1 }, name: 'uk_externalId', unique: true, sparse: true },
    { key: { sourceUrl: 1 }, name: 'uk_sourceUrl', unique: true, sparse: true }
  ]);

  await db.collection('favorites').createIndex({ userId: 1, contentId: 1 }, { unique: true, name: 'uk_user_content' });
  await db.collection('history').createIndex({ userId: 1, ts: -1 }, { name: 'idx_history_user_ts' });
  await db.collection('subscriptions').createIndex({ userId: 1 }, { unique: true, name: 'uk_sub_user' });

  return db;
}

module.exports = { initDb }; 