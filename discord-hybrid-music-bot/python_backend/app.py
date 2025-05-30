# python_backend/app.py
from flask import Flask, request, jsonify
import yt_dlp
import threading
import time

app = Flask(__name__)

ydl_opts = {
    'format': 'bestaudio/best', # Ưu tiên định dạng âm thanh tốt nhất
    'noplaylist': True,         # Không xử lý playlist tự động
    'quiet': True,              # Giảm thiểu output console
    'no_warnings': True,        # Tắt cảnh báo
    'default_search': 'auto',   # Tự động tìm kiếm nếu không phải URL hợp lệ
    'source_address': '0.0.0.0', # Bind đến IPv4
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'opus', # Opus là codec ưu tiên của Discord
        'preferredquality': '128', # Chất lượng 128kbps
    }],
    'extractor_args': {
        'youtube': {
            'player_client': ['web'] # Sử dụng client web để tránh các vấn đề tiềm ẩn
        }
    },
    'retries': 3, # Thử lại 3 lần nếu có lỗi mạng
    'buffersize': 1024 * 256 # Kích thước buffer cho streaming, 256KB
}

@app.route('/api/get_music_info', methods=['GET'])
def get_music_info():
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "Missing 'query' parameter"}), 400

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(query, download=False)
            except yt_dlp.DownloadError as e:
                # Bắt lỗi khi không tìm thấy video, bị chặn theo khu vực, v.v.
                print(f"yt-dlp Download Error for '{query}': {e}")
                return jsonify({"error": f"Không thể tải thông tin bài hát: {str(e)}."}), 404
            except Exception as e:
                # Bắt các lỗi khác từ yt_dlp process
                print(f"Unexpected yt-dlp Error for '{query}': {e}")
                return jsonify({"error": f"Lỗi không xác định khi tìm kiếm nhạc: {str(e)}."}), 500

            if 'entries' in info:
                info = info['entries'][0] # Lấy bài hát đầu tiên nếu là playlist/search result

            audio_url = None
            # Tìm URL stream tốt nhất
            for f in info['formats']:
                # Ưu tiên opus, sau đó là các định dạng webm/mp4/m4a có acodec và url
                if 'url' in f and 'acodec' in f and f['acodec'] != 'none' and f['ext'] in ['opus', 'webm', 'mp4', 'm4a']:
                    audio_url = f['url']
                    break
            
            # Fallback nếu không tìm thấy định dạng ưu tiên
            if not audio_url:
                audio_url = info.get('url') # URL mặc định của yt_dlp, có thể không phải streamable

            if not audio_url:
                print(f"No playable audio URL found for '{query}' after extraction.")
                return jsonify({"error": "Không tìm thấy luồng âm thanh khả dụng cho yêu cầu này."}), 404

            return jsonify({
                "title": info.get('title'),
                "url": info.get('webpage_url'),
                "stream_url": audio_url,
                "duration": info.get('duration'),
                "thumbnail": info.get('thumbnail')
            })

    except Exception as e:
        print(f"Internal Server Error processing query '{query}': {e}")
        return jsonify({"error": f"Lỗi máy chủ nội bộ không xác định: {str(e)}."}), 500

if __name__ == '__main__':
    # >>> CHỈ DÙNG KHI PHÁT TRIỂN (DEVELOPMENT) <<<
    # Flask development server không được thiết kế cho production
    app.run(host='0.0.0.0', port=5000, debug=True)

    # >>> DÙNG GUNICORN KHI TRIỂN KHAI (PRODUCTION) <<<
    # Cần cài đặt Gunicorn: pip install gunicorn
    # Lệnh chạy trong production: gunicorn -w 3 -b 0.0.0.0:5000 app:app
