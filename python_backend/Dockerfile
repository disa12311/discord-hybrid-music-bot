# Sử dụng base image Python phù hợp
FROM python:3.9-slim-buster

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép file requirements.txt để cài đặt dependencies
COPY requirements.txt ./

# Cài đặt các dependencies của Python
# --no-cache-dir để giảm kích thước image
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép mã nguồn của ứng dụng Python vào thư mục làm việc
COPY app.py ./

# Mở port mà ứng dụng Flask đang lắng nghe
# App của bạn đang chạy trên port 5000
EXPOSE 5000

# Lệnh để chạy ứng dụng khi container khởi động
# Dùng gunicorn cho production để có hiệu suất tốt hơn Flask dev server
# Hoặc giữ nguyên python app.py nếu bạn muốn dùng Flask dev server
CMD ["python", "app.py"]
