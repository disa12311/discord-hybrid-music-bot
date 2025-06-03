// index.js
import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { DisTube } from 'distube';
import { SoundCloudPlugin } from '@distube/soundcloud';
import { SpotifyPlugin } from '@distube/spotify';
import { YtDlpPlugin } from '@distube/yt-dlp';
import dotenv from 'dotenv';
import { loadCommands } from './src/handlers/commandHandler.js';
import { loadEvents } from './src/handlers/eventHandler.js';
import { config } from './src/config.js';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Quan trọng cho prefix commands và đọc tin nhắn
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages, // Nếu bạn muốn bot phản hồi tin nhắn trực tiếp
    ],
    partials: [Partials.Channel, Partials.Message], // Quan trọng cho Direct Messages và reaction roles
});

// Khởi tạo DisTube
client.distube = new DisTube(client, {
    emitNewSongOnly: true,
    leaveOnFinish: true,
    leaveOnEmpty: true,
    emptyCooldown: 60, // Thời gian bot ở lại kênh thoại nếu không có ai
    plugins: [
        new SoundCloudPlugin(),
        new SpotifyPlugin({
            emitEventsAfterFetching: true
        }),
        new YtDlpPlugin()
    ],
});

client.config = config; // Gán config vào client để dễ dàng truy cập

// Load Commands và Events
(async () => {
    await loadCommands(client);
    await loadEvents(client);

    // Đăng ký Slash Commands sau khi bot sẵn sàng
    client.once('ready', async () => {
        console.log(`Logged in as ${client.user.tag}!`);

        // Đăng ký slash commands toàn cầu (global)
        await client.application.commands.set(client.slashCommands);
        console.log('Successfully registered global slash commands.');

        // Nếu bạn muốn đăng ký slash commands cho một guild cụ thể để test nhanh hơn:
        // const guildId = process.env.GUILD_ID;
        // if (guildId) {
        //     const guild = client.guilds.cache.get(guildId);
        //     if (guild) {
        //         await guild.commands.set(client.slashCommands);
        //         console.log(`Successfully registered guild commands for ${guild.name}.`);
        //     } else {
        //         console.warn(`[WARNING] GUILD_ID ${guildId} not found. Could not register guild commands.`);
        //     }
        // }
    });
})();


// Xử lý các sự kiện của DisTube
client.distube
    .on('playSong', (queue, song) =>
        queue.textChannel.send(
            `🎶 Đang phát \`${song.name}\` - \`${song.formattedDuration}\`\nĐược yêu cầu bởi: ${song.user}`
        )
    )
    .on('addSong', (queue, song) =>
        queue.textChannel.send(
            `➕ Đã thêm ${song.name} - \`${song.formattedDuration}\` vào hàng chờ bởi ${song.user}`
        )
    )
    .on('addList', (queue, playlist) =>
        queue.textChannel.send(
            `➕ Đã thêm \`${playlist.name}\` (${playlist.songs.length} bài hát) vào hàng chờ`
        )
    )
    .on('error', (channel, e) => {
        if (channel) channel.send(`🚫 Đã xảy ra lỗi: ${e.toString().slice(0, 1974)}`);
        else console.error(e);
    })
    .on('empty', queue => queue.textChannel.send('Kênh thoại trống rỗng! Đang rời đi...'))
    .on('searchNoResult', (message, query) =>
        message.channel.send(`❌ Không tìm thấy kết quả cho \`${query}\`!`)
    )
    .on('finish', queue => queue.textChannel.send('Không còn bài hát nào trong hàng chờ, đang rời đi...'));


client.login(process.env.DISCORD_TOKEN);
