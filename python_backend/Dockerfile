# Sử dụng Node.js base image phiên bản 20 slim (nhẹ hơn)
FROM node:20-slim

# Thiết lập thư mục làm việc bên trong container
WORKDIR /app

# Copy package.json và package-lock.json để tận dụng Docker cache
# Điều này giúp npm install chỉ chạy lại khi dependencies thay đổi
COPY package.json package-lock.json* ./

# Cài đặt các dependencies
# --omit=dev để chỉ cài các gói cần thiết cho production
RUN npm install --omit=dev

# Copy toàn bộ mã nguồn ứng dụng vào container
COPY . .

# Mở cổng mà ứng dụng sẽ lắng nghe (tùy chọn, bot Discord không cần expose public port)
# EXPOSE 3000 # Chỉ là ví dụ, không bắt buộc cho bot Discord

# Lệnh để chạy ứng dụng khi container khởi động
# Đảm bảo lệnh này chạy file index.js của bạn
CMD ["node", "src/index.js"]
