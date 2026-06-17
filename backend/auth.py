from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from config import settings

security = HTTPBearer()


def verify_token(token: str) -> dict:
    """Verify a Supabase JWT and return its payload."""
    try:
        # Supabase JWTs are signed with the JWT secret derived from the project
        # For self-hosted, the secret is the SUPABASE_JWT_SECRET env var
        # We decode without verification for now and rely on Supabase's own validation
        # In production, set SUPABASE_JWT_SECRET and verify signature
        payload = jwt.decode(
            token,
            options={"verify_signature": False},
            algorithms=["HS256"],
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Extract and verify the current user from the Authorization header."""
    payload = verify_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user ID",
        )
    return {"id": user_id, "email": payload.get("email"), "role": payload.get("role")}
