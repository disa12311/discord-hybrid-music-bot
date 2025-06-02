// src/index.js
require('dotenv').config(); // Load biến môi trường từ .env
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { Player } = require('discord-player');
const setupErrorHandler = require('./utils/errorHandler'); // Import error handler

// --- Cấu hình Client Discord ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,           // Cần để lấy thông tin guild (server)
        GatewayIntentBits.GuildMessages,    // Cần để đọc và gửi tin nhắn
        GatewayIntentBits.MessageContent,   // Cần để đọc nội dung tin nhắn (nếu dùng prefix commands, hiện tại tập trung slash)
        GatewayIntentBits.GuildVoiceStates, // Cần để bot kết nối và quản lý voice channel
    ],
});

// Gán Collection cho commands và events để dễ dàng truy cập
client.commands = new Collection();
client.events = new Collection();

// --- Tải Commands và Events ---
const loadFiles = (dir, collection, type) => {
    const filesPath = path.join(__dirname, dir);
    const fileNames = fs.readdirSync(filesPath).filter(file => file.endsWith('.js'));

    for (const file of fileNames) {
        const filePath = path.join(filesPath, file);
        const module = require(filePath);
        if ('data' in module || 'name' in module) { // Kiểm tra có phải lệnh hoặc sự kiện hợp lệ
            collection.set(module.data?.name || module.name, module);
            console.log(`[LOADER] Đã tải ${type}: ${module.data?.name || module.name}`);
        } else {
            console.warn(`[LOADER] ${filePath} thiếu thuộc tính "data" hoặc "name" bắt buộc.`);
        }
    }
};

loadFiles('commands', client.commands, 'lệnh');
loadFiles('events', client.events, 'sự kiện');

// --- Cấu hình Discord Player ---
const player = new Player(client, {
    ytdlOptions: {
        filter: 'audioonly', // Chỉ lấy audio
        quality: 'highestaudio',
        // highWaterMark: 1 << 25, // Tùy chỉnh buffer nếu cần
    },
    // Đặt options cho engine tìm kiếm mặc định
    // Ví dụ: searchSongs: 5 để tìm 5 bài hát nếu query không phải URL
    // Tuy nhiên, chúng ta sẽ override search engine để dùng Python backend
});

// Gán player cho client để các lệnh có thể truy cập
client.player = player;

// --- Ghi đè Search Engine của Discord Player để sử dụng Python Backend ---
// Đây là cải tiến quan trọng để bot sử dụng backend Python của bạn
player.extractors.register(async (query, options) => {
    // Chỉ xử lý nếu query không phải là một URL đã được hỗ trợ bởi các extractor khác của discord-player
    // hoặc nếu bạn muốn MỌI TÌM KIẾM đều qua backend Python của bạn
    // if (query.startsWith('http://') || query.startsWith('https://')) return; // Bỏ qua nếu là URL

    const PYTHON_API_BASE_URL = process.env.PYTHON_API_BASE_URL;
    if (!PYTHON_API_BASE_URL) {
        console.error("Thiếu biến môi trường PYTHON_API_BASE_URL. Không thể gọi backend Python.");
        return null; // Không thể tìm kiếm
    }

    try {
        // Tạo URL API cho music info
        const api_url = `${PYTHON_API_BASE_URL}/api/get_music_info?query=${encodeURIComponent(query)}`;
        console.log(`[Python Backend] Đang gọi API: ${api_url}`);

        const response = await fetch(api_url);
        if (!response.ok) {
            console.error(`[Python Backend] Lỗi HTTP: ${response.status} ${response.statusText} khi gọi ${api_url}`);
            const errorText = await response.text();
            console.error(`[Python Backend] Phản hồi lỗi: ${errorText}`);
            return null; // Không tìm thấy hoặc lỗi từ backend
        }

        const data = await response.json();

        if (data.error) {
            console.error(`[Python Backend] Backend trả về lỗi: ${data.error}`);
            return null;
        }

        if (!data.stream_url) {
            console.error(`[Python Backend] Không tìm thấy stream_url trong phản hồi từ backend cho query: ${query}`);
            return null;
        }

        // Trả về một đối tượng Track phù hợp với Discord Player
        // Type có thể là 'track', 'playlist', 'album', 'artist'
        return {
            playlist: null, // Không phải playlist
            type: 'track',
            url: data.url, // URL của trang gốc (YouTube)
            title: data.title,
            description: data.title, // Có thể cải thiện sau
            author: data.uploader || 'Unknown', // Thêm uploader nếu có
            thumbnail: data.thumbnail,
            duration: data.duration ? player.utils.formatTime(data.duration * 1000) : '0:00', // Format thời lượng
            views: data.view_count || 0,
            requestedBy: null, // Sẽ được điền khi add vào queue
            source: 'custom_python_backend', // Nguồn tùy chỉnh của bạn
            raw: {
                streamUrl: data.stream_url, // Stream URL trực tiếp từ backend
                url: data.url,
                duration: data.duration
            },
            // streamURL: data.stream_url // Discord-player sẽ tự động tìm từ raw.streamUrl hoặc url
        };
    } catch (error) {
        console.error(`[Python Backend] Lỗi khi gọi backend Python hoặc xử lý dữ liệu:`, error);
        return null; // Lỗi trong quá trình tìm kiếm
    }
}, { name: 'python-backend-search', parallelism: 1, searchable: true }); // Đăng ký extractor mới với tên duy nhất

// Đăng ký Event Listener cho Discord Player
client.player.events.on('playerStart', (queue, track) => {
    // Gửi thông báo khi bắt đầu phát nhạc
    queue.metadata.channel.send(`🎶 Đang phát: **${track.title}** của **${track.author}**!`);
});

client.player.events.on('audioTrackAdd', (queue, track) => {
    queue.metadata.channel.send(`🎵 Đã thêm **${track.title}** vào hàng đợi!`);
});

client.player.events.on('disconnect', queue => {
    queue.metadata.channel.send('❌ Bot đã bị ngắt kết nối khỏi kênh thoại.');
});

client.player.events.on('emptyChannel', queue => {
    queue.metadata.channel.send('🔊 Kênh thoại trống rỗng! Đang rời kênh...');
    queue.connection.destroy(); // Tự động rời kênh và hủy kết nối
});

client.player.events.on('emptyQueue', queue => {
    queue.metadata.channel.send('✅ Hàng đợi đã kết thúc. Đang rời kênh...');
    queue.connection.destroy(); // Tự động rời kênh và hủy kết nối
});

client.player.events.on('error', (queue, error) => {
    console.error(`[Discord Player Error] ${error.message}`);
    // console.error(error); // Log đầy đủ lỗi nếu cần
    if (queue) {
        queue.metadata.channel.send(`🚫 Đã xảy ra lỗi khi phát nhạc: ${error.message}`);
    } else {
        // Gửi lỗi chung đến kênh admin nếu không có queue cụ thể
        const adminLogChannel = client.channels.cache.get(process.env.ADMIN_LOG_CHANNEL_ID);
        if (adminLogChannel) {
            adminLogChannel.send(`🚫 [Discord Player Error] Đã xảy ra lỗi tổng quát: ${error.message}`);
        }
    }
});

// --- Setup Error Handler Toàn Cục ---
setupErrorHandler(client); // Truyền client vào để error handler có thể gửi thông báo

// --- Đăng nhập Bot ---
client.login(process.env.DISCORD_TOKEN);
