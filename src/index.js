// src/index.js
require('dotenv').config(); // Tải biến môi trường từ .env ngay từ đầu

const {
    Client,
    GatewayIntentBits,
    Collection,
    Events // Import Events từ discord.js
} = require('discord.js');

const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    entersState, // Import entersState để chờ trạng thái
    VoiceConnectionStatus // Import VoiceConnectionStatus
} = require('@discordjs/voice');

const path = require('path');
const fs = require('fs');

// Lấy TOKEN, CLIENT_ID, GUILD_ID từ biến môi trường
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID; // Guild ID cho việc đăng ký lệnh phát triển

if (!DISCORD_TOKEN) {
    console.error("ERROR: DISCORD_TOKEN không được tìm thấy trong biến môi trường. Bot sẽ không thể đăng nhập.");
    process.exit(1); // Thoát ứng dụng nếu không có token
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates, // Rất quan trọng cho bot nhạc
        // GatewayIntentBits.MessageContent // Chỉ bật nếu bạn cần đọc tin nhắn không phải lệnh slash commands
    ]
});

// Sử dụng Collection để lưu trữ Commands, VoicePlayers, MusicQueues, VoiceConnections
client.commands = new Collection();
client.voicePlayers = new Collection();     // Map: guildId -> AudioPlayer
client.musicQueues = new Collection();      // Map: guildId -> Array of songs
client.voiceConnections = new Collection(); // Map: guildId -> VoiceConnection

// --- Helper Function: playNextSong (tách riêng logic rõ ràng) ---
/**
 * Phát bài hát tiếp theo trong hàng đợi cho một guild cụ thể.
 * Nếu hàng đợi trống, bot sẽ dừng player và rời kênh thoại.
 * @param {string} guildId - ID của guild.
 * @param {import('discord.js').TextChannel} textChannel - Kênh văn bản để gửi thông báo.
 */
async function playNextSong(guildId, textChannel) {
    const queue = client.musicQueues.get(guildId);
    const player = client.voicePlayers.get(guildId);
    const connection = client.voiceConnections.get(guildId);

    if (!queue || queue.length === 0) {
        console.log(`[${guildId}] Hàng đợi trống. Đang dừng và rời kênh.`);
        if (player) {
            player.stop();
            client.voicePlayers.delete(guildId);
        }
        if (connection) {
            try {
                connection.destroy(); // Hủy kết nối thoại
                client.voiceConnections.delete(guildId);
            } catch (err) {
                console.error(`[${guildId}] Lỗi khi hủy kết nối thoại: ${err.message}`);
            }
        }
        client.musicQueues.delete(guildId);
        if (textChannel) {
            textChannel.send('Hàng đợi đã hết! Đã rời khỏi kênh thoại.').catch(e => console.error(`[${guildId}] Lỗi gửi tin nhắn: ${e.message}`));
        }
        return;
    }

    const song = queue.shift(); // Lấy bài hát đầu tiên và xóa khỏi hàng đợi
    const resource = createAudioResource(song.stream_url, {
        // Thêm tùy chọn nếu cần, ví dụ: inputType: StreamType.Arbitrary
    });

    try {
        player.play(resource);
        console.log(`[${guildId}] Đang phát bài hát: ${song.title}`);
        if (textChannel) {
            textChannel.send(`🎶 Đang phát: **[${song.title}](${song.url})** - Yêu cầu bởi: ${song.requester.tag}`).catch(e => console.error(`[${guildId}] Lỗi gửi tin nhắn: ${e.message}`));
        }
    } catch (err) {
        console.error(`[${guildId}] Lỗi khi phát resource cho bài ${song.title}: ${err.message}`);
        textChannel.send(`⚠️ Lỗi khi phát bài hát: \`${song.title}\`. Đang thử chuyển bài...`).catch(e => console.error(`[${guildId}] Lỗi gửi tin nhắn: ${e.message}`));
        playNextSong(guildId, textChannel); // Thử phát bài tiếp theo
    }
}

// --- Tải Commands từ thư mục 'commands' ---
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

// --- Tải Events từ thư mục 'events' ---
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

// --- Xử lý tương tác lệnh (Slash Commands) ---
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Không tìm thấy lệnh ${interaction.commandName}.`);
        return;
    }

    try {
        // Truyền các đối tượng cần thiết vào hàm execute của command
        // playNextSong được truyền để các lệnh (như skip) có thể gọi nó
        await command.execute(interaction, client, client.musicQueues, playNextSong);
    } catch (error) {
        console.error(`Lỗi khi thực thi lệnh '${interaction.commandName}':`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Có lỗi xảy ra khi thực thi lệnh này!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Có lỗi xảy ra khi thực thi lệnh này!', ephemeral: true });
        }
    }
});

// --- Xử lý các sự kiện VoiceStateUpdate (quan trọng để bot tự động rời kênh) ---
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    // Nếu bot không ở trong một kênh thoại
    if (newState.id === client.user.id && !newState.channelId) {
        const guildId = newState.guild.id;
        const player = client.voicePlayers.get(guildId);
        const queue = client.musicQueues.get(guildId);
        const connection = client.voiceConnections.get(guildId);

        if (player) {
            player.stop(); // Dừng player
            client.voicePlayers.delete(guildId);
            console.log(`[${guildId}] Bot đã bị ngắt kết nối khỏi kênh thoại. Player đã dừng.`);
        }
        if (queue) {
            client.musicQueues.delete(guildId); // Xóa hàng đợi
            console.log(`[${guildId}] Hàng đợi nhạc đã bị xóa.`);
        }
        if (connection) {
            try {
                connection.destroy(); // Hủy kết nối
                client.voiceConnections.delete(guildId);
                console.log(`[${guildId}] Kết nối thoại đã bị hủy.`);
            } catch (err) {
                console.error(`[${guildId}] Lỗi khi hủy kết nối thoại trong VoiceStateUpdate: ${err.message}`);
            }
        }
    }
});


// --- Xử lý lỗi toàn cục để tăng cường độ ổn định của bot ---
process.on('unhandledRejection', error => {
    console.error('Lỗi Promise không được xử lý (unhandledRejection):', error);
    // Đây là lỗi promise không bị bắt. Bot sẽ không crash nhưng cần được sửa.
    // Thường do quên .catch() hoặc try/catch.
});
process.on('uncaughtException', error => {
    console.error('Ngoại lệ chưa bắt (uncaughtException):', error);
    // Đây là lỗi nghiêm trọng, Node.js process sẽ crash.
    // Nếu bạn dùng PM2, nó sẽ tự động khởi động lại bot.
    // Đảm bảo ghi log đầy đủ thông tin lỗi.
    // Sau khi log, có thể thoát process để PM2 khởi động lại.
    // process.exit(1); 
});

client.login(DISCORD_TOKEN);
