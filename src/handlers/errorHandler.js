// src/utils/errorHandler.js
const { EmbedBuilder } = require('discord.js');

/**
 * Xử lý lỗi tập trung.
 * @param {Error} error - Đối tượng lỗi.
 * @param {import('discord.js').Interaction} [interaction=null] - Đối tượng interaction (nếu có).
 * @param {import('discord.js').Client} client - Đối tượng client Discord.
 * @param {boolean} isFatal - Đánh dấu lỗi có phải là lỗi nghiêm trọng (uncaughtException/unhandledRejection) không.
 */
module.exports = async (error, interaction = null, client, isFatal = false) => {
    const errorId = Date.now();
    const logPrefix = `[ERROR ${errorId}]`;

    // Ghi log chi tiết
    client.logger.error(`${logPrefix} Đã xảy ra lỗi: ${error.message}`);
    client.logger.error(`Stack Trace: ${error.stack}`);
    if (interaction) {
        client.logger.error(`Interaction Info: Command=<span class="math-inline">\{interaction\.commandName\}, User\=</span>{interaction.user.tag}, Guild=${interaction.guild?.name || 'DM'}`);
    }

    const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Đã xảy ra lỗi!')
        .setDescription(`Đã có lỗi nội bộ. Vui lòng thử lại sau. Nếu lỗi tiếp tục, hãy báo cáo cho người quản lý bot.\n\`\`\`ID lỗi: ${errorId}\`\`\``)
        .setTimestamp();

    // Thêm thông tin cụ thể cho người dùng cuối
    if (error.name === 'AbortError' && error.message.includes('The user aborted a request.')) {
        errorEmbed.addFields({
            name: '⏳ Hết thời gian chờ',
            value: 'Máy chủ nhạc mất quá nhiều thời gian để phản hồi. Vui lòng thử lại hoặc kiểm tra kết nối.'
        });
    } else if (error.message.includes('getaddrinfo ENOTFOUND') || error.message.includes('fetch failed')) {
        errorEmbed.addFields({
            name: '⚠️ Lỗi kết nối API',
            value: 'Bot không thể kết nối đến máy chủ nhạc (backend Python). Vui lòng kiểm tra trạng thái và cấu hình của service backend trên Railway. Nếu bạn là người dùng cuối, hãy báo cáo cho quản trị viên bot.'
        });
    } else if (error.message.includes('Not in a voice channel')) {
        errorEmbed.setDescription('Bạn phải ở trong một kênh thoại để sử dụng lệnh này!');
    } else if (error.message.includes('not in the same voice channel')) {
        errorEmbed.setDescription('Bạn phải ở trong cùng kênh thoại với bot!');
    } else if (error.message.includes('403 Forbidden') || error.message.includes('Missing Permissions')) {
        errorEmbed.addFields({
            name: '🚨 Thiếu quyền',
            value: 'Bot thiếu quyền cần thiết để thực hiện hành động này. Vui lòng cấp các quyền `Connect`, `Speak`, `Send Messages`, `Read Message History`.'
        });
    }

    // Gửi thông báo cho người dùng qua interaction
    if (interaction) {
        if (!interaction.replied && !interaction.deferred) {
            try {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            } catch (e) {
                client.logger.error(`${logPrefix} Lỗi khi gửi phản hồi lỗi cho interaction: ${e.message}`, e);
            }
        } else {
            try {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } catch (e) {
                client.logger.error(`${logPrefix} Lỗi khi gửi phản hồi lỗi (followUp) cho interaction: ${e.message}`, e);
            }
        }
    }

    // Gửi thông báo đến kênh log admin (cho cả lỗi fatal và non-fatal)
    const ADMIN_LOG_CHANNEL_ID = process.env.ADMIN_LOG_CHANNEL_ID;
    if (ADMIN_LOG_CHANNEL_ID) {
        const adminChannel = await client.channels.fetch(ADMIN_LOG_CHANNEL_ID).catch(() => null);
        if (adminChannel && adminChannel.isTextBased()) {
            const adminEmbed = new EmbedBuilder()
                .setColor(isFatal ? 'DarkRed' : 'Orange') // Màu khác nhau cho lỗi fatal
                .setTitle(isFatal ? `🚨 BOT CRASH (FATAL): ${error.message.substring(0, 100)}` : `⚠️ Lỗi: ${error.message.substring(0, 100)}`)
                .setDescription(`\`\`\`ID lỗi: ${errorId}\n${error.stack ? error.stack.substring(0, 1500) + '...' : 'Không có stack trace'}\`\`\``)
                .setTimestamp();
            if (interaction) {
                adminEmbed.addFields(
                    { name: 'Người dùng', value: interaction.user.tag, inline: true },
                    { name: 'Lệnh', value: interaction.commandName || 'Không rõ', inline: true },
                    { name: 'Guild', value: interaction.guild?.name || 'DM', inline: true }
                );
            }
            adminChannel.send({ embeds: [adminEmbed] }).catch(e => client.logger.error(`${logPrefix} Lỗi gửi log lỗi cho admin: ${e.message}`));
        }
    }

    // Xử lý riêng cho lỗi Fatal (nếu bot có thể tự khởi động lại qua Railway thì không cần process.exit(1))
    if (isFatal) {
        client.logger.critical(`${logPrefix} Phát hiện lỗi Fatal. Đang tắt process.`);
        // Trong môi trường như Railway, Docker, Kubernetes,
        // process.exit(1) sẽ khiến container/pod bị dừng và sau đó tự động khởi động lại.
        // Điều này là hành vi mong muốn cho việc "tự phục hồi".
        // Nếu bạn không muốn bot tự khởi động lại, hãy bỏ dòng này.
        process.exit(1);
    }
};
