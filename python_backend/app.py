# python_backend/app.py
from flask import Flask, request, jsonify
from yt_dlp import YoutubeDL
import logging

app = Flask(__name__)

# Cấu hình logging cơ bản
logging.basicConfig(level=logging.INFO)

# Cấu hình yt-dlp
# Chỉ tải thông tin, không tải audio/video
YDL_OPTIONS = {
    'format': 'bestaudio/best',
    'noplaylist': True,  # Không tải playlist
    'quiet': True,       # Bớt output không cần thiết
    'extract_flat': True, # Chỉ trích xuất metadata mà không phân tích sâu
    'dump_single_json': True, # Xuất metadata dưới dạng JSON
    'force_generic_extractor': True, # Cố gắng sử dụng generic extractor nếu không có extractor cụ thể
    'default_search': 'ytsearch', # Mặc định tìm kiếm trên YouTube nếu không phải URL
    'skip_download': True, # Không tải file
    'proxy': None, # Không dùng proxy nếu không cần
    'geo_bypass': True # Bỏ qua giới hạn địa lý
}


@app.route('/extract', methods=['POST'])
def extract_info():
    data = request.get_json()
    url = data.get('url')
    if not url:
        return jsonify({"error": "URL parameter is missing"}), 400

    logging.info(f"Received extract request for URL: {url}")

    # Thêm default_search nếu query không phải là URL rõ ràng
    # Ví dụ, nếu bạn muốn dùng python backend cho cả tìm kiếm từ khóa
    # current_ydl_options = YDL_OPTIONS.copy()
    # if not url.startswith(('http://', 'https://')):
    #     current_ydl_options['default_search'] = 'ytsearch'

    try:
        with YoutubeDL(YDL_OPTIONS) as ydl:
            # Lấy thông tin video/track
            info = ydl.extract_info(url, download=False)

            if info:
                # Nếu kết quả là playlist, chỉ lấy track đầu tiên hoặc xử lý riêng
                if '_type' == 'playlist':
                    # Có thể xử lý trả về nhiều track ở đây nếu cần,
                    # nhưng hiện tại discord-player extractor chỉ mong đợi 1 track nếu playlist: null
                    track_info = info['entries'][0] if info['entries'] else None
                else:
                    track_info = info

                if track_info:
                    extracted_data = {
                        "title": track_info.get('title'),
                        "url": track_info.get('webpage_url') or track_info.get('url'),
                        "duration": str(track_info.get('duration', 0) // 60).zfill(2) + ':' + str(track_info.get('duration', 0) % 60).zfill(2) if track_info.get('duration') else "00:00",
                        "thumbnail": track_info.get('thumbnail'),
                        "uploader": track_info.get('uploader'),
                        "view_count": track_info.get('view_count'),
                        "description": track_info.get('description'),
                        "source": track_info.get('extractor_key', 'unknown').lower() # Ví dụ: 'youtube', 'soundcloud'
                    }
                    logging.info(f"Successfully extracted info for: {extracted_data['title']}")
                    return jsonify(extracted_data), 200
                else:
                    return jsonify({"error": "No track information found"}), 404
            else:
                return jsonify({"error": "Failed to extract information for the provided URL."}), 500

    except Exception as e:
        logging.error(f"Error extracting info for {url}: {e}", exc_info=True)
        return jsonify({"error": f"Failed to extract information: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    # Flask chạy trên cổng 5000 và lắng nghe trên tất cả các interface
    app.run(host='0.0.0.0', port=5000)
