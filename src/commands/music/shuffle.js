// src/commands/shuffle.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Trộn ngẫu nhiên các bài hát trong hàng đợi.'),
    async execute(interaction) {
        await interaction.deferReply();

        const { guildId } = interaction;
        const queue = interaction.client.player.queues.get(guildId);

        if (!queue || queue.tracks.size <= 1) { // Chỉ shuffle nếu có ít nhất 2 bài
            return interaction.editReply('❌ Hàng đợi quá ngắn để trộn hoặc không có nhạc nào.');
        }

        try {
            queue.shuffle(); // Trộn hàng đợi
            return interaction.editReply('🔀 Đã trộn ngẫu nhiên hàng đợi!');
        } catch (error) {
            console.error(`[Shuffle Command] Lỗi khi trộn hàng đợi:`, error);
            return interaction.editReply(`🚫 Đã xảy ra lỗi khi trộn hàng đợi: ${error.message}`);
        }
    },
};
