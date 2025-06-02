// src/index.js
require('dotenv').config(); // Tải biến môi trường ngay từ đầu

const logger = require('./utils/logger');
const createDiscordClient = require('./bot/client');
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');
const path = require('path');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
    logger.error("Thiếu DISCORD_TOKEN hoặc DISCORD_CLIENT_ID trong biến môi trường. Bot sẽ không thể đăng nhập.");
    process.exit(1);
}

const client = createDiscordClient();

// --- Xử lý lỗi toàn cục ---
// Sử dụng handleError từ client.handleError (đã được gắn vào client trong client.js)
process.on('unhandledRejection', (reason, promise) => client.handleError(reason, null, client, true)); // Lỗi fatal
process.on('uncaughtException', (err, origin) => client.handleError(err, null, client, true)); // Lỗi fatal

// --- Tải Commands và Events (sử dụng Handlers) ---
commandHandler(client, path.join(__dirname, 'commands'));
eventHandler(client, path.join(__dirname, 'events'));

// --- Đăng nhập vào Discord ---
client.login(DISCORD_TOKEN)
    .then(() => logger.info("Bot đã đăng nhập thành công vào Discord!"))
    .catch(error => logger.error(`Lỗi khi đăng nhập vào Discord: ${error.message}`, error));

const http = require('http');

const HEALTH_CHECK_PORT = process.env.HEALTH_CHECK_PORT || 3000; // Cổng cho health check

const server = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
        // Kiểm tra trạng thái bot đơn giản (ví dụ: đã đăng nhập Discord chưa)
        if (client.isReady()) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', uptime: client.uptime }));
        } else {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'not_ready', message: 'Bot is not ready yet.' }));
        }
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(HEALTH_CHECK_PORT, () => {
    client.logger.info(`Health check server đang chạy trên cổng ${HEALTH_CHECK_PORT}`);
});
