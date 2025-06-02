// src/commands/music/stop.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Dừng phát nhạc và xóa toàn bộ hàng đợi.')
        // Chỉ những người có quyền "Kick Members" (hoặc cao hơn) mới có thể dùng lệnh này
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setDMPermission(false), // Không cho phép dùng trong DM
    
    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const player = client.voicePlayers.get(guildId);
        const queue = client.musicQueues.get(guildId);
        const connection = client.voiceConnections.get(guildId);
        const logPrefix = `[StopCommand][${guildId}]`;

        await interaction.deferReply();

        if (!player && (!queue || queue.length === 0) && (!connection || connection.state.status === VoiceConnectionStatus.Destroyed)) {
            client.logger.info(`${logPrefix} Bot không phát nhạc và không có hàng đợi.`);
            return interaction.followUp({ content: 'Bot hiện không phát nhạc và không có hàng đợi để dừng.', ephemeral: true });
        }

        try {
            if (player) {
                player.stop();
                client.voicePlayers.delete(guildId);
                client.logger.info(`${logPrefix} Player đã dừng.`);
            }
            if (queue) {
                client.musicQueues.delete(guildId);
                client.logger.info(`${logPrefix} Hàng đợi nhạc đã bị xóa.`);
            }
            if (connection) {
                connection.destroy(); // Hủy kết nối thoại
                client.voiceConnections.delete(guildId);
                client.logger.info(`${logPrefix} Kết nối thoại đã bị hủy.`);
            }

            await interaction.followUp('⏹️ Đã dừng phát nhạc và xóa hàng đợi.');
        } catch (error) {
            client.handleError(error, interaction, client);
        }
    },
};
