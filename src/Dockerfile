# Sử dụng Node.js 20 làm base image (bạn có thể đổi sang 18 nếu muốn)
FROM node:20-slim

# Thiết lập thư mục làm việc bên trong container
WORKDIR /app

# Copy package.json và package-lock.json trước để tận dụng Docker cache
# Điều này giúp npm install chạy lại nhanh hơn khi các dependencies thay đổi
COPY package.json package-lock.json* ./

# Cài đặt các dependencies
RUN npm install --production

# Copy toàn bộ source code của ứng dụng vào thư mục làm việc
COPY . .

# Mở cổng nếu ứng dụng của bạn có một server (ví dụ: dashboard web), nếu không có thì không cần
# EXPOSE 3000

# Lệnh để khởi động ứng dụng
# Phải khớp với "start" script trong package.json của bạn
CMD ["npm", "start"]
