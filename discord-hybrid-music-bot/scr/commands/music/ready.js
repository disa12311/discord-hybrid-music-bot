// src/events/client/ready.js
const { Events } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
// Lấy CLIENT_ID và GUILD_ID từ biến môi trường
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Bot đã sẵn sàng! Đăng nhập với tên ${client.user.tag}`);

        const commands = [];
        // client.commands là một Collection chứa tất cả các lệnh đã load
        client.commands.forEach(command => {
            commands.push(command.data.toJSON()); // Chuyển SlashCommandBuilder thành JSON
        });

        // Khởi tạo REST API
        const rest = new REST({ version: '10' }).setToken(client.token);

        try {
            console.log(`Đang làm mới ${commands.length} lệnh ứng dụng (/)`);

            // Đăng ký lệnh cho một guild cụ thể (PHÁT TRIỂN)
            // Lệnh guild sẽ cập nhật nhanh chóng (thường là dưới 10 giây)
            if (CLIENT_ID && GUILD_ID) {
                await rest.put(
                    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                    { body: commands },
                );
                console.log(`Đã làm mới thành công các lệnh ứng dụng (/) cho guild ID: ${GUILD_ID}.`);
            } else {
                console.warn('Thiếu CLIENT_ID hoặc GUILD_ID trong .env. Lệnh sẽ không được đăng ký cho guild cụ thể.');
                // Nếu muốn đăng ký toàn cầu (PRODUCTION), bạn có thể dùng đoạn dưới:
                // await rest.put(
                //     Routes.applicationCommands(CLIENT_ID),
                //     { body: commands },
                // );
                // console.log('Đã làm mới thành công các lệnh ứng dụng (/) toàn cầu.');
            }

        } catch (error) {
            console.error('Lỗi khi đăng ký lệnh ứng dụng:', error);
            // In chi tiết lỗi từ Discord API nếu có
            if (error.rawError && error.rawError.errors) {
                console.error('Chi tiết lỗi API:', JSON.stringify(error.rawError.errors, null, 2));
            }
        }
    },
};
