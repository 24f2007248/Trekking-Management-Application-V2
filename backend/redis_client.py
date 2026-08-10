import json
import redis

redis_cache = redis.Redis(
    host="localhost",
    port=6379,
    db=1,
    decode_responses=True
)

CACHE_EXPIRY = 300


def get_cache(key):
    data = redis_cache.get(key)
    if data:
        return json.loads(data)
    return None


def set_cache(key, value, expiry=CACHE_EXPIRY):
    redis_cache.setex(
        key,
        expiry,
        json.dumps(value)
    )


def delete_cache(key):
    redis_cache.delete(key)


def clear_trek_cache():
    keys = redis_cache.keys("treks:*")
    if keys:
        redis_cache.delete(*keys)