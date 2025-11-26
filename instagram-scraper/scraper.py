#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Instagram Scraper for IU Calendar
使用 Instaloader 爬取 Instagram 貼文
"""

import sys
import os

# 必須在最開始設定編碼（在任何其他 import 之前）
if sys.platform == 'win32':
    # 設定環境變數強制使用 UTF-8
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    # 重新配置 stdout 和 stderr
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8', line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.detach(), encoding='utf-8', line_buffering=True)

import instaloader
import json
from datetime import datetime
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

class InstagramScraper:
    def __init__(self, username=None, password=None):
        """初始化 Instaloader"""
        self.L = instaloader.Instaloader(
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            max_connection_attempts=3
        )

        # 如果提供了帳號密碼，嘗試登入（避免 rate limit）
        if username and password:
            try:
                self.L.login(username, password)
                print(f"✓ Logged in as {username}", file=sys.stderr)
            except Exception as e:
                print(f"⚠ Login failed: {e}", file=sys.stderr)
                print("⚠ Continuing without login (may have rate limits)", file=sys.stderr)

    def scrape_profile(self, profile_name, max_posts=50):
        """
        爬取指定帳號的貼文

        Args:
            profile_name: Instagram 帳號名稱
            max_posts: 最多爬取幾篇貼文

        Returns:
            List of post dictionaries
        """
        try:
            print(f"⏳ Fetching profile: {profile_name}", file=sys.stderr)
            profile = instaloader.Profile.from_username(self.L.context, profile_name)

            posts = []
            count = 0

            for post in profile.get_posts():
                if count >= max_posts:
                    break

                try:
                    # 提取 hashtags
                    hashtags = []
                    if post.caption:
                        hashtags = [tag.strip('#') for tag in post.caption.split() if tag.startswith('#')]

                    post_data = {
                        'shortcode': post.shortcode,
                        'url': f"https://www.instagram.com/p/{post.shortcode}/",
                        'date': post.date_utc.isoformat(),
                        'timestamp': int(post.date_utc.timestamp()),
                        'caption': post.caption if post.caption else '',
                        'hashtags': hashtags,
                        'likes': post.likes,
                        'comments': post.comments,
                        'is_video': post.is_video,
                        'media_url': post.url,
                        'typename': post.typename,
                        'owner_username': post.owner_username
                    }

                    posts.append(post_data)
                    count += 1

                    if count % 10 == 0:
                        print(f"⏳ Fetched {count} posts...", file=sys.stderr)

                except Exception as e:
                    print(f"⚠ Error processing post: {e}", file=sys.stderr)
                    continue

            print(f"✓ Successfully fetched {len(posts)} posts", file=sys.stderr)
            return posts

        except Exception as e:
            print(f"✗ Error fetching profile: {e}", file=sys.stderr)
            return []

    def scrape_recent_posts(self, profile_name, days=30):
        """
        爬取最近 N 天的貼文

        Args:
            profile_name: Instagram 帳號名稱
            days: 最近幾天的貼文

        Returns:
            List of post dictionaries
        """
        from datetime import datetime, timedelta

        try:
            print(f"⏳ Fetching recent {days} days posts from: {profile_name}", file=sys.stderr)
            profile = instaloader.Profile.from_username(self.L.context, profile_name)

            cutoff_date = datetime.now() - timedelta(days=days)
            posts = []

            for post in profile.get_posts():
                # 如果貼文日期早於 cutoff_date，停止爬取
                if post.date_utc < cutoff_date:
                    break

                try:
                    hashtags = []
                    if post.caption:
                        hashtags = [tag.strip('#') for tag in post.caption.split() if tag.startswith('#')]

                    post_data = {
                        'shortcode': post.shortcode,
                        'url': f"https://www.instagram.com/p/{post.shortcode}/",
                        'date': post.date_utc.isoformat(),
                        'timestamp': int(post.date_utc.timestamp()),
                        'caption': post.caption if post.caption else '',
                        'hashtags': hashtags,
                        'likes': post.likes,
                        'comments': post.comments,
                        'is_video': post.is_video,
                        'media_url': post.url,
                        'typename': post.typename,
                        'owner_username': post.owner_username
                    }

                    posts.append(post_data)

                except Exception as e:
                    print(f"⚠ Error processing post: {e}", file=sys.stderr)
                    continue

            print(f"✓ Successfully fetched {len(posts)} recent posts", file=sys.stderr)
            return posts

        except Exception as e:
            print(f"✗ Error fetching recent posts: {e}", file=sys.stderr)
            return []


def main():
    """主程式"""
    # 從環境變數讀取設定
    target_username = os.getenv('INSTAGRAM_TARGET_USERNAME', 'iu_taiwau')
    login_username = os.getenv('INSTAGRAM_LOGIN_USERNAME')
    login_password = os.getenv('INSTAGRAM_LOGIN_PASSWORD')
    max_posts = int(os.getenv('INSTAGRAM_MAX_POSTS', '50'))

    # 初始化 scraper
    scraper = InstagramScraper(login_username, login_password)

    # 爬取貼文
    posts = scraper.scrape_profile(target_username, max_posts)

    # 輸出 JSON（供 Node.js 讀取）
    print(json.dumps(posts, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
