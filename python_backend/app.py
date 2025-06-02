# python_backend/app.py
# ...
# Cấu hình yt-dlp cho gợi ý (nhanh và nhẹ hơn)
YDL_SUGGEST_OPTIONS = {
    'noplaylist': True,
    'quiet': True,
    'no_warnings': True,
    'default_search': 'auto',
    'source_address': '0.0.0.0',
    'extract_flat': True,
    'playlist_items': '1:7', # Giới hạn số lượng kết quả tìm kiếm (ví dụ 7)
    # Chỉ cần định dạng cơ bản để lấy title và url, không cần stream URL cụ thể
    'format': 'bestaudio/best', # Cần thiết để có URL cho value
    'extract_audio': False, # Không cần trích xuất audio info quá sâu
    'force_generic_extractor': False,
}

# ...

@app.route('/api/suggest')
def get_music_suggestions():
    query = request.args.get('query')
    if not query:
        return jsonify({"suggestions": []}), 200

    try:
        with YoutubeDL(YDL_SUGGEST_OPTIONS) as ydl:
            # search cho gợi ý (ytsearch: sẽ nhanh hơn nếu chỉ cần title và url)
            # Lấy số lượng kết quả theo playlist_items
            info = ydl.extract_info(f"ytsearch{YDL_SUGGEST_OPTIONS['playlist_items'].split(':')[1]}:{query}", download=False)

        suggestions = []
        if info and 'entries' in info:
            for entry in info['entries']:
                if entry and entry.get('title') and entry.get('webpage_url'): # Đảm bảo có title và url
                    suggestions.append({
                        "title": entry['title'],
                        "url": entry['webpage_url'] # Sử dụng webpage_url
                    })
        return jsonify({"suggestions": suggestions}), 200

    except Exception as e:
        app.logger.error(f"Error processing suggest query '{query}': {e}", exc_info=True)
        return jsonify({"suggestions": []}), 500 # Luôn trả về mảng rỗng khi có lỗi
