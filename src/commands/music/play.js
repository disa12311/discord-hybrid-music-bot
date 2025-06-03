// commands/music/play.js
import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Phát nhạc từ YouTube, Spotify, SoundCloud, v.v.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Tên bài hát, URL hoặc tên playlist')
                .setRequired(true)),
    async execute(interaction, client) {
        await interaction.deferReply(); // Tạm thời hoãn phản hồi
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.editReply({ content: 'Bạn phải ở trong một kênh thoại để phát nhạc!', ephemeral: true });
        }

        // Kiểm tra quyền của bot trong kênh thoại
        const permissions = voiceChannel.permissionsFor(client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return interaction.editReply({ content: 'Tôi không có quyền kết nối hoặc nói trong kênh thoại này!', ephemeral: true });
        }

        try {
            await client.distube.play(voiceChannel, query, {
                textChannel: interaction.channel,
                member: interaction.member,
            });
            await interaction.editReply({ content: `Đang tìm kiếm **${query}**...` }); // Distube sẽ gửi tin nhắn "Đang phát"
        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: `Đã xảy ra lỗi khi phát nhạc: ${e.message}` });
        }
    },
};
