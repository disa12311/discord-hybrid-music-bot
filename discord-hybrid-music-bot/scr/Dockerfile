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

# Lệnh để khởi chạy bot
# PM2 được khuyến nghị để quản lý tiến trình và tự khởi động lại khi crash
RUN npm install -g pm2 # Cài đặt PM2
CMD ["pm2-runtime", "index.js"] # Khởi chạy bot bằng pm2-runtime
