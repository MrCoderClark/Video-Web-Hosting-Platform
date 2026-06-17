"""One-shot script to apply migration 003."""
import asyncio
import asyncpg


async def main():
    conn = await asyncpg.connect(
        "postgresql://postgres.wvnczxaupnqdigzfmkjo:r00tadmin@127.0.0.1:6543/postgres"
    )
    sql = open("../supabase/migrations/003_visibility_views.sql").read()
    await conn.execute(sql)
    print("Migration 003 applied successfully.")
    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
