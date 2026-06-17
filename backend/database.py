import asyncpg
from config import settings

pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(
            host=settings.pg_host,
            port=settings.pg_port,
            database=settings.pg_db,
            user=settings.pg_user,
            password=settings.pg_password,
            min_size=2,
            max_size=10,
        )
    return pool


async def close_pool() -> None:
    global pool
    if pool:
        await pool.close()
        pool = None
