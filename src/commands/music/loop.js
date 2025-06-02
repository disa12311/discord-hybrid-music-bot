// src/commands/loop.js
const { SlashCommandBuilder } = require('discord.js');
const { QueueRepeatMode } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Đặt chế độ lặp lại cho nhạc.')
        .addIntegerOption(option =>
            option.setName('mode')
                .setDescription('Chọn chế độ lặp lại.')
                .setRequired(true)
                .addChoices(
                    { name: 'Tắt lặp lại', value: QueueRepeatMode.OFF },
                    { name: 'Lặp lại bài hát hiện tại', value: QueueRepeatMode.TRACK },
                    { name: 'Lặp lại hàng đợi', value: QueueRepeatMode.QUEUE }
                )),
    async execute(interaction) {
        await interaction.deferReply();

        const { guildId } = interaction;
        const queue = interaction.client.player.queues.get(guildId);

        if (!queue || !queue.isPlaying()) {
            return interaction.editReply('❌ Bot không có nhạc nào đang phát.');
        }

        const mode = interaction.options.getInteger('mode');
        let message;

        try {
            switch (mode) {
                case QueueRepeatMode.OFF:
                    queue.setRepeatMode(QueueRepeatMode.OFF);
                    message = '🔁 Đã tắt chế độ lặp lại.';
                    break;
                case QueueRepeatMode.TRACK:
                    queue.setRepeatMode(QueueRepeatMode.TRACK);
                    message = '🔂 Đang lặp lại bài hát hiện tại.';
                    break;
                case QueueRepeatMode.QUEUE:
                    queue.setRepeatMode(QueueRepeatMode.QUEUE);
                    message = '🔁 Đang lặp lại toàn bộ hàng đợi.';
                    break;
                default:
                    message = 'Chế độ lặp lại không hợp lệ.';
            }
            return interaction.editReply(message);
        } catch (error) {
            console.error(`[Loop Command] Lỗi khi đặt chế độ lặp:`, error);
            return interaction.editReply(`🚫 Đã xảy ra lỗi khi đặt chế độ lặp: ${error.message}`);
        }
    },
};
