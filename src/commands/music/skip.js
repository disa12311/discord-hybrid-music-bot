// src/commands/music/skip.js
const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Bỏ qua bài hát hiện tại.'),

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const player = client.voicePlayers.get(guildId);
        const queue = client.musicQueues.get(guildId);
        const logPrefix = `[SkipCommand][${guildId}]`;

        await interaction.deferReply();

        if (!player || player.state.status === AudioPlayerStatus.Idle) {
            client.logger.info(`${logPrefix} Bot không phát nhạc.`);
            return interaction.followUp({ content: 'Bot hiện không phát nhạc để bỏ qua.', ephemeral: true });
        }

        if (!queue || queue.length === 0) {
            client.logger.info(`${logPrefix} Hàng đợi trống, không có bài để bỏ qua.`);
            return interaction.followUp({ content: 'Không có bài hát nào trong hàng đợi để bỏ qua.', ephemeral: true });
        }

        try {
            // Dừng player sẽ kích hoạt event 'idle', sau đó gọi playNextSong
            player.stop();
            client.logger.info(`${logPrefix} Đã bỏ qua bài hát.`);
            await interaction.followUp('⏭️ Đã bỏ qua bài hát hiện tại.');
        } catch (error) {
            client.handleError(error, interaction, client);
        }
    },
};
