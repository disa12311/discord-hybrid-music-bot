// src/commands/music/loop.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Thiết lập chế độ lặp lại cho bài hát hoặc hàng đợi.')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Chọn chế độ lặp')
                .setRequired(true)
                .addChoices(
                    { name: 'Tắt lặp lại', value: 'off' },
                    { name: 'Lặp lại bài hát hiện tại', value: 'song' },
                    { name: 'Lặp lại toàn bộ hàng đợi', value: 'queue' },
                )),

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const loopMode = interaction.options.getString('mode');
        const queue = client.musicQueues.get(guildId);
        const logPrefix = `[LoopCommand][${guildId}]`;

        if (!queue || queue.length === 0) {
            client.logger.info(`${logPrefix} Không có hàng đợi hoặc hàng đợi trống.`);
            return interaction.reply({ content: 'Không có hàng đợi nhạc nào đang hoạt động để thiết lập chế độ lặp.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        queue._loopMode = loopMode; // Lưu trạng thái lặp vào queue object
        client.logger.info(`${logPrefix} Đã đặt chế độ lặp thành: ${loopMode}`);

        let replyContent;
        switch (loopMode) {
            case 'off':
                replyContent = '❌ Đã tắt chế độ lặp lại.';
                break;
            case 'song':
                replyContent = '🔂 Đã bật chế độ lặp lại bài hát hiện tại.';
                break;
            case 'queue':
                replyContent = '🔁 Đã bật chế độ lặp lại toàn bộ hàng đợi.';
                break;
            default:
                replyContent = 'Chế độ lặp không hợp lệ.';
        }
        await interaction.followUp({ content: replyContent, ephemeral: false });
    },
};
