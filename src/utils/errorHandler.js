// src/utils/errorHandler.js
const { EmbedBuilder } = require('discord.js');

/**
 * Xử lý lỗi tập trung.
 * @param {Error} error - Đối tượng lỗi.
 * @param {import('discord.js').Interaction} [interaction=null] - Đối tượng interaction (nếu có).
 * @param {import('discord.js').Client} client - Đối tượng client Discord.
 */
module.exports = async (error, interaction = null, client) => {
    const errorId = Date.now();
    client.logger.error(`[ERROR ${errorId}] Đã xảy ra lỗi: ${error.message}\nStack: ${error.stack}`, error);

    const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Đã xảy ra lỗi!')
        .setDescription(`Vui lòng thử lại sau. Nếu lỗi tiếp tục, hãy báo cáo cho người quản lý bot.\n\`\`\`ID lỗi: ${errorId}\`\`\``)
        .setTimestamp();

    if (error.message.includes('getaddrinfo ENOTFOUND') || error.message.includes('fetch failed')) {
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


    if (interaction && !interaction.replied && !interaction.deferred) {
        try {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        } catch (e) {
            client.logger.error(`Lỗi khi gửi phản hồi lỗi cho interaction: ${e.message}`, e);
        }
    } else if (interaction && (interaction.replied || interaction.deferred)) {
        try {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } catch (e) {
            client.logger.error(`Lỗi khi gửi phản hồi lỗi (followUp) cho interaction: ${e.message}`, e);
        }
    } else {
        client.logger.error(`Lỗi không thể xử lý qua interaction: ${error.message}`);
    }
};
