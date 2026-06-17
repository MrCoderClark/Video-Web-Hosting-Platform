from fastapi import APIRouter, Depends

from auth import get_current_user
from database import get_pool

router = APIRouter(tags=["users"])


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT id, display_name, avatar_url, created_at FROM videohost.profiles WHERE id = $1",
        current_user["id"],
    )
    if row:
        return {
            "id": str(row["id"]),
            "display_name": row["display_name"],
            "avatar_url": row["avatar_url"],
            "email": current_user["email"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
        }
    # Profile doesn't exist yet — return basic info from token
    return {
        "id": current_user["id"],
        "display_name": None,
        "avatar_url": None,
        "email": current_user["email"],
        "created_at": None,
    }
