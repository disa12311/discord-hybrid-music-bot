// src/commands/music/play.js
const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const fetch = require('node-fetch');
const { createPlayingEmbed, createAddedToQueueEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Phát một bài hát hoặc danh sách phát từ URL/tên.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Tên bài hát hoặc URL (YouTube, Spotify, SoundCloud, v.v.)')
                .setRequired(true)),

    async execute(interaction, client) {
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel;
        const guildId = interaction.guild.id;
        const textChannel = interaction.channel;
        const logPrefix = `[PlayCommand][${guildId}]`;

        if (!voiceChannel) {
            return interaction.reply({ content: 'Bạn phải ở trong một kênh thoại để sử dụng lệnh này!', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const pythonApiUrl = `${process.env.PYTHON_API_URL}?query=${encodeURIComponent(query)}`;
            client.logger.info(`${logPrefix} Đang tìm kiếm nhạc cho query: "${query}" từ API: ${pythonApiUrl}`);

            const response = await fetch(pythonApiUrl, {
                timeout: 15000 // 15 giây timeout
            });

            if (!response.ok) {
                const errorBody = await response.text();
                let errorMessage = `Lỗi không xác định (${response.status})`;
                try {
                    const errorJson = JSON.parse(errorBody);
                    errorMessage = errorJson.error || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = `Lỗi từ backend (${response.status}): ${errorBody.substring(0, 100)}...`;
                }
                client.logger.error(`${logPrefix} Backend Python trả về lỗi ${response.status}: ${errorMessage}`);
                return interaction.followUp(`❌ Lỗi khi tìm nhạc: ${errorMessage}. Vui lòng thử lại hoặc kiểm tra truy vấn.`);
            }

            const data = await response.json();
            const { title, url, stream_url, duration, thumbnail } = data;

            if (!stream_url) {
                client.logger.warn(`${logPrefix} Không tìm thấy stream_url cho query: "${query}"`);
                return interaction.followUp(`🤷‍♀️ Không thể tìm thấy luồng âm thanh hợp lệ cho "${query}". Vui lòng thử lại với một truy vấn khác.`);
            }

            const { connection, player } = await client.helpers.ensureVoiceConnectionAndPlayer(voiceChannel, client, textChannel);

            if (!client.musicQueues.has(guildId)) {
                client.musicQueues.set(guildId, []);
            }
            const queue = client.musicQueues.get(guildId);
            
            const newSong = {
                title,
                url,
                stream_url,
                duration,
                thumbnail,
                requester: interaction.user,
                textChannelId: textChannel.id
            };
            queue.push(newSong);

            // Lưu ID kênh văn bản cuối cùng để bot biết gửi tin nhắn khi rời kênh/hết queue
            queue._lastTextChannelId = textChannel.id; // Thêm thuộc tính riêng cho queue object

            if (player.state.status === AudioPlayerStatus.Idle || player.state.status === AudioPlayerStatus.Buffering) {
                client.logger.info(`${logPrefix} Player rảnh hoặc buffering, bắt đầu phát ngay: ${title}`);
                const embed = createPlayingEmbed(newSong, interaction.user);
                await interaction.followUp({ embeds: [embed] });
                client.helpers.playNextSong(guildId, client);
            } else {
                client.logger.info(`${logPrefix} Player bận, thêm vào hàng đợi: ${title}. Vị trí: ${queue.length}.`);
                const embed = createAddedToQueueEmbed(newSong, interaction.user, queue.length);
                await interaction.followUp({ embeds: [embed] });
            }

        } catch (e) {
            client.handleError(e, interaction, client);
        }
    },
};
