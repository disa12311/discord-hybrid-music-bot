// src/commands/music/pause.js
const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Tạm dừng bài hát hiện tại.'),

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const player = client.voicePlayers.get(guildId);
        const logPrefix = `[PauseCommand][${guildId}]`;

        await interaction.deferReply({ ephemeral: true });

        if (!player) {
            client.logger.info(`${logPrefix} Không có AudioPlayer cho guild này.`);
            return interaction.followUp({ content: 'Bot hiện không phát nhạc.', ephemeral: true });
        }

        if (player.state.status === AudioPlayerStatus.Playing) {
            player.pause();
            client.logger.info(`${logPrefix} Đã tạm dừng phát nhạc.`);
            await interaction.followUp({ content: '⏸️ Đã tạm dừng nhạc.', ephemeral: false });
        } else if (player.state.status === AudioPlayerStatus.Paused) {
            client.logger.info(`${logPrefix} Nhạc đã bị tạm dừng.`);
            await interaction.followUp({ content: '⏸️ Nhạc đã được tạm dừng rồi.', ephemeral: true });
        } else {
            client.logger.info(`${logPrefix} Player không ở trạng thái Playing/Paused.`);
            await interaction.followUp({ content: '🤷‍♀️ Bot hiện không phát nhạc hoặc đang ở trạng thái không thể tạm dừng.', ephemeral: true });
        }
    },
};
