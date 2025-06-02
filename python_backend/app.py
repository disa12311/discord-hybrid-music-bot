# python_backend/app.py

from flask import Flask, request, jsonify
from yt_dlp import YoutubeDL
import os
import logging

# --- Cấu hình Flask App và Logging ---
app = Flask(__name__)

# Cấu hình logging
# Tắt handler mặc định của Flask để tránh log trùng lặp khi chạy Gunicorn
# if not app.debug: # Tùy chọn: chỉ áp dụng khi không debug
#     app.logger.removeHandler(logging.StreamHandler())
# Thiết lập handler cho console
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO) # Đặt cấp độ log mong muốn (INFO, DEBUG, WARNING, ERROR)

# --- Cấu hình yt-dlp Options ---

# Cấu hình yt-dlp cho việc lấy thông tin nhạc chi tiết (dùng cho /api/get_music_info)
# Phù hợp cho việc phát nhạc, lấy stream URL chất lượng cao
YDL_OPTIONS = {
    'format': 'bestaudio/best', # Lấy định dạng audio tốt nhất
    'noplaylist': True,         # Không xử lý toàn bộ playlist nếu query là URL playlist
    'quiet': True,              # Không in ra console log của yt-dlp
    'no_warnings': True,        # Bỏ qua các cảnh báo của yt-dlp
    'default_search': 'auto',   # Mặc định tìm kiếm nếu query không phải URL
    'source_address': '0.0.0.0',# Ràng buộc tới tất cả các interface
    'extract_flat': True,       # Chỉ trích xuất thông tin cơ bản cho danh sách phát, không tải về
    'force_generic_extractor': False, # Cố gắng sử dụng extractor cụ thể nếu có
}

# Cấu hình yt-dlp cho việc lấy gợi ý tìm kiếm (dùng cho /api/suggest)
# Nhanh và nhẹ hơn, chỉ cần title và URL để trả về autocomplete
YDL_SUGGEST_OPTIONS = {
    'noplaylist': True,
    'quiet': True,
    'no_warnings': True,
    'default_search': 'auto',
    'source_address': '0.0.0.0',
    'extract_flat': True,       # Quan trọng: chỉ trích xuất thông tin mà không cần tải về
    'playlist_items': '1:7',    # Giới hạn số lượng kết quả tìm kiếm (ví dụ: 7 bài đầu tiên)
    'force_generic_extractor': False,
    'format': 'bestaudio/best', # Vẫn cần để có URL
    # 'extract_audio': False,   # Tùy chọn: có thể đặt False nếu chỉ cần metadata, giúp nhanh hơn
}

# --- Route: /api/get_music_info (Lấy thông tin và stream URL của bài hát) ---
@app.route('/api/get_music_info')
def get_music_info():
    query = request.args.get('query')
    if not query:
        app.logger.warning("Missing 'query' parameter for /api/get_music_info")
        return jsonify({"error": "Missing 'query' parameter"}), 400

    app.logger.info(f"Received query for music info: {query}")
    try:
        with YoutubeDL(YDL_OPTIONS) as ydl:
            # Lấy thông tin bài hát/playlist từ query
            # download=False để không tải về file
            info = ydl.extract_info(query, download=False)

            if info is None:
                app.logger.warning(f"No results found for query: {query}")
                return jsonify({"error": "Could not find any results for the given query."}), 404

            # Nếu là playlist, lấy entry đầu tiên
            if 'entries' in info and info['entries']:
                entry = info['entries'][0]
                if entry is None:
                    app.logger.warning(f"Could not extract info for first entry in playlist for query: {query}")
                    return jsonify({"error": "Could not extract information for the first entry."}), 404
            else:
                entry = info # Nếu không phải playlist, info chính là entry

            # Cố gắng tìm stream URL tốt nhất
            stream_url = None
            if 'formats' in entry:
                # Lọc các định dạng audio có sẵn và sắp xếp theo bitrate (tốt nhất trước)
                audio_formats = [f for f in entry['formats'] if 'acodec' in f and f['acodec'] != 'none' and 'url' in f]
                audio_formats.sort(key=lambda x: x.get('abr', 0), reverse=True)
                if audio_formats:
                    stream_url = audio_formats[0]['url']
                else:
                    # Nếu không tìm thấy audio format rõ ràng, thử cách trích xuất chung
                    app.logger.warning(f"No direct audio formats found for {entry.get('title')}. Trying generic extractor.")
                    best_format = ydl.extract_info(entry['webpage_url'], download=False, force_generic_extractor=True)
                    if best_format and 'url' in best_format:
                        stream_url = best_format['url']
                    elif best_format and 'formats' in best_format and best_format['formats']:
                        stream_url = best_format['formats'][0]['url'] # Lấy format đầu tiên nếu có
            if not stream_url and 'url' in entry:
                # Fallback: nếu không có 'formats', lấy URL trực tiếp từ entry
                stream_url = entry['url']

            if not stream_url:
                app.logger.error(f"Failed to find a suitable stream URL for {entry.get('title', query)}")
                return jsonify({"error": "Could not find a suitable stream URL for the requested query."}), 404

            response_data = {
                "title": entry.get('title', 'Unknown Title'),
                "url": entry.get('webpage_url', entry.get('url', 'No URL')), # URL của trang gốc (YouTube, Spotify...)
                "stream_url": stream_url, # URL của luồng audio trực tiếp
                "duration": entry.get('duration', 0),
                "thumbnail": entry.get('thumbnail', '')
            }
            app.logger.info(f"Successfully retrieved info for: {response_data['title']}")
            return jsonify(response_data), 200

    except Exception as e:
        app.logger.error(f"Error processing query '{query}': {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# --- Route: /api/suggest (Lấy gợi ý tìm kiếm cho Autocomplete) ---
@app.route('/api/suggest')
def get_music_suggestions():
    query = request.args.get('query')
    if not query:
        app.logger.warning("Missing 'query' parameter for /api/suggest")
        return jsonify({"suggestions": []}), 200 # Trả về mảng rỗng nếu không có query

    app.logger.info(f"Received suggest query: {query}")
    try:
        # Sử dụng ytsearch: để tìm kiếm và giới hạn số lượng kết quả
        # Lấy số lượng kết quả theo 'playlist_items' trong YDL_SUGGEST_OPTIONS
        # Ví dụ: ytsearch7:query sẽ lấy 7 kết quả
        with YoutubeDL(YDL_SUGGEST_OPTIONS) as ydl:
            search_query = f"ytsearch{YDL_SUGGEST_OPTIONS['playlist_items'].split(':')[1]}:{query}"
            info = ydl.extract_info(search_query, download=False)

        suggestions = []
        if info and 'entries' in info:
            for entry in info['entries']:
                # Đảm bảo entry hợp lệ và có title/webpage_url
                if entry and entry.get('title') and entry.get('webpage_url'):
                    suggestions.append({
                        "title": entry['title'],
                        "url": entry['webpage_url']
                    })
        app.logger.info(f"Found {len(suggestions)} suggestions for '{query}'")
        return jsonify({"suggestions": suggestions}), 200

    except Exception as e:
        app.logger.error(f"Error processing suggest query '{query}': {e}", exc_info=True)
        return jsonify({"suggestions": []}), 500 # Luôn trả về mảng rỗng khi có lỗi

# --- Phần khởi chạy ứng dụng (dùng cho local development/testing) ---
# Trong môi trường production với Gunicorn (trên Railway), phần này sẽ không được thực thi.
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.logger.info(f"Flask app đang khởi chạy trên http://0.0.0.0:{port} (local dev mode)")
    app.run(host='0.0.0.0', port=port, debug=False) # debug=True chỉ khi phát triển để tự reload
