// src/commands/volume.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Điều chỉnh âm lượng của bot.')
        .addIntegerOption(option =>
            option.setName('percent')
                .setDescription('Mức âm lượng (0-100)')
                .setMinValue(0)
                .setMaxValue(100)
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        const { guildId } = interaction;
        const queue = interaction.client.player.queues.get(guildId);

        if (!queue || !queue.isPlaying()) {
            return interaction.editReply('❌ Bot không có nhạc nào đang phát.');
        }

        const volume = interaction.options.getInteger('percent');

        try {
            queue.setVolume(volume); // Đặt âm lượng
            return interaction.editReply(`🔊 Đã đặt âm lượng thành **${volume}%**`);
        } catch (error) {
            console.error(`[Volume Command] Lỗi khi đặt âm lượng:`, error);
            return interaction.editReply(`🚫 Đã xảy ra lỗi khi đặt âm lượng: ${error.message}`);
        }
    },
};
