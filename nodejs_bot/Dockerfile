# Sử dụng Node.js 20
FROM node:20-alpine

# Tạo thư mục app
WORKDIR /app

# Copy file package
COPY package*.json ./

# Cài đặt phụ thuộc
RUN npm install --production

# Copy toàn bộ code
COPY . .

# Port (Railway cần nhưng Discord bot không cần expose port)
EXPOSE 3000

# Biến môi trường (Railway inject TOKEN qua env)
ENV NODE_ENV=production

# Chạy bot
CMD [ "node", "index.js" ]
