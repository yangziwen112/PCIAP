import time
import json
import hashlib
import requests

# 請將此配置為你後端的接收端點，該端點應負責寫入 DB
INGEST_URL = 'https://your-backend.example.com/ingest/content'
API_KEY = 'REPLACE_WITH_SECRET'

HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {API_KEY}',
}

CATEGORY_MAP = {
    '競賽': 'competition',
    '競賽類': 'competition',
    '教資': 'teacher-cert',
    '教師資格': 'teacher-cert',
    '講座': 'academic',
    '學術': 'academic',
    '招聘': 'recruit',
    '實習': 'recruit',
    '文體': 'sports',
    '體育': 'sports',
    '通知': 'notice',
}

CAMPUS_MAP = {
    '海淀': 'haidian',
    '丰台': 'fengtai',
    '全部': 'all',
}

def normalize_category(raw: str) -> str:
    if not raw:
        return ''
    raw = raw.strip().lower()
    for k, v in CATEGORY_MAP.items():
        if k.lower() in raw:
            return v
    return ''


def normalize_campus(raw: str) -> str:
    if not raw:
        return 'all'
    raw = raw.strip().lower()
    for k, v in CAMPUS_MAP.items():
        if k.lower() in raw:
            return v
    return 'all'


def to_ts(suggested_ts: int | None) -> int:
    if isinstance(suggested_ts, int) and suggested_ts > 0:
        return suggested_ts
    return int(time.time() * 1000)


def upsert_content(item: dict) -> None:
    payload = {
        'externalId': item.get('externalId') or hashlib.md5(item.get('url', '').encode('utf-8')).hexdigest(),
        'title': item.get('title', '').strip(),
        'summary': item.get('summary', '').strip(),
        'coverUrl': item.get('coverUrl', ''),
        'sourceId': item.get('sourceId', ''),
        'sourceName': item.get('sourceName', ''),
        'campus': normalize_campus(item.get('campus', 'all')),
        'category': normalize_category(item.get('category', '')),
        'tags': item.get('tags', []),
        'publishTime': to_ts(item.get('publishTime')),
        'createdAt': to_ts(item.get('createdAt')),
        'sourceUrl': item.get('url', ''),
    }
    resp = requests.post(INGEST_URL, headers=HEADERS, data=json.dumps(payload), timeout=15)
    resp.raise_for_status()


def run():
    # TODO: 將此處替換為實際抓取邏輯
    sample_items = [
        {
            'title': '校園編程競賽報名開始',
            'summary': '第十五屆校園編程競賽開放報名，歡迎參與',
            'url': 'https://example.edu/a1',
            'sourceId': 'source_cs_dept',
            'sourceName': '計算機學院官網',
            'campus': '海淀',
            'category': '競賽類',
            'tags': ['ACM', '算法'],
            'publishTime': int(time.time() * 1000),
        }
    ]
    for it in sample_items:
        upsert_content(it)


if __name__ == '__main__':
    run() 