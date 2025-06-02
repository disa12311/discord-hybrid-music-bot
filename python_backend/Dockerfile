# Sử dụng một image Python chính thức làm base image
FROM python:3.10-slim-bullseye

# Thiết lập biến môi trường để pip không tạo file .pyc và output không đệm
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép file requirements.txt vào thư mục làm việc và cài đặt các dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn ứng dụng Python vào thư mục làm việc
COPY . .

# Mở port mà ứng dụng Flask sẽ lắng nghe
EXPOSE 5000

# Lệnh để chạy ứng dụng bằng Gunicorn
# Railway sẽ tự động cung cấp biến môi trường PORT, nhưng bạn cũng có thể để cứng 5000 như này
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
