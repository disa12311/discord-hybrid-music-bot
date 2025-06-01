// src/utils/embeds.js
const { EmbedBuilder } = require('discord.js');

/**
 * Định dạng thời lượng từ giây sang HH:MM:SS.
 * @param {number} seconds - Thời lượng tính bằng giây.
 * @returns {string} Thời lượng đã định dạng.
 */
function formatDuration(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (hours > 0) {
        parts.push(String(hours).padStart(2, '0'));
    }
    parts.push(String(minutes).padStart(2, '0'));
    parts.push(String(remainingSeconds).padStart(2, '0'));

    return parts.join(':');
}

/**
 * Tạo embed thông báo bài hát đang phát.
 * @param {object} song - Đối tượng bài hát (title, url, duration, thumbnail).
 * @param {import('discord.js').User} requester - Người yêu cầu bài hát.
 * @returns {EmbedBuilder}
 */
function createPlayingEmbed(song, requester) {
    return new EmbedBuilder()
        .setColor('Green')
        .setTitle(`🎶 Đang phát: ${song.title}`)
        .setURL(song.url)
        .setDescription(`Yêu cầu bởi: ${requester.tag}`)
        .addFields(
            { name: 'Thời lượng', value: formatDuration(song.duration), inline: true }
        )
        .setThumbnail(song.thumbnail)
        .setFooter({ text: `Kênh phát nhạc của bạn` })
        .setTimestamp();
}

/**
 * Tạo embed thông báo bài hát đã được thêm vào hàng đợi.
 * @param {object} song - Đối tượng bài hát.
 * @param {import('discord.js').User} requester - Người yêu cầu bài hát.
 * @param {number} queuePosition - Vị trí trong hàng đợi.
 * @returns {EmbedBuilder}
 */
function createAddedToQueueEmbed(song, requester, queuePosition) {
    return new EmbedBuilder()
        .setColor('Blue')
        .setTitle(`✅ Đã thêm vào hàng đợi: ${song.title}`)
        .setURL(song.url)
        .setDescription(`Yêu cầu bởi: ${requester.tag}`)
        .addFields(
            { name: 'Thời lượng', value: formatDuration(song.duration), inline: true },
            { name: 'Vị trí trong hàng đợi', value: `${queuePosition}`, inline: true }
        )
        .setThumbnail(song.thumbnail)
        .setFooter({ text: `Sẽ phát sau ${queuePosition - 1} bài` })
        .setTimestamp();
}

module.exports = {
    formatDuration,
    createPlayingEmbed,
    createAddedToQueueEmbed,
};
