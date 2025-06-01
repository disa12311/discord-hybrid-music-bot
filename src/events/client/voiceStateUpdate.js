// src/events/client/voiceStateUpdate.js
const { Events } = require('discord.js');
const AUTO_DISCONNECT_DELAY = 5 * 60 * 1000; // 5 phút

module.exports = {
    name: Events.VoiceStateUpdate,
    once: false,
    async execute(oldState, newState, client) {
        // Chỉ xử lý nếu guildId hợp lệ
        if (!oldState.guild?.id) return;

        const guildId = oldState.guild.id;
        const player = client.voicePlayers.get(guildId);
        const queue = client.musicQueues.get(guildId);
        const connection = client.voiceConnections.get(guildId);
        const logPrefix = `[VoiceStateUpdate][${guildId}]`;

        // Tìm kênh văn bản cuối cùng để gửi thông báo
        const storedTextChannelId = queue?._lastTextChannelId;
        let textChannel = null;
        if (storedTextChannelId) {
            textChannel = await client.channels.fetch(storedTextChannelId).catch(() => null);
        } else if (queue && queue.length > 0) {
            textChannel = await client.channels.fetch(queue[0].textChannelId).catch(() => null);
        }


        // Case 1: Bot bị ngắt kết nối (bị kick, kênh bị xóa, hoặc bot tự rời)
        if (newState.id === client.user.id && !newState.channelId) {
            client.logger.info(`${logPrefix} Bot đã rời khỏi hoặc bị ngắt kết nối khỏi kênh thoại.`);
            clearTimeout(client.autoDisconnectTimeouts.get(guildId)); // Xóa timeout nếu có
            client.autoDisconnectTimeouts.delete(guildId);

            if (player) {
                player.stop();
                client.voicePlayers.delete(guildId);
                client.logger.info(`${logPrefix} Player đã dừng.`);
            }
            if (queue) {
                client.musicQueues.delete(guildId);
                client.logger.info(`${logPrefix} Hàng đợi nhạc đã bị xóa.`);
            }
            if (connection && connection.state.status !== 'destroyed') {
                try {
                    connection.destroy();
                    client.voiceConnections.delete(guildId);
                    client.logger.info(`${logPrefix} Kết nối thoại đã bị hủy.`);
                } catch (err) {
                    client.handleError(err, null, client);
                }
            }
            if (textChannel) {
                textChannel.send('Bot đã rời khỏi kênh thoại và hàng đợi đã bị xóa.').catch(e => client.logger.error(`${logPrefix} Lỗi gửi tin nhắn rời kênh: ${e.message}`));
            }
            return;
        }

        // Case 2: Xử lý auto-disconnect khi không còn người dùng trong kênh thoại
        // Chỉ xử lý nếu bot đang trong kênh thoại và voiceState thay đổi trong cùng kênh đó
        if (connection && oldState.channelId === connection.channel.id && oldState.channelId !== newState.channelId) {
            const voiceChannel = oldState.channel;
            const membersInChannel = voiceChannel.members.filter(member => !member.user.bot);

            if (membersInChannel.size === 0) {
                client.logger.info(`${logPrefix} Người dùng cuối cùng đã rời kênh thoại. Bắt đầu đếm ngược ngắt kết nối.`);

                clearTimeout(client.autoDisconnectTimeouts.get(guildId));

                const timeout = setTimeout(async () => {
                    client.logger.info(`${logPrefix} Auto-disconnect kích hoạt sau ${AUTO_DISCONNECT_DELAY / 1000 / 60} phút.`);
                    if (connection && connection.state.status !== 'destroyed') {
                        try {
                            const currentVoiceChannel = await client.channels.fetch(connection.channel.id).catch(() => null);
                            if (currentVoiceChannel && currentVoiceChannel.members.filter(member => !member.user.bot).size === 0) {
                                if (player) player.stop();
                                if (connection) connection.destroy();
                                client.voicePlayers.delete(guildId);
                                client.musicQueues.delete(guildId);
                                client.voiceConnections.delete(guildId);
                                client.logger.info(`${logPrefix} Bot đã rời kênh thoại do không có người dùng.`);
                                if (textChannel) {
                                    textChannel.send(`Không còn ai trong kênh thoại trong ${AUTO_DISCONNECT_DELAY / 1000 / 60} phút, bot đã rời đi và hàng đợi đã bị xóa.`).catch(e => client.logger.error(`${logPrefix} Lỗi gửi tin nhắn: ${e.message}`));
                                }
                            } else {
                                client.logger.info(`${logPrefix} Có người dùng quay lại kênh trước khi auto-disconnect.`);
                            }
                        } catch (err) {
                            client.handleError(err, null, client);
                        }
                    }
                    client.autoDisconnectTimeouts.delete(guildId);
                }, AUTO_DISCONNECT_DELAY);

                client.autoDisconnectTimeouts.set(guildId, timeout);
            } else {
                if (client.autoDisconnectTimeouts.has(guildId)) {
                    clearTimeout(client.autoDisconnectTimeouts.get(guildId));
                    client.autoDisconnectTimeouts.delete(guildId);
                    client.logger.info(`${logPrefix} Phát hiện người dùng đã quay lại kênh. Đã hủy auto-disconnect.`);
                }
            }
        }
    },
};
