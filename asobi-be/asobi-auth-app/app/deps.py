# app/deps.py
import firebase_admin
from firebase_admin import credentials, auth, app_check

# ★ ローカル開発では環境変数を設定しておく：
# export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"
# 本番（Cloud Run / Functions 2nd gen）は実行SAでOK（鍵ファイル不要）

# ADC（Application Default Credentials）で初期化
if not firebase_admin._apps:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)

def verify_id_token(id_token: str):
    """Firebase IDトークンを検証し、デコード結果(dict)を返す。失敗時は例外。"""
    return auth.verify_id_token(id_token)

def verify_app_check_token(token: str):
    """App Checkトークンを検証。失敗時は例外。"""
    return app_check.verify_token(token)
