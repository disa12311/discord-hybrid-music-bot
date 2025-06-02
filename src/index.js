// src/index.js (hoặc file cấu hình player của bạn)
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Player } = require('discord-player');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();
const fetch = require('node-fetch'); // Đảm bảo đã cài node-fetch

const { registerErrorHandler } = require('./utils/errorHandler');

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TOKEN = process.env.DISCORD_TOKEN;
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL; // Lấy URL từ biến môi trường

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent, // Cần cho việc đọc tin nhắn nếu bạn có lệnh prefix hoặc tương tác tin nhắn
    ],
});

client.commands = new Collection();
client.cooldowns = new Collection(); // Khởi tạo Collection cho cooldowns
client.player = new Player(client, {
    ytdlOptions: {
        quality: 'highestaudio',
        filter: 'audioonly',
        dlChunkSize: 0, // Không chia nhỏ khi download, tăng tốc độ nhưng có thể tốn RAM hơn
        liveBuffer: 5000 // Tăng buffer cho live stream
    },
    connectionTimeout: 60_000, // Tăng timeout cho kết nối
    queueTimeout: 300_000 // Tăng timeout cho queue trống
});

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`Đã tải lệnh: ${command.data.name}`);
    } else {
        console.warn(`[WARNING] Lệnh tại ${filePath} thiếu thuộc tính "data" hoặc "execute" bắt buộc.`);
    }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// ========================================================================================================
// Custom Extractor cho Python Backend
// ========================================================================================================
client.player.extractors.register(async (query, options) => {
    // Chỉ xử lý nếu query là URL hợp lệ (ví dụ: không phải là từ khóa tìm kiếm)
    // Hoặc bạn có thể bỏ qua kiểm tra này nếu muốn Python xử lý cả tìm kiếm
    try {
        const url = new URL(query); // Kiểm tra xem query có phải là URL hợp lệ không
        // Nếu là URL, gửi đến Python backend
        const response = await fetch(`${PYTHON_BACKEND_URL}/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: query })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Python Extractor] Lỗi từ Python backend (${response.status}): ${errorText}`);
            return null; // Trả về null để discord-player thử các extractor khác
        }

        const data = await response.json();
        // Kiểm tra cấu trúc dữ liệu trả về từ Python backend
        if (data && data.title && data.url && data.source) {
            // Trả về định dạng mà discord-player mong đợi
            return {
                playlist: null, // Giả định Python backend chỉ trả về 1 track, không phải playlist
                // Nếu Python có thể trả về playlist, bạn sẽ cần cấu hình lại phần này.
                tracks: [{
                    title: data.title,
                    url: data.url,
                    duration: data.duration || '00:00', // Thêm duration nếu có
                    thumbnail: data.thumbnail || null, // Thêm thumbnail nếu có
                    author: data.uploader || 'Unknown', // Thêm author/uploader nếu có
                    description: data.description || 'No description',
                    views: data.view_count || 0,
                    requestedBy: options.requestedBy || client.user,
                    source: data.source || 'custom', // Nguồn từ Python backend
                    // Các thuộc tính khác nếu Python backend cung cấp
                }]
            };
        } else {
            console.warn(`[Python Extractor] Dữ liệu không hợp lệ từ Python backend:`, data);
            return null;
        }
    } catch (e) {
        // Nếu query không phải là URL, hoặc có lỗi khi gọi fetch
        console.log(`[Python Extractor] Query không phải URL hợp lệ hoặc lỗi fetch: ${e.message}. Fallback to default extractors.`);
        return null; // Trả về null để discord-player thử các extractor khác
    }
}, {
    // Bạn có thể đặt tên và thứ tự ưu tiên cho extractor của mình
    name: 'python-youtube-extractor',
    priority: 1 // Đặt ưu tiên cao để nó được thử trước
});


// Xử lý lỗi toàn cục
registerErrorHandler(client);

client.on('ready', () => {
    console.log(`Đăng nhập thành công với tên ${client.user.tag}!`);
    console.log(`Bot đã sẵn sàng phục vụ ${client.guilds.cache.size} máy chủ.`);

    // Đăng ký các sự kiện của discord-player
    client.player.events.on('playerStart', (queue, track) => {
        if (!queue.metadata.channel) return;
        queue.metadata.channel.send(`🎶 Đang phát: **${track.title}** trong ${queue.channel.name}!`);
    });

    client.player.events.on('audioTrackAdd', (queue, track) => {
        if (!queue.metadata.channel) return;
        queue.metadata.channel.send(`🎵 Đã thêm **${track.title}** vào hàng đợi.`);
    });

    client.player.events.on('disconnect', (queue) => {
        if (!queue.metadata.channel) return;
        queue.metadata.channel.send('❌ Bot đã bị ngắt kết nối khỏi kênh thoại.');
    });

    client.player.events.on('emptyChannel', (queue) => {
        if (!queue.metadata.channel) return;
        queue.metadata.channel.send('🔊 Kênh thoại đã trống rỗng, đang rời kênh.');
    });

    client.player.events.on('emptyQueue', (queue) => {
        if (!queue.metadata.channel) return;
        queue.metadata.channel.send('✅ Hàng đợi đã trống rỗng, không còn nhạc để phát.');
    });

    client.player.events.on('error', (queue, error) => {
        console.error(`[Player Error] Lỗi từ Discord Player trong guild ${queue.guild.name}:`, error);
        if (queue.metadata.channel) {
            queue.metadata.channel.send(`🚫 Đã xảy ra lỗi khi phát nhạc: ${error.message}`);
        }
    });

    // Event khi một track không thể phát được
    client.player.events.on('playerError', (queue, error) => {
        console.error(`[Player Error] Lỗi khi phát track trong guild ${queue.guild.name}:`, error);
        if (queue.metadata.channel) {
            queue.metadata.channel.send(`🚫 Có vẻ như không thể phát bài hát này: ${error.message}`);
        }
    });
});

client.login(TOKEN);
