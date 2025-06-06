// index.js
import { Client, GatewayIntentBits, Partials, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
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
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions, // Cho Reaction Role
        GatewayIntentBits.GuildMembers,         // Cho Moderation và Reaction Role
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember,
    ],
});

// Khởi tạo DisTube
client.distube = new DisTube(client, {
    emitNewSongOnly: true,
    leaveOnFinish: true,
    leaveOnEmpty: true,
    emptyCooldown: 60,
    plugins: [
        new SoundCloudPlugin(),
        new SpotifyPlugin({
            emitEventsAfterFetching: true
        }),
        new YtDlpPlugin()
    ],
});

client.config = config; // Gán config vào client để dễ dàng truy cập

// Sử dụng Map để lưu trữ thông tin reaction roles (tạm thời, nên dùng DB cho bền vững)
client.reactionRoles = new Map();

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
    .on('playSong', (queue, song) => {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('distube-pause-resume')
                    .setLabel('⏸️/▶️ Dừng/Tiếp tục')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('distube-skip')
                    .setLabel('⏭️ Bỏ qua')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('distube-stop')
                    .setLabel('⏹️ Dừng')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('distube-loop')
                    .setLabel('🔁 Lặp')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('distube-queue')
                    .setLabel('📜 Hàng chờ')
                    .setStyle(ButtonStyle.Secondary),
            );

        queue.textChannel.send({
            embeds: [{
                title: '🎶 Đang phát',
                description: `[${song.name}](${song.url})`,
                thumbnail: { url: song.thumbnail },
                fields: [
                    { name: 'Thời lượng', value: `\`${song.formattedDuration}\``, inline: true },
                    { name: 'Được yêu cầu bởi', value: `${song.user}`, inline: true },
                    { name: 'Lượt xem', value: `${song.views.toLocaleString()}`, inline: true }
                ],
                color: client.config.embedColor,
                footer: { text: `Kênh: ${song.uploader.name}` }
            }],
            components: [row]
        });
    })
    .on('addSong', (queue, song) =>
        queue.textChannel.send(
            `➕ Đã thêm **${song.name}** - \`${song.formattedDuration}\` vào hàng chờ bởi ${song.user}`
        )
    )
    .on('addList', (queue, playlist) =>
        queue.textChannel.send(
            `➕ Đã thêm playlist \`${playlist.name}\` (${playlist.songs.length} bài hát) vào hàng chờ!`
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
