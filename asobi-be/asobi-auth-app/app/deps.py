# app/deps.py
from typing import Optional
import firebase_admin
from firebase_admin import credentials, auth, app_check
from google.cloud import firestore, logging as cloud_logging

# --- Firebase Admin SDK 初期化（起動時に一度だけ） ---
# ローカル: export GOOGLE_APPLICATION_CREDENTIALS="/abs/path/to/service-account.json"
# 本番(Google Cloud): 実行サービスアカウントの権限でOK（鍵ファイル不要）
if not firebase_admin._apps:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)

# --- シングルトン・クライアント ---
_firestore_client: Optional[firestore.Client] = None
_logging_client: Optional[cloud_logging.Client] = None

# --- 検証ヘルパ（= ID/AppCheck トークンの“中身”） ---
def verify_id_token(id_token: str) -> dict:
    """
    Firebase IDトークンを検証し、デコード結果(dict)を返す。
    失敗時は firebase_admin.auth の例外を送出。
    """
    return auth.verify_id_token(id_token)

def verify_app_check_token(token: str) -> dict:
    """
    App Check トークンを検証し、デコード結果(dict)を返す。
    失敗時は firebase_admin.app_check の例外を送出。
    """
    return app_check.verify_token(token)

# --- Firestore / Logging ヘルパ ---
def get_db() -> firestore.Client:
    """Firestore クライアント（シングルトン）を返す。"""
    global _firestore_client
    if _firestore_client is None:
        _firestore_client = firestore.Client()
    return _firestore_client

def get_logger():
    """Cloud Logging ロガー（シングルトン）を返す。"""
    global _logging_client
    if _logging_client is None:
        _logging_client = cloud_logging.Client()
    return _logging_client.logger("asobi-auth-app")

def invites_collection():
    """招待台帳のコレクション参照を返す。"""
    return get_db().collection("invites")
