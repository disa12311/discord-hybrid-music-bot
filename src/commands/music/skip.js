// commands/music/skip.js
import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Bỏ qua bài hát hiện tại.'),
    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });
        const queue = client.distube.getQueue(interaction.guild);

        if (!queue) {
            return interaction.editReply('Không có bài hát nào trong hàng chờ!');
        }

        if (interaction.member.voice.channel.id !== queue.voiceChannel.id) {
            return interaction.editReply('Bạn phải ở trong kênh thoại của bot để điều khiển nhạc!');
        }

        try {
            if (queue.songs.length > 1) {
                await queue.skip();
                await interaction.editReply('⏭️ Đã bỏ qua bài hát.');
            } else {
                await interaction.editReply('Không còn bài hát nào trong hàng chờ để bỏ qua.');
            }
        } catch (e) {
            console.error(e);
            await interaction.editReply(`Đã xảy ra lỗi khi bỏ qua: ${e.message}`);
        }
    },
};
