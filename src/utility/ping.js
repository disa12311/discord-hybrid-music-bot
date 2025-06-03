// commands/utility/ping.js
import { SlashCommandBuilder } from 'discord.js';

export default {
    // Dữ liệu cho Slash Command
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Kiểm tra độ trễ của bot.'),
    // Thực thi lệnh (dành cho cả Slash và Prefix)
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Đang ping...', fetchReply: true });
        interaction.editReply(`Pong! Độ trễ của bot: ${client.ws.ping}ms. Độ trễ của API: ${sent.createdTimestamp - interaction.createdTimestamp}ms`);
    },
    // Nếu bạn muốn hỗ trợ Prefix Command cho lệnh này
    name: 'ping',
    description: 'Kiểm tra độ trễ của bot.',
    async run(client, message, args) { // Hàm run cho prefix command
        const sent = await message.reply('Đang ping...');
        sent.edit(`Pong! Độ trễ của bot: ${client.ws.ping}ms. Độ trễ của API: ${sent.createdTimestamp - message.createdTimestamp}ms`);
    },
};
