// src/utils/helpers.js
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    entersState,
    VoiceConnectionStatus
} = require('@discordjs/voice');
const { createPlayingEmbed } = require('./embeds');

/**
 * Phát bài hát tiếp theo trong hàng đợi cho một guild cụ thể.
 * @param {string} guildId - ID của guild.
 * @param {import('discord.js').Client} client - Đối tượng client Discord.
 */
async function playNextSong(guildId, client) {
    const queue = client.musicQueues.get(guildId);
    const player = client.voicePlayers.get(guildId);
    const connection = client.voiceConnections.get(guildId);
    const logPrefix = `[playNextSong][${guildId}]`;

    const storedTextChannelId = queue?._lastTextChannelId;
    let textChannel = null;
    if (storedTextChannelId) {
        textChannel = await client.channels.fetch(storedTextChannelId).catch(() => null);
    }

    let songToPlay = null;

    if (queue && queue.length > 0) {
        if (queue._loopMode === 'song') {
            songToPlay = queue[0];
            client.logger.info(`${logPrefix} Chế độ lặp bài hát: Đang lặp lại bài: ${songToPlay.title}`);
        } else if (queue._loopMode === 'queue') {
            const playedSong = queue.shift();
            queue.push(playedSong);
            songToPlay = queue[0];
            client.logger.info(`${logPrefix} Chế độ lặp hàng đợi: Đã đưa "${playedSong.title}" về cuối hàng đợi. Đang phát: ${songToPlay.title}`);
        } else { // Chế độ 'off' hoặc không xác định
            songToPlay = queue.shift();
            client.logger.info(`${logPrefix} Chế độ không lặp: Đang phát bài: ${songToPlay.title}`);
        }
    }


    if (!songToPlay) { // Nếu không có bài hát nào để phát (queue trống hoặc lỗi)
        client.logger.info(`${logPrefix} Hàng đợi trống hoặc không có bài hát để phát. Đang dừng và rời kênh.`);

        if (textChannel) {
            await textChannel.send('Hàng đợi đã hết! Đã rời khỏi kênh thoại.').catch(e => client.logger.error(`${logPrefix} Lỗi gửi tin nhắn: ${e.message}`));
        }

        if (player) {
            player.stop();
            client.voicePlayers.delete(guildId);
        }
        if (connection && connection.state.status !== 'destroyed') {
            try {
                connection.destroy();
                client.voiceConnections.delete(guildId);
            } catch (err) {
                client.logger.error(`${logPrefix} Lỗi khi hủy kết nối thoại: ${err.message}`, err);
            }
        }
        client.musicQueues.delete(guildId);
        return;
    }


    const resource = createAudioResource(songToPlay.stream_url, {
        inlineVolume: true // Cho phép điều chỉnh âm lượng
    });

    try {
        player.play(resource);
        client.logger.info(`${logPrefix} Đang phát bài hát: ${songToPlay.title}`);
        if (textChannel) {
            const embed = createPlayingEmbed(songToPlay, songToPlay.requester);
            await textChannel.send({ embeds: [embed] }).catch(e => client.logger.error(`${logPrefix} Lỗi gửi tin nhắn: ${e.message}`));
        }
    } catch (err) {
        client.logger.error(`${logPrefix} Lỗi khi phát resource cho bài ${songToPlay.title}: ${err.message}`, err);
        if (textChannel) {
            await textChannel.send(`⚠️ Lỗi khi phát bài hát: \`${songToPlay.title}\`. Đang thử chuyển bài...`).catch(e => client.logger.error(`${logPrefix} Lỗi gửi tin nhắn: ${e.message}`));
        }
        playNextSong(guildId, client);
    }
}

/**
 * Đảm bảo bot đang ở trong kênh thoại và đã có player/connection.
 * Nếu chưa, tạo mới và thiết lập các listeners cần thiết.
 * @param {import('discord.js').VoiceChannel} voiceChannel - Kênh thoại để tham gia.
 * @param {import('discord.js').Client} client - Đối tượng client Discord.
 * @param {import('discord.js').TextChannel} textChannel - Kênh văn bản để gửi thông báo.
 * @returns {object} - { connection, player }
 */
async function ensureVoiceConnectionAndPlayer(voiceChannel, client, textChannel) {
    const guildId = voiceChannel.guild.id;
    let player = client.voicePlayers.get(guildId);
    let connection = client.voiceConnections.get(guildId);
    const logPrefix = `[ensureVoiceConnectionAndPlayer][${guildId}]`;

    if (!player || !connection || connection.state.status === VoiceConnectionStatus.Disconnected || connection.state.status === VoiceConnectionStatus.Destroyed) {
        client.logger.info(`${logPrefix} Thiết lập VoiceConnection và AudioPlayer mới.`);
        connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: true
        });
        client.voiceConnections.set(guildId, connection);

        player = createAudioPlayer();
        client.voicePlayers.set(guildId, player);

        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            client.logger.info(`${logPrefix} Player Idle, chuyển bài tiếp theo.`);
            playNextSong(guildId, client);
        });

        player.on(AudioPlayerStatus.Playing, () => {
            client.logger.info(`${logPrefix} Player đang phát.`);
        });

        player.on('error', error => {
            client.logger.error(`${logPrefix} Lỗi trình phát âm thanh: ${error.message} - Nguyên nhân: ${error.stack}`, error);
            if (textChannel) {
                textChannel.send(`⚠️ Có lỗi xảy ra khi phát nhạc: \`${error.message}\`. Đang thử chuyển bài...`).catch(e => client.logger.error(`${logPrefix} Lỗi gửi tin nhắn: ${e.message}`));
            }
            playNextSong(guildId, client);
        });

        connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            client.logger.warn(`${logPrefix} Voice connection disconnected: ${newState.reason}`);
            try {
                await entersState(connection, VoiceConnectionStatus.Ready, 5_000);
                client.logger.info(`${logPrefix} Kết nối thoại đã phục hồi.`);
            } catch (err) {
                client.logger.error(`${logPrefix} Bot bị ngắt kết nối khỏi kênh thoại và không thể kết nối lại: ${err.message}`, err);
                if (textChannel) {
                    textChannel.send('Đã bị ngắt kết nối khỏi kênh thoại và không thể kết nối lại.').catch(e => client.logger.error(`${logPrefix} Lỗi gửi tin nhắn: ${e.message}`));
                }
                // Dọn dẹp tài nguyên
                if (player) {
                    player.stop();
                    client.voicePlayers.delete(guildId);
                }
                if (client.musicQueues.has(guildId)) {
                    client.musicQueues.delete(guildId);
                }
                if (connection && connection.state.status !== 'destroyed') {
                    connection.destroy();
                    client.voiceConnections.delete(guildId);
                }
            }
        });

        connection.on(VoiceConnectionStatus.Destroyed, () => {
            client.logger.info(`${logPrefix} Voice connection destroyed.`);
            if (player) {
                player.stop();
                client.voicePlayers.delete(guildId);
            }
            client.musicQueues.delete(guildId);
            client.voiceConnections.delete(guildId);
        });
    }
    return { connection, player };
}

module.exports = {
    playNextSong,
    ensureVoiceConnectionAndPlayer,
};
