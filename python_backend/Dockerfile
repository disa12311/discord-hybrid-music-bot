# python_backend/Dockerfile
# Base image cho Python
FROM python:3.9-slim-buster

# Cài đặt các package hệ thống cần thiết, bao gồm FFmpeg
RUN apt-get update && apt-get install -y ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Đặt thư mục làm việc trong container
WORKDIR /app

# Copy file requirements.txt và cài đặt các dependency Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy tất cả các file còn lại của backend vào thư mục làm việc
COPY . .

# Lệnh để khởi chạy Gunicorn.
# Đây là lệnh mà Docker sẽ chạy khi container khởi động.
# -w 3: 3 worker process (điều chỉnh tùy theo tài nguyên Railway cung cấp và nhu cầu của bạn)
# -b 0.0.0.0:5000: bind đến tất cả các interface trên port 5000
# app:app: module.py:Flask_app_instance_name
CMD ["gunicorn", "-w", "3", "-b", "0.0.0.0:5000", "app:app"]
