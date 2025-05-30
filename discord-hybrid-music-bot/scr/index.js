// src/index.js
require('dotenv').config(); // Tải biến môi trường từ .env
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { CLIENT_ID, GUILD_ID } = process.env; // Lấy từ biến môi trường

const path = require('path');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,           // Bắt buộc để nhận các sự kiện liên quan đến guild
        GatewayIntentBits.GuildVoiceStates, // Rất quan trọng cho bot nhạc để biết người dùng vào/ra kênh thoại
        // GatewayIntentBits.GuildMessages,    // Chỉ bật nếu bạn cần đọc tin nhắn không phải lệnh (ví dụ: prefix commands)
        // GatewayIntentBits.MessageContent    // Quan trọng cho prefix commands, có thể tắt nếu chỉ dùng slash commands
    ]
});

client.commands = new Collection();
client.voicePlayers = new Map();     // Map để lưu trữ AudioPlayer cho mỗi guild
client.musicQueues = new Map();      // Map để lưu trữ hàng đợi nhạc cho mỗi guild
client.voiceConnections = new Map(); // Map để lưu trữ VoiceConnection cho mỗi guild

// --- Hàm xử lý hàng đợi nhạc (tái sử dụng) ---
async function playNextSong(guildId, textChannel) {
    const queue = client.musicQueues.get(guildId);
    const player = client.voicePlayers.get(guildId);
    const connection = client.voiceConnections.get(guildId);

    if (!queue || queue.length === 0) {
        console.log(`Hàng đợi cho guild ${guildId} trống. Đang dừng.`);
        if (player) player.stop();
        if (connection) connection.destroy(); // Hủy kết nối thoại
        client.voicePlayers.delete(guildId);
        client.musicQueues.delete(guildId);
        client.voiceConnections.delete(guildId);
        if (textChannel) { // Đảm bảo kênh textChannel tồn tại trước khi gửi
            textChannel.send('Hàng đợi đã hết! Đã rời khỏi kênh thoại.').catch(console.error);
        }
        return;
    }

    const song = queue.shift(); // Lấy bài hát đầu tiên trong hàng đợi
    const resource = createAudioResource(song.stream_url);

    player.play(resource);

    if (textChannel) {
        textChannel.send(`🎶 Đang phát: **[${song.title}](${song.url})** - Yêu cầu bởi: ${song.requester.tag}`).catch(console.error);
    }
}


// Tải Commands từ thư mục 'commands'
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.warn(`[WARNING] Lệnh tại ${filePath} thiếu thuộc tính "data" hoặc "execute".`);
        }
    }
}

// Tải Events từ thư mục 'events'
const eventsPath = path.join(__dirname, 'events');
const eventFolders = fs.readdirSync(eventsPath);

for (const folder of eventFolders) {
    const folderPath = path.join(eventsPath, folder);
    const eventFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(folderPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
}


// Xử lý tương tác lệnh (Slash Commands)
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Không tìm thấy lệnh ${interaction.commandName}.`);
        return;
    }

    try {
        // Truyền các đối tượng cần thiết vào hàm execute của command
        await command.execute(interaction, client, client.musicQueues, playNextSong);
    } catch (error) {
        console.error('Lỗi khi thực thi lệnh:', error); // Ghi log lỗi chi tiết hơn
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Có lỗi xảy ra khi thực thi lệnh này!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Có lỗi xảy ra khi thực thi lệnh này!', ephemeral: true });
        }
    }
});

// --- Xử lý lỗi toàn cục để tăng cường độ ổn định của bot ---
process.on('unhandledRejection', error => {
    console.error('Lỗi không được xử lý:', error);
    // Đây là lỗi promise không bị bắt. Thường do quên .catch() hoặc try/catch.
    // Bot sẽ không crash ngay lập tức nhưng cần được sửa.
});
process.on('uncaughtException', error => {
    console.error('Ngoại lệ chưa bắt:', error);
    // Đây là lỗi nghiêm trọng, Node.js process sẽ crash.
    // Nếu bạn dùng PM2, nó sẽ tự động khởi động lại bot.
    // process.exit(1); // Tùy chọn: thoát process để PM2 (hoặc hệ thống) khởi động lại
});

client.login(process.env.DISCORD_TOKEN);
