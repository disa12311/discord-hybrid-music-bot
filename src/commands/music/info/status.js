// src/commands/info/
const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js');
const ms = require('ms');
const os = require('os'); // Để lấy thông tin hệ điều hành

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Hiển thị trạng thái và độ trễ của bot.'),

    async execute(interaction, client) {
        await interaction.deferReply();

        const wsLatency = client.ws.ping; // Độ trễ WebSocket API của Discord
        const uptimeBot = client.uptime; // Thời gian bot đã online từ khi đăng nhập (milliseconds)
        const uptimeProcess = process.uptime() * 1000; // Thời gian tiến trình Node.js đã chạy (milliseconds)

        // Tính toán tổng số bài hát trong hàng đợi toàn bộ guild
        let totalSongsInQueue = 0;
        client.musicQueues.forEach(queue => {
            if (queue.length > 0) {
                totalSongsInQueue += queue.length;
            }
        });

        // Lấy thông tin về Node.js và hệ điều hành
        const nodeVersion = process.version;
        const discordJsVersion = version;
        const platform = os.platform();
        const arch = os.arch();
        const totalMemoryMB = (os.totalmem() / 1024 / 1024).toFixed(2);
        const freeMemoryMB = (os.freemem() / 1024 / 1024).toFixed(2);
        const usedMemoryMB = (totalMemoryMB - freeMemoryMB).toFixed(2);
        const cpuCores = os.cpus().length;

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('🤖 Trạng thái Bot')
            .addFields(
                { name: 'Độ trễ API (Discord)', value: `\`${wsLatency}ms\``, inline: true },
                { name: 'Thời gian hoạt động Bot', value: `\`${ms(uptimeBot, { long: true })}\``, inline: true },
                { name: 'Thời gian hoạt động Process', value: `\`${ms(uptimeProcess, { long: true })}\``, inline: true },
                { name: 'Kênh thoại đang kết nối', value: `\`${client.voiceConnections.size}\``, inline: true },
                { name: 'Số lượng Guilds', value: `\`${client.guilds.cache.size}\``, inline: true },
                { name: 'Tổng số bài hát trong hàng đợi', value: `\`${totalSongsInQueue}\``, inline: true },
                { name: 'Sử dụng RAM (Bot Process)', value: `\`${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB\``, inline: true }, // RAM riêng của process bot
                { name: 'Phiên bản Node.js', value: `\`${nodeVersion}\``, inline: true },
                { name: 'Phiên bản discord.js', value: `\`v${discordJsVersion}\``, inline: true },
                { name: 'Hệ điều hành', value: `\`${platform} (${arch})\``, inline: true },
                // Có thể thêm thông tin CPU và tổng RAM nếu bạn muốn, nhưng nó sẽ là RAM của máy chủ, không phải riêng của bot
                // { name: 'CPU Cores', value: `\`${cpuCores}\``, inline: true },
                // { name: 'Tổng RAM máy chủ', value: `\`${totalMemoryMB} MB\``, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Cập nhật lần cuối` });

        await interaction.followUp({ embeds: [embed] });
    },
};
