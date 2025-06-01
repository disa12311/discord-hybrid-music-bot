// src/commands/music/nowplaying.js
const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { createPlayingEmbed, formatDuration } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Hiển thị thông tin về bài hát hiện tại.'),

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const player = client.voicePlayers.get(guildId);
        const logPrefix = `[NowPlayingCommand][${guildId}]`;

        await interaction.deferReply();

        if (!player || player.state.status === AudioPlayerStatus.Idle) {
            client.logger.info(`${logPrefix} Bot không phát nhạc.`);
            return interaction.followUp({ content: 'Bot hiện không phát nhạc.', ephemeral: true });
        }

        const queue = client.musicQueues.get(guildId);
        if (!queue || queue.length === 0) { // Nếu queue trống, nhưng player vẫn Playing/Buffering (vd: bài cuối)
            client.logger.warn(`${logPrefix} Player đang hoạt động nhưng queue trống.`);
            return interaction.followUp({ content: 'Bot đang phát nhạc nhưng không tìm thấy thông tin bài hát trong hàng đợi (có thể là bài cuối cùng đang phát).', ephemeral: true });
        }

        // Bài hát hiện tại sẽ là bài đầu tiên trong queue (nếu đang phát)
        // Hoặc là bài hát đang được xử lý trong player state (nếu có thể lấy)
        const currentSong = queue[0]; // Logic đơn giản: bài đang phát là bài đầu tiên của queue
        if (!currentSong) {
            client.logger.warn(`${logPrefix} Không tìm thấy bài hát hiện tại trong queue.`);
            return interaction.followUp({ content: 'Không tìm thấy thông tin bài hát đang phát.', ephemeral: true });
        }

        try {
            const embed = createPlayingEmbed(currentSong, currentSong.requester);

            // Thêm tiến độ bài hát (tùy chọn, cần điều chỉnh nếu muốn chính xác hơn)
            if (player.state.resource && player.state.resource.playbackDuration) {
                const playedSeconds = Math.floor(player.state.resource.playbackDuration / 1000);
                const totalSeconds = currentSong.duration; // Giả sử duration từ API là giây
                const progress = totalSeconds > 0 ? (playedSeconds / totalSeconds) * 20 : 0; // 20 ký tự cho thanh tiến độ
                const progressBar = '─'.repeat(Math.floor(progress)) + '🔘' + '─'.repeat(20 - Math.floor(progress));
                const timeString = `${formatDuration(playedSeconds)} / ${formatDuration(totalSeconds)}`;
                embed.addFields({ name: 'Tiến độ', value: `${progressBar}\n\`${timeString}\`` });
            }

            await interaction.followUp({ embeds: [embed] });
        } catch (error) {
            client.handleError(error, interaction, client);
        }
    },
};
