# python_backend/Dockerfile
# Sử dụng base image Python-slim-buster hoặc alpine để giảm kích thước.
# Python 3.9-slim-buster là một lựa chọn tốt về kích thước và khả năng tương thích.
FROM python:3.9-slim-buster

# Đặt biến môi trường để không tạo file byte-code .pyc
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Cài đặt các package hệ thống cần thiết, bao gồm FFmpeg.
# Các lệnh RUN được kết hợp bằng && để giảm số lượng layers.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ffmpeg \
       # libopus0 (nếu cần cho audio chất lượng cao, thường được cài cùng ffmpeg)
       # ca-certificates (để đảm bảo kết nối HTTPS hoạt động)
       # build-essential (nếu bạn cần build các package Python phức tạp, thường không cần với Flask/yt-dlp đơn giản)
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Đặt thư mục làm việc trong container
WORKDIR /app

# Copy file requirements.txt trước để tận dụng Docker cache.
# Nếu requirements.txt không thay đổi, layer này sẽ không được build lại.
COPY requirements.txt .

# Cài đặt các dependency Python.
# --no-cache-dir: Không lưu trữ các package đã tải về, tiết kiệm dung lượng.
# -r: Cài đặt từ file requirements.txt.
RUN pip install --no-cache-dir -r requirements.txt

# Copy tất cả các file còn lại của backend vào thư mục làm việc.
# Layer này sẽ được build lại mỗi khi code thay đổi.
COPY . .

# Tạo một người dùng không phải root để chạy ứng dụng (tăng cường bảo mật).
# Mặc dù Railway đã có các lớp bảo mật, đây là một best practice.
RUN adduser --system --no-create-home appuser
USER appuser

# Expose port mà ứng dụng sẽ lắng nghe.
# Điều này chỉ là tài liệu và không thực sự mở port trên host.
EXPOSE 5000

# Lệnh để khởi chạy Gunicorn.
# app:app nghĩa là chạy biến 'app' trong module 'app.py' (tên file: app.py, tên biến Flask: app).
# -w 3: 3 worker process (số lượng worker lý tưởng thường là (2 * CPU_cores) + 1).
# -b 0.0.0.0:5000: bind đến tất cả các interface trên port 5000.
CMD ["gunicorn", "-w", "3", "-b", "0.0.0.0:5000", "app:app"]
