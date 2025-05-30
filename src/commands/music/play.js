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
        const textChannel = interaction.channel; // Kênh text để gửi thông báo

        // 1. Kiểm tra kênh thoại trước
        if (!voiceChannel) {
            return interaction.reply({ content: 'Bạn phải ở trong một kênh thoại để sử dụng lệnh này!', ephemeral: true });
        }

        // 2. Tạm hoãn phản hồi ngay lập tức để bot có thời gian xử lý
        await interaction.deferReply(); 

        try {
            // 3. Lấy URL API từ biến môi trường
            // Đảm bảo biến môi trường PYTHON_API_URL đã được thiết lập trên Railway/VPS
            const pythonApiUrl = `${process.env.PYTHON_API_URL}?query=${encodeURIComponent(query)}`;
            
            console.log(`[${guildId}] Đang tìm kiếm nhạc cho query: "${query}" từ API: ${pythonApiUrl}`);

            // 4. Gọi API Python để lấy thông tin và stream URL
            const response = await fetch(pythonApiUrl, {
                // Thêm timeout để tránh chờ đợi quá lâu nếu backend bị treo
                timeout: 15000 // 15 giây timeout
            });
            const data = await response.json();

            // 5. Xử lý lỗi từ Backend Python
            if (!response.ok) {
                const errorMessage = data.error || `Lỗi không xác định (${response.status})`;
                console.error(`[${guildId}] Backend Python trả về lỗi ${response.status}: ${errorMessage}`);
                return interaction.followUp(`❌ Lỗi khi tìm nhạc: ${errorMessage}. Vui lòng thử lại hoặc kiểm tra truy vấn.`);
            }

            const { title, url, stream_url, duration, thumbnail } = data;

            // 6. Kiểm tra xem có stream URL hợp lệ không
            if (!stream_url) {
                console.warn(`[${guildId}] Không tìm thấy stream_url cho query: "${query}"`);
                return interaction.followUp(`🤷‍♀️ Không thể tìm thấy luồng âm thanh hợp lệ cho "${query}". Vui lòng thử lại với một truy vấn khác.`);
            }

            // 7. Khởi tạo hoặc lấy AudioPlayer và VoiceConnection
            let player = client.voicePlayers.get(guildId);
            let connection = client.voiceConnections.get(guildId);

            if (!player) {
                // Nếu chưa có player, tạo mới và tham gia kênh thoại
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: guildId,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                    selfDeaf: true // Khuyến nghị tự điếc bot để tránh tiếng vọng
                });
                client.voiceConnections.set(guildId, connection);

                player = createAudioPlayer();
                client.voicePlayers.set(guildId, player);

                connection.subscribe(player);

                // Thiết lập các event listener cho AudioPlayer
                player.on(AudioPlayerStatus.Idle, () => {
                    console.log(`[${guildId}] Player Idle, chuyển bài tiếp theo.`);
                    playNextSong(guildId, textChannel);
                });

                player.on(AudioPlayerStatus.Playing, () => {
                    console.log(`[${guildId}] Player đang phát.`);
                });

                player.on('error', error => {
                    console.error(`[${guildId}] Lỗi trình phát âm thanh: ${error.message} - Nguyên nhân: ${error.stack}`);
                    textChannel.send(`⚠️ Có lỗi xảy ra khi phát nhạc: \`${error.message}\`. Đang thử chuyển bài...`).catch(e => console.error("Error sending error message:", e));
                    playNextSong(guildId, textChannel); // Thử chuyển bài tiếp theo
                });

                // Xử lý các sự kiện của VoiceConnection (tùy chọn)
                connection.on('stateChange', (oldState, newState) => {
                    console.log(`[${guildId}] Voice connection state changed from ${oldState.status} to ${newState.status}`);
                    if (newState.status === 'disconnected') {
                        // Xử lý khi bot bị ngắt kết nối khỏi kênh thoại
                        console.warn(`[${guildId}] Bot bị ngắt kết nối khỏi kênh thoại.`);
                        if (player) player.stop();
                        if (connection) connection.destroy();
                        client.voicePlayers.delete(guildId);
                        client.musicQueues.delete(guildId);
                        client.voiceConnections.delete(guildId);
                        textChannel.send('Đã bị ngắt kết nối khỏi kênh thoại.').catch(e => console.error("Error sending disconnect message:", e));
                    }
                });
            } else if (connection.state.status === 'disconnected') {
                // Xử lý trường hợp player tồn tại nhưng connection bị ngắt
                console.warn(`[${guildId}] Player tồn tại nhưng connection bị ngắt. Đang cố gắng kết nối lại.`);
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: guildId,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                    selfDeaf: true
                });
                client.voiceConnections.set(guildId, connection);
                connection.subscribe(player);
            }


            // 8. Thêm bài hát vào hàng đợi
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
                requester: interaction.user // Lưu thông tin người yêu cầu
            });

            // 9. Phản hồi người dùng và bắt đầu phát nếu player đang rảnh
            if (player.state.status === AudioPlayerStatus.Idle || player.state.status === AudioPlayerStatus.Buffering) {
                // Nếu player đang rảnh (Idle) hoặc đang buffering bài cũ mà chưa phát
                console.log(`[${guildId}] Player rảnh hoặc buffering, bắt đầu phát ngay: ${title}`);
                await interaction.followUp(`🎶 Đang bắt đầu phát: **[${title}](${url})** - Yêu cầu bởi: ${interaction.user.tag}`);
                playNextSong(guildId, textChannel);
            } else {
                // Nếu player đang bận, thêm vào hàng đợi
                console.log(`[${guildId}] Player bận, thêm vào hàng đợi: ${title}. Vị trí: ${queue.length}.`);
                await interaction.followUp(`🎶 Đã thêm **[${title}](${url})** vào hàng đợi! Vị trí: ${queue.length}.`);
            }

        } catch (e) {
            console.error(`[${guildId}] Lỗi trong lệnh /play:`, e);
            if (e.name === 'AbortError' || e.name === 'FetchError') { // Lỗi timeout hoặc không kết nối được với backend
                await interaction.followUp('❌ Không thể kết nối với máy chủ âm nhạc (API backend). Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
            } else if (e.message.includes('No such channel')) { // Lỗi nếu kênh thoại không tồn tại
                 await interaction.followUp('❌ Kênh thoại không hợp lệ hoặc đã bị xóa.');
            }
            else {
                await interaction.followUp(`❌ Có lỗi xảy ra khi xử lý yêu cầu của bạn: \`${e.message}\`.`);
            }
        }
    },
};
