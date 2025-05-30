// src/commands/music/play.js
const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fetch = require('node-fetch'); // Đảm bảo đã cài `npm install node-fetch`

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Phát một bài hát hoặc danh sách phát từ URL/tên.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Tên bài hát hoặc URL (YouTube, Spotify, SoundCloud, v.v.)')
                .setRequired(true)),
    
    async execute(interaction, client, musicQueues, playNextSong) {
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel;
        const guildId = interaction.guild.id;
        const textChannel = interaction.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: 'Bạn phải ở trong một kênh thoại để sử dụng lệnh này!', ephemeral: true });
        }

        await interaction.deferReply(); // Tạm hoãn phản hồi để có thời gian xử lý

        try {
            // Bước 1: Gửi yêu cầu đến API Python để lấy thông tin và stream URL
            // Đảm bảo địa chỉ IP/port của Python backend là chính xác
            // Thay đổi URL cứng sang sử dụng biến môi trường PYTHON_API_URL
            const pythonApiUrl = `${process.env.PYTHON_API_URL}?query=${encodeURIComponent(query)}`;
            const response = await fetch(pythonApiUrl);
            const data = await response.json();

            if (!response.ok) { // Kiểm tra status code (200-299 là OK)
                console.error(`Backend Python trả về lỗi ${response.status}: ${data.error || 'Không rõ lỗi'}`);
                return interaction.followUp(`Lỗi khi tìm nhạc: ${data.error || 'Đã xảy ra lỗi không xác định từ máy chủ nhạc.'}`);
            }

            const { title, url, stream_url, duration, thumbnail } = data;

            if (!stream_url) { // Đảm bảo có URL để stream
                return interaction.followUp(`Không thể tìm thấy luồng âm thanh hợp lệ cho "${query}". Vui lòng thử lại với một truy vấn khác.`);
            }

            // Kiểm tra và khởi tạo AudioPlayer nếu chưa có
            let player = client.voicePlayers.get(guildId);
            let connection = client.voiceConnections.get(guildId);

            if (!player) {
                // Bước 2: Tham gia kênh thoại (nếu chưa)
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: guildId,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });
                client.voiceConnections.set(guildId, connection); // Lưu connection

                player = createAudioPlayer();
                client.voicePlayers.set(guildId, player); // Lưu player

                connection.subscribe(player);

                // Thiết lập event listener cho player
                player.on(AudioPlayerStatus.Idle, () => {
                    playNextSong(guildId, textChannel);
                });

                player.on('error', error => {
                    console.error(`Lỗi trình phát âm thanh trong guild ${guildId}: ${error.message}`);
                    textChannel.send(`Có lỗi xảy ra khi phát nhạc: ${error.message}. Đang thử chuyển bài...`).catch(() => {});
                    playNextSong(guildId, textChannel); // Thử chuyển bài
                });
            }

            // Thêm bài hát vào hàng đợi
            if (!musicQueues.has(guildId)) {
                musicQueues.set(guildId, []);
            }
            const queue = musicQueues.get(guildId);
            queue.push({
                title,
                url,
                stream_url,
                duration,
                thumbnail,
                requester: interaction.user
            });

            // Nếu player không bận, bắt đầu phát ngay lập tức
            if (player.state.status === AudioPlayerStatus.Idle) {
                await interaction.followUp(`🎶 Đang bắt đầu phát: **[${title}](${url})**`);
                playNextSong(guildId, textChannel);
            } else {
                await interaction.followUp(`🎶 Đã thêm **[${title}](${url})** vào hàng đợi! Vị trí: ${queue.length + 1}.`); // +1 vì đã thêm vào hàng đợi
            }

        } catch (e) {
            console.error('Lỗi trong lệnh /play:', e);
            if (e.name === 'FetchError') { // Lỗi khi không kết nối được với backend
                await interaction.followUp('Không thể kết nối với máy chủ âm nhạc. Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
            } else {
                await interaction.followUp(`Có lỗi xảy ra khi xử lý yêu cầu của bạn: ${e.message}`);
            }
        }
    },
};
