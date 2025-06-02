# Sử dụng một image Node.js chính thức làm base image
FROM node:20-slim

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json để tận dụng Docker cache
# Điều này giúp việc cài đặt dependencies nhanh hơn nếu package.json không thay đổi
COPY package*.json ./

# Cài đặt các dependencies
# --omit=dev để chỉ cài đặt dependencies cho production, giúp giảm kích thước image
# --production cũng có tác dụng tương tự
RUN npm install --omit=dev --production

# Sao chép toàn bộ mã nguồn ứng dụng (bot Discord) vào thư mục làm việc
COPY . .

# Mở port nếu bot có bất kỳ dịch vụ HTTP nào (ví dụ: health check)
# Nếu bot của bạn chỉ giao tiếp với Discord API và không có HTTP server, dòng này có thể bỏ qua
EXPOSE 3000

# Lệnh để khởi động ứng dụng (bot Discord)
# "npm start" sẽ chạy script "start" trong package.json
CMD ["npm", "start"]
