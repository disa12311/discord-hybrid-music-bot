// src/commands/music/skip.js
const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Bỏ qua bài hát hiện tại.'),
    async execute(interaction, client, musicQueues, playNextSong) {
        const guildId = interaction.guild.id;
        const player = client.voicePlayers.get(guildId);

        if (!player || player.state.status === AudioPlayerStatus.Idle) {
            return interaction.reply({ content: 'Không có bài hát nào đang phát để bỏ qua.', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            player.stop(); // Dừng bài hát hiện tại, điều này sẽ kích hoạt AudioPlayerStatus.Idle
                           // và gọi playNextSong() từ index.js
            await interaction.followUp('⏭️ Đã bỏ qua bài hát!');
        } catch (error) {
            console.error(error);
            await interaction.followUp('Có lỗi xảy ra khi cố gắng bỏ qua bài hát.');
        }
    },
};
