// src/commands/nowplaying.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Hiển thị thông tin bài hát đang phát.'),
    async execute(interaction) {
        await interaction.deferReply();

        const { guildId } = interaction;
        const queue = interaction.client.player.queues.get(guildId);

        if (!queue || !queue.isPlaying()) {
            return interaction.editReply('❌ Bot không có nhạc nào đang phát.');
        }

        const track = queue.currentTrack;
        if (!track) {
            return interaction.editReply('❌ Không thể lấy thông tin bài hát đang phát.');
        }

        // Tính toán tiến độ bài hát
        const progressBar = queue.createProgressBar({
            queue: false, // Không hiển thị progress bar cho cả hàng đợi
            length: 20, // Độ dài của thanh tiến trình
            timecodes: true // Hiển thị thời gian hiện tại / tổng thời gian
        });

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`🎶 Đang phát: ${track.title}`)
            .setURL(track.url)
            .setThumbnail(track.thumbnail || null) // Sử dụng thumbnail từ track
            .setDescription(
                `**Ca sĩ/Kênh:** \`${track.author || 'Không rõ'}\`\n` +
                `**Thời lượng:** \`${track.duration}\`\n` +
                `**Yêu cầu bởi:** ${track.requestedBy || 'Không rõ'}\n\n` +
                `${progressBar}`
            )
            .setFooter({ text: `Lượt xem: ${track.views ? track.views.toLocaleString() : 'Không rõ'}` })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    },
};
