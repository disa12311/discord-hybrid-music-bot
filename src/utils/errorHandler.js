// src/utils/errorHandler.js
const setupErrorHandler = (client) => {
    // Bắt các lỗi không được xử lý trong Promise
    process.on('unhandledRejection', async (reason, promise) => {
        console.error('🚫 [Unhandled Rejection]', reason);
        const adminLogChannelId = process.env.ADMIN_LOG_CHANNEL_ID;
        if (adminLogChannelId) {
            const channel = await client.channels.fetch(adminLogChannelId).catch(() => null);
            if (channel) {
                channel.send(`\`\`\`ansi\n[2;31m[ERROR] [2;33mUNHANDLED REJECTION[0m\n[0;31mReason: ${reason.message || reason}\nPromise: ${promise}\nStack: ${reason.stack || 'No stack trace'}\n\`\`\``).catch(console.error);
            }
        }
    });

    // Bắt các lỗi không được xử lý trong mã đồng bộ
    process.on('uncaughtException', async (error, origin) => {
        console.error('🚫 [Uncaught Exception]', error);
        const adminLogChannelId = process.env.ADMIN_LOG_CHANNEL_ID;
        if (adminLogChannelId) {
            const channel = await client.channels.fetch(adminLogChannelId).catch(() => null);
            if (channel) {
                channel.send(`\`\`\`ansi\n[2;31m[ERROR] [2;33mUNCAUGHT EXCEPTION[0m\n[0;31mError: ${error.message}\nOrigin: ${origin}\nStack: ${error.stack || 'No stack trace'}\n\`\`\``).catch(console.error);
            }
        }
        process.exit(1); // Thoát ứng dụng sau khi ghi log lỗi nghiêm trọng
    });

    // Các event khác nếu cần (ví dụ: warning)
    process.on('warning', (warning) => {
        console.warn('⚠️ [Node Warning]', warning.message);
        // Có thể gửi warning đến kênh admin nếu cần
    });
};

module.exports = setupErrorHandler;
