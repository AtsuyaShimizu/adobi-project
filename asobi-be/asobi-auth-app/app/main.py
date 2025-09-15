# app/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.auth import require_beta_user

app = FastAPI(title="Asobi Auth App (Minimum)")

# CORS（必要な出自だけに絞る）
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    # "https://your-frontend.example.com",  # 本番ドメインを追加
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

# 守られたサンプルAPI（role=beta_user 必須）
@app.get("/demo/data")
async def demo_data(user=Depends(require_beta_user)):
    return {
        "videos": [
            {"id": "demo-1", "title": "Sample Demo 1"},
            {"id": "demo-2", "title": "Sample Demo 2"},
        ],
        "who": {"uid": user["uid"], "email": user.get("email"), "role": user.get("role")},
    }
