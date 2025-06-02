# Sử dụng một image Python chính thức làm base image
# Nên chọn một phiên bản Python cụ thể và ổn định, ví dụ: 3.10-slim-bullseye
FROM python:3.10-slim-bullseye

# Thiết lập biến môi trường để pip không tạo file .pyc (không cần thiết trong Docker)
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép file requirements.txt vào thư mục làm việc và cài đặt các dependencies
# Bước này được thực hiện riêng để tận dụng Docker cache: nếu requirements.txt không đổi,
# các dependencies sẽ không cần phải cài đặt lại, giúp build nhanh hơn.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn ứng dụng vào thư mục làm việc
# (Ở đây là thư mục python_backend/ của bạn)
COPY . .

# Mở port mà ứng dụng Flask sẽ lắng nghe
# Railway sẽ tự động ánh xạ port này.
EXPOSE 5000

# Lệnh để chạy ứng dụng.
# Sử dụng Gunicorn để chạy Flask app trong môi trường production, nó ổn định và hiệu suất tốt hơn.
# gunicorn: web server gateway interface
# --bind 0.0.0.0:$PORT: Gunicorn sẽ lắng nghe trên tất cả các interface có sẵn
# $PORT: Railway sẽ tự động cung cấp biến môi trường PORT.
# app:app: chỉ định module (app.py) và biến Flask instance (app)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
