// src/events/client/ready.js
const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        client.logger.info(`Bot đã sẵn sàng! Đăng nhập với tên: ${client.user.tag}`);
    },
};
