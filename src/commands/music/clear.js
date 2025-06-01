// src/commands/music/clear.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Xóa toàn bộ hàng đợi nhạc.'),

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const queue = client.musicQueues.get(guildId);
        const player = client.voicePlayers.get(guildId);
        const connection = client.voiceConnections.get(guildId);
        const logPrefix = `[ClearCommand][${guildId}]`;

        await interaction.deferReply();

        if (!queue || queue.length === 0) {
            client.logger.info(`${logPrefix} Hàng đợi đã trống.`);
            return interaction.followUp({ content: 'Hàng đợi nhạc hiện đang trống!', ephemeral: true });
        }

        try {
            // Xóa toàn bộ queue, trừ bài hát đang phát (nếu có)
            const currentSong = queue[0];
            client.musicQueues.set(guildId, currentSong ? [currentSong] : []); // Giữ lại bài đang phát nếu có
            
            // Nếu không có bài nào đang phát, dừng player và rời kênh
            if (!currentSong && player) {
                player.stop();
                client.voicePlayers.delete(guildId);
            }
            if (!currentSong && connection) {
                connection.destroy();
                client.voiceConnections.delete(guildId);
            }

            client.logger.info(`${logPrefix} Đã xóa toàn bộ hàng đợi.`);
            await interaction.followUp('🗑️ Đã xóa toàn bộ hàng đợi nhạc!');
        } catch (error) {
            client.handleError(error, interaction, client);
        }
    },
};
