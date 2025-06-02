# Discord Hybrid Music Bot

Một bot Discord music viết bằng **TypeScript**, dùng **DisTube** để play nhạc (YouTube/Spotify/SounCloud), hỗ trợ **slash commands**, deploy dễ dàng lên **Railway**.

## 📋 Tính năng chính
- Slash commands `/play`, `/skip`, `/queue`, `/pause`, `/resume`, `/nowplaying`.
- Hỗ trợ queue phân trang, hiển thị thông tin bài đang phát.
- Hỗ trợ nguồn nhạc từ YouTube, Spotify, SoundCloud qua DisTube.
- Logger đơn giản, error handler.
- Triển khai dễ dàng trên Railway (Docker-ready).

## 🛠️ Cài đặt local
1. Clone repo:
   ```bash
   git clone https://github.com/disa12311/discord-hybrid-music-bot.git
   cd discord-hybrid-music-bot
