#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Instagram Login Helper
用於手動登入 Instagram 並儲存 session
"""

import sys
import os

# 設定 UTF-8 編碼
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8', line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.detach(), encoding='utf-8', line_buffering=True)

import instaloader
from dotenv import load_dotenv

load_dotenv()

def login_and_save_session():
    """互動式登入並儲存 session"""

    # 取得帳號資訊
    username = os.getenv('INSTAGRAM_LOGIN_USERNAME')
    password = os.getenv('INSTAGRAM_LOGIN_PASSWORD')

    if not username or not password:
        print("❌ 錯誤：請在 .env 中設定 INSTAGRAM_LOGIN_USERNAME 和 INSTAGRAM_LOGIN_PASSWORD")
        return

    print(f"🔐 嘗試登入 Instagram 帳號: {username}")
    print("⚠️  如果需要驗證碼，請檢查你的手機或郵件")
    print()

    L = instaloader.Instaloader()

    try:
        # 嘗試登入
        L.login(username, password)

        # 儲存 session
        session_file = f"session-{username}"
        L.save_session_to_file(session_file)

        print(f"✅ 登入成功！")
        print(f"📁 Session 已儲存到: {session_file}")
        print()
        print("💡 現在你可以使用爬蟲了，它會自動載入這個 session")

    except instaloader.exceptions.TwoFactorAuthRequiredException:
        print("❌ 錯誤：此帳號啟用了雙因素驗證")
        print("💡 請輸入驗證碼：")
        code = input("驗證碼: ")

        try:
            L.two_factor_login(code)
            session_file = f"session-{username}"
            L.save_session_to_file(session_file)
            print(f"✅ 登入成功！Session 已儲存")
        except Exception as e:
            print(f"❌ 登入失敗: {e}")

    except instaloader.exceptions.BadCredentialsException:
        print("❌ 錯誤：帳號或密碼不正確")

    except instaloader.exceptions.ConnectionException as e:
        print(f"❌ 連線錯誤: {e}")
        print("💡 可能原因：")
        print("   1. Instagram 要求在瀏覽器中完成驗證")
        print("   2. 網路連線問題")
        print("   3. 帳號被暫時封鎖")

    except Exception as e:
        print(f"❌ 未知錯誤: {e}")
        print()
        print("💡 建議：先在瀏覽器手動登入一次，確認帳號沒問題")

if __name__ == '__main__':
    login_and_save_session()
