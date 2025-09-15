# app/deps.py
import firebase_admin
from firebase_admin import credentials, auth, app_check
from google.cloud import firestore, logging as cloud_logging

# ★ ローカル開発では環境変数を設定しておく：
# export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"
# 本番（Cloud Run / Functions 2nd gen）は実行SAでOK（鍵ファイル不要）

# ADC（Application Default Credentials）で初期化
if not firebase_admin._apps:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)

# Firestore クライアント（招待台帳用）
_firestore_client: firestore.Client | None = None

# Cloud Logging クライアント
_logging_client: cloud_logging.Client | None = None

def verify_id_token(id_token: str):
    """Firebase IDトークンを検証し、デコード結果(dict)を返す。失敗時は例外。"""
    return auth.verify_id_token(id_token)

def verify_app_check_token(token: str):
    """App Checkトークンを検証。失敗時は例外。"""
    return app_check.verify_token(token)


def get_db() -> firestore.Client:
    """Firestore クライアントを返す（シングルトン）。"""
    global _firestore_client
    if _firestore_client is None:
        _firestore_client = firestore.Client()
    return _firestore_client


def get_logger():
    """Cloud Logging ロガーを返す（シングルトン）。"""
    global _logging_client
    if _logging_client is None:
        _logging_client = cloud_logging.Client()
    return _logging_client.logger("asobi-auth-app")


def invites_collection():
    """招待台帳のコレクション参照を返す。"""
    return get_db().collection("invites")
