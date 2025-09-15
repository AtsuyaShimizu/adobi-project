# app/auth.py
from fastapi import Header, HTTPException, status, Depends
from app.deps import verify_id_token, verify_app_check_token

# 本番では True を推奨（ローカル検証時は False で一時緩和可）
REQUIRE_APP_CHECK = True

async def require_app_check(x_firebase_appcheck: str = Header(default=None)):
    """正規クライアント確認（App Check）。"""
    if not REQUIRE_APP_CHECK:
        return True
    if not x_firebase_appcheck:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing app check")
    try:
        verify_app_check_token(x_firebase_appcheck)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid app check")
    return True

async def require_beta_user(
    authorization: str = Header(default=None),
    _appcheck_ok: bool = Depends(require_app_check),
):
    """IDトークン検証 + Custom Claims で role=beta_user を要求。"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing bearer token")
    id_token = authorization.split(" ", 1)[1]
    try:
        decoded = verify_id_token(id_token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid id token")

    if decoded.get("role") != "beta_user":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")
    return decoded  # エンドポイント側で uid/email/role にアクセス可
