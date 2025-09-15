# app/auth.py
from fastapi import Header, HTTPException, status, Depends
from app.deps import verify_id_token, verify_app_check_token

# 本番環境では True を推奨（ローカル開発で App Check をスキップしたい場合は False）
REQUIRE_APP_CHECK = True


async def require_app_check(x_firebase_appcheck: str = Header(default=None)):
    """
    Firebase App Check トークンを検証する依存関数。
    - ヘッダー: X-Firebase-AppCheck: <app_check_token>
    - 本番では必須。ローカルでは REQUIRE_APP_CHECK=False で緩和可能。
    """
    if not REQUIRE_APP_CHECK:
        return True

    if not x_firebase_appcheck:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing app check",
        )

    try:
        verify_app_check_token(x_firebase_appcheck)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid app check",
        )

    return True


async def require_beta_user(
    authorization: str = Header(default=None),
    _appcheck_ok: bool = Depends(require_app_check),
):
    """
    Firebase ID トークンを検証し、role=beta_user を持つユーザのみ許可する依存関数。
    - ヘッダー: Authorization: Bearer <id_token>
    - App Check が有効な場合、先に require_app_check が走る
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing bearer token",
        )

    id_token = authorization.split(" ", 1)[1]

    try:
        decoded = verify_id_token(id_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid id token",
        )

    if decoded.get("role") != "beta_user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="forbidden",
        )

    # decoded には uid / email / role 等が含まれる
    return decoded
