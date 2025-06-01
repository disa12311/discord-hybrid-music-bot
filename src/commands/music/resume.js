// src/commands/music/resume.js
const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Tiếp tục bài hát đã tạm dừng.'),

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const player = client.voicePlayers.get(guildId);
        const logPrefix = `[ResumeCommand][${guildId}]`;

        await interaction.deferReply({ ephemeral: true });

        if (!player) {
            client.logger.info(`${logPrefix} Không có AudioPlayer cho guild này.`);
            return interaction.followUp({ content: 'Bot hiện không phát nhạc.', ephemeral: true });
        }

        if (player.state.status === AudioPlayerStatus.Paused) {
            player.unpause();
            client.logger.info(`${logPrefix} Đã tiếp tục phát nhạc.`);
            await interaction.followUp({ content: '▶️ Đã tiếp tục nhạc.', ephemeral: false });
        } else if (player.state.status === AudioPlayerStatus.Playing) {
            client.logger.info(`${logPrefix} Nhạc đã đang phát.`);
            await interaction.followUp({ content: '▶️ Nhạc đã đang phát rồi.', ephemeral: true });
        } else {
            client.logger.info(`${logPrefix} Player không ở trạng thái Paused/Playing.`);
            await interaction.followUp({ content: '🤷‍♀️ Bot hiện không có nhạc để tiếp tục hoặc đang ở trạng thái không thể tiếp tục.', ephemeral: true });
        }
    },
};
