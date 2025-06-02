// src/commands/play.js
const { SlashCommandBuilder } = require('discord.js');
const { QueryType } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Phát nhạc từ từ khóa hoặc URL.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Từ khóa tìm kiếm hoặc URL của bài hát/playlist')
                .setRequired(true)
                .setAutocomplete(true) // Bật autocomplete cho tùy chọn này
        ),
    // Hàm autocomplete (sẽ xử lý phía frontend để gọi backend Python)
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const PYTHON_API_BASE_URL = process.env.PYTHON_API_BASE_URL;

        if (!PYTHON_API_BASE_URL) {
            console.error("Thiếu biến môi trường PYTHON_API_BASE_URL. Không thể gọi backend Python cho autocomplete.");
            return interaction.respond([]);
        }

        if (focusedValue.length < 3) { // Chỉ gửi yêu cầu nếu query đủ dài
            return interaction.respond([]);
        }

        try {
            const api_url = `${PYTHON_API_BASE_URL}/api/suggest?query=${encodeURIComponent(focusedValue)}`;
            console.log(`[Autocomplete] Đang gọi API gợi ý: ${api_url}`);

            const response = await fetch(api_url);
            if (!response.ok) {
                console.error(`[Autocomplete] Lỗi HTTP: ${response.status} ${response.statusText} khi gọi ${api_url}`);
                return interaction.respond([]);
            }

            const data = await response.json();
            if (data.error || !data.suggestions) {
                console.error(`[Autocomplete] Backend trả về lỗi hoặc thiếu gợi ý: ${data.error || 'Dữ liệu không hợp lệ'}`);
                return interaction.respond([]);
            }

            const choices = data.suggestions.map(suggestion => ({
                name: suggestion.title.length > 100 ? suggestion.title.substring(0, 97) + '...' : suggestion.title,
                value: suggestion.url // Dùng URL làm giá trị để dễ dàng phát
            }));

            // Giới hạn 25 gợi ý Discord cho phép
            await interaction.respond(choices.slice(0, 25));

        } catch (error) {
            console.error(`[Autocomplete] Lỗi khi xử lý gợi ý:`, error);
            await interaction.respond([]);
        }
    },
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true }); // Tạm hoãn phản hồi để có thời gian xử lý

        const query = interaction.options.getString('query');
        const { channel } = interaction.member.voice;

        if (!channel) {
            return interaction.editReply('Bạn phải ở trong kênh thoại để sử dụng lệnh này!');
        }

        const queue = interaction.client.player.queues.create(interaction.guild, {
            metadata: {
                channel: interaction.channel,
                // voiceChannel: channel, // Không cần thiết ở đây, discord-player tự quản lý
                client: interaction.client // Có thể gán client vào metadata nếu cần truy cập sau này
            },
            volume: 50, // Mặc định âm lượng
            leaveOnEmpty: true, // Tự động rời kênh khi không có ai
            leaveOnEnd: true, // Tự động rời kênh khi hàng đợi trống
            leaveOnStop: true, // Tự động rời kênh khi dừng nhạc
            // Các tùy chọn khác của Discord Player
            ytdlOptions: {
                // Các tùy chọn YTDL cụ thể cho queue này (nếu khác với global)
            },
            connectionTimeout: 60000, // Timeout kết nối voice (ms)
            // ... các tùy chọn khác
        });

        try {
            if (!queue.connection) {
                await queue.connect(channel);
            }
        } catch (error) {
            console.error(`[Play Command] Lỗi kết nối kênh thoại:`, error);
            queue.delete();
            return interaction.editReply(`Không thể kết nối đến kênh thoại của bạn: ${error.message}`);
        }

        try {
            // Sử dụng player.search để tìm kiếm, nó sẽ dùng extractor Python đã đăng ký
            const result = await interaction.client.player.search(query, {
                requestedBy: interaction.user,
                // Loại query, Discord Player sẽ tự động phát hiện dựa trên extractor
                // queryType: QueryType.AUTO,
                searchEngine: 'python-backend-search', // Đảm bảo sử dụng extractor của bạn
            });

            if (!result.tracks.length) {
                return interaction.editReply(`Không tìm thấy bài hát nào cho "${query}"`);
            }

            // Nếu kết quả là một playlist (ví dụ từ backend Python trả về nhiều entry)
            // Tuy nhiên, với cấu hình hiện tại của backend, nó trả về 1 bài hát chính
            // Nếu bạn muốn backend trả về playlist, logic ở đây sẽ cần xử lý `result.playlist`
            if (result.playlist) {
                await queue.addTrack(result.tracks); // Thêm tất cả bài hát từ playlist
                return interaction.editReply(`🎶 Đã thêm **${result.tracks.length}** bài hát từ playlist **${result.playlist.title}** vào hàng đợi.`);
            } else {
                await queue.addTrack(result.tracks[0]); // Thêm bài hát đầu tiên
                return interaction.editReply(`🎵 Đã thêm **${result.tracks[0].title}** vào hàng đợi.`);
            }

        } catch (error) {
            console.error(`[Play Command] Lỗi khi tìm kiếm hoặc thêm bài hát:`, error);
            return interaction.editReply(`Có lỗi xảy ra khi phát nhạc: ${error.message}`);
        }
    },
};
