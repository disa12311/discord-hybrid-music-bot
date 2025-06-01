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
            const currentlyPlaying = queue[0]; // Bài hát đang phát (nếu có)
            
            // Xóa toàn bộ queue, nếu có bài đang phát thì giữ lại bài đó
            if (currentlyPlaying) {
                // Xóa tất cả các bài sau bài đang phát
                queue.splice(1, queue.length - 1); 
                client.logger.info(`${logPrefix} Đã xóa toàn bộ hàng đợi, giữ lại bài đang phát: ${currentlyPlaying.title}`);
                await interaction.followUp('🗑️ Đã xóa toàn bộ hàng đợi nhạc, bài hát hiện tại vẫn tiếp tục phát!');
            } else {
                // Nếu không có bài nào đang phát (queue trống hoặc chỉ có bài cuối cùng đã xong)
                client.musicQueues.delete(guildId); // Xóa hoàn toàn queue
                if (player) {
                    player.stop();
                    client.voicePlayers.delete(guildId);
                }
                if (connection) {
                    connection.destroy();
                    client.voiceConnections.delete(guildId);
                }
                client.logger.info(`${logPrefix} Đã xóa toàn bộ hàng đợi và dừng phát nhạc.`);
                await interaction.followUp('🗑️ Đã xóa toàn bộ hàng đợi nhạc và dừng phát!');
            }
            
        } catch (error) {
            client.handleError(error, interaction, client);
        }
    },
};
