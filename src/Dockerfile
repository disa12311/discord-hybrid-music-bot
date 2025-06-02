# Sử dụng base image Node.js LTS
FROM node:20-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json (nếu có)
# để cài đặt dependencies
COPY package*.json ./

# Cài đặt các dependencies của Node.js
# --omit=dev để không cài các gói dev trong môi trường production
RUN npm install --omit=dev

# Cài đặt ffmpeg-static và libsodium-wrappers
# ffmpeg-static cần thiết để phát nhạc với @discordjs/voice
# libsodium-wrappers là một dependency của @discordjs/voice cho mã hóa âm thanh
RUN npm install ffmpeg-static libsodium-wrappers --omit=dev

# Sao chép toàn bộ mã nguồn của ứng dụng vào thư mục làm việc
COPY src/ ./src/

# Đảm bảo các biến môi trường được thiết lập đúng cách trong môi trường Railway
# Railway sẽ tự động inject các biến từ Dashboard vào runtime của container

# Mở port nếu ứng dụng Node.js có listen (Bot Discord không cần)
# EXPOSE 3000
EXPOSE 3000 # Nếu bạn dùng port 3000 cho health check
# Lệnh để chạy ứng dụng khi container khởi động
# npm start sẽ chạy node src/index.js (định nghĩa trong package.json)
CMD ["npm", "start"]
