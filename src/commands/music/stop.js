// src/commands/music/stop.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Dừng phát nhạc và xóa hàng đợi.'),
    async execute(interaction, client, musicQueues, playNextSong) {
        const guildId = interaction.guild.id;
        const player = client.voicePlayers.get(guildId);
        const connection = client.voiceConnections.get(guildId);

        if (!player && !connection) {
            return interaction.reply({ content: 'Bot hiện không phát nhạc hoặc không ở trong kênh thoại.', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            // Dừng player nếu nó đang hoạt động
            if (player) {
                player.stop();
                client.voicePlayers.delete(guildId); // Xóa player khỏi Map
            }

            // Xóa hàng đợi
            if (musicQueues.has(guildId)) {
                musicQueues.delete(guildId);
            }

            // Ngắt kết nối thoại
            if (connection) {
                connection.destroy();
                client.voiceConnections.delete(guildId); // Xóa connection khỏi Map
            }
            
            await interaction.followUp('⏹️ Đã dừng phát nhạc và rời khỏi kênh thoại!');
        } catch (error) {
            console.error(error);
            await interaction.followUp('Có lỗi xảy ra khi dừng nhạc.');
        }
    },
};
