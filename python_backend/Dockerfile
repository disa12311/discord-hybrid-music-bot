# python_backend/Dockerfile
# Sử dụng image Python slim để giảm kích thước
FROM python:3.10-slim-bullseye

# Thiết lập biến môi trường để tối ưu Python trong Docker
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Tạo và chuyển đến thư mục làm việc trong container
WORKDIR /app

# Copy file requirements.txt và cài đặt dependencies trước
# Điều này giúp tận dụng Docker cache nếu dependencies không thay đổi
COPY requirements.txt .
RUN pip install --upgrade pip &&
    pip install --no-cache-dir -r requirements.txt
# Copy toàn bộ mã nguồn ứng dụng vào container
COPY . .

# Mở cổng mà Flask/Gunicorn sẽ chạy
EXPOSE 5000

# Lệnh để chạy ứng dụng bằng Gunicorn
# Sử dụng Gunicorn để phục vụ Flask app
# -w: số lượng worker (thường là 2*CPU + 1)
# -b: lắng nghe trên tất cả các địa chỉ IP trên cổng 5000
# app: Flask instance (tên file module: tên biến Flask app)
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
