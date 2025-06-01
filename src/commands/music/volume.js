// src/commands/music/volume.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Điều chỉnh âm lượng của bot.')
        .addIntegerOption(option =>
            option.setName('value')
                .setDescription('Mức âm lượng (0-200, mặc định 100)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(200)),

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const player = client.voicePlayers.get(guildId);
        const logPrefix = `[VolumeCommand][${guildId}]`;

        await interaction.deferReply();

        if (!player || !player.state.resource) {
            client.logger.info(`${logPrefix} Bot hiện không phát nhạc.`);
            return interaction.followUp({ content: 'Bot hiện không phát nhạc.', ephemeral: true });
        }

        const newVolume = interaction.options.getInteger('value');
        const volume = player.state.resource.volume;

        if (!volume) {
            client.logger.warn(`${logPrefix} Không thể điều chỉnh âm lượng vì AudioResource không có inlineVolume.`);
            return interaction.followUp({ content: 'Hiện không thể điều chỉnh âm lượng.', ephemeral: true });
        }

        try {
            if (newVolume !== null) {
                const volumeFactor = newVolume / 100;
                volume.setVolume(volumeFactor);
                client.logger.info(`${logPrefix} Đã điều chỉnh âm lượng đến ${newVolume}%.`);
                await interaction.followUp(`🔊 Đã đặt âm lượng thành **${newVolume}%**.`);
            } else {
                const currentVolume = Math.round(volume.volume * 100);
                client.logger.info(`${logPrefix} Âm lượng hiện tại: ${currentVolume}%.`);
                await interaction.followUp(`🔊 Âm lượng hiện tại là **${currentVolume}%**.`);
            }
        } catch (error) {
            client.handleError(error, interaction, client);
        }
    },
};
