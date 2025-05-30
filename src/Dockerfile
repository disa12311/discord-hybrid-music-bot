# src/Dockerfile
# Base image cho Node.js (sử dụng phiên bản Node.js 18 hoặc 20, tương thích với discord.js v14)
FROM node:18-slim

# Đặt thư mục làm việc
WORKDIR /app

# Copy package.json và package-lock.json để cài đặt dependencies
COPY package.json package-lock.json ./

# Cài đặt Node.js dependencies
RUN npm install

# Copy tất cả các file còn lại của bot vào thư mục làm việc
COPY . .

# --- Bắt đầu phần thêm vào (Tùy chọn và Thử nghiệm) ---
# Tối ưu DNS resolution trong container
# Railway thường đã xử lý tốt, nhưng nếu gặp lỗi ENOTFOUND dai dẳng,
# bạn có thể thử đảm bảo resolv.conf trỏ đến nameserver của Docker hoặc của hệ thống.
# Đây là cách để thêm Google DNS (8.8.8.8) như một fallback.
# Lưu ý: Điều này có thể không cần thiết hoặc thậm chí không hoạt động hiệu quả
# nếu Railway có cơ chế DNS internal riêng biệt.
# RUN echo "nameserver 8.8.8.8" >> /etc/resolv.conf
# RUN echo "options ndots:0 timeout:1 attempts:1" >> /etc/resolv.conf
# --- Kết thúc phần thêm vào ---


# Lệnh để khởi chạy bot
# PM2 được khuyến nghị để quản lý tiến trình và tự khởi động lại khi crash
RUN npm install -g pm2 # Cài đặt PM2
CMD ["pm2-runtime", "index.js"] # Khởi chạy bot bằng pm2-runtime
