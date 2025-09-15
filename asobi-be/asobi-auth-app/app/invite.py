# app/invite.py
from datetime import datetime, timedelta
import os
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
import httpx

from app.deps import invites_collection, get_logger

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_API_TOKEN = os.getenv("ADMIN_API_TOKEN", "changeme")


class InviteRequest(BaseModel):
    email: EmailStr
    expires_in_days: int = Field(default=7, gt=0)
    note: str | None = None


class InviteResponse(BaseModel):
    email: EmailStr
    expires_at: datetime
    status: str
    note: str | None = None


def require_admin(x_admin_token: str = Header(default=None)):
    if x_admin_token != ADMIN_API_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="unauthorized")
    return True


async def send_invite_email(email: str, expires_at: datetime, note: str | None = None):
    endpoint = os.getenv("MAILER_ENDPOINT")
    message = {
        "to": email,
        "subject": "Invite to Asobi",
        "body": f"You are invited. Expires at {expires_at.isoformat()}",
    }
    if not endpoint:
        # 環境変数が無ければログ出力のみ
        logger = get_logger()
        logger.log_text(f"[MailerStub] {message}")
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.post(endpoint, json=message, timeout=10)
    except Exception as exc:  # 通信失敗時も例外は投げずログに記録
        logger = get_logger()
        logger.log_text(f"failed to call mailer: {exc}", severity="ERROR")


@router.post("/invites", response_model=InviteResponse)
async def create_invite(payload: InviteRequest, _=Depends(require_admin)):
    col = invites_collection()
    now = datetime.utcnow()
    expires_at = now + timedelta(days=payload.expires_in_days)
    doc = {
        "email": payload.email,
        "status": "pending",
        "note": payload.note,
        "created_at": now,
        "expires_at": expires_at,
    }
    col.document(payload.email).set(doc)
    await send_invite_email(payload.email, expires_at, payload.note)
    logger = get_logger()
    logger.log_text(f"invite created for {payload.email}")
    return InviteResponse(email=payload.email, expires_at=expires_at, status="pending", note=payload.note)


@router.get("/invites/{email}", response_model=InviteResponse)
async def get_invite(email: str, _=Depends(require_admin)):
    doc = invites_collection().document(email).get()
    if not doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="not found")
    data = doc.to_dict()
    return InviteResponse(
        email=email,
        expires_at=data.get("expires_at"),
        status=data.get("status", "unknown"),
        note=data.get("note"),
    )
