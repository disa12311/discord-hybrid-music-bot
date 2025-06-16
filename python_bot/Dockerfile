# Sử dụng Python 3.11
FROM python:3.11-slim

# Tạo thư mục app
WORKDIR /app

# Copy requirements
COPY requirements.txt ./

# Cài đặt phụ thuộc
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code
COPY . .

# Port (Railway cần nhưng bot không expose port)
EXPOSE 3000

# Chạy bot
CMD [ "python", "bot.py" ]
