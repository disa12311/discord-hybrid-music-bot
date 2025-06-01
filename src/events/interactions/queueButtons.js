// src/events/interactions/queueButtons.js
const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction, client) {
        if (!interaction.isButton()) return; // Chỉ xử lý button interactions

        if (interaction.customId === 'prev_queue' || interaction.customId === 'next_queue') {
            // Logic cho queue buttons đã được xử lý trong commands/music/queue.js
            // Collector trong queue.js sẽ lắng nghe và xử lý các sự kiện này
            // Không cần logic xử lý riêng ở đây, chỉ cần đảm bảo rằng collector đã được tạo.
            // Mục đích của file này là để cấu trúc dự án tốt hơn nếu có nhiều loại button khác.
            // Trong trường hợp này, nó có thể để trống hoặc chỉ log.
            client.logger.debug(`[QueueButtonsEvent] Nút queue đã được nhấn: ${interaction.customId}`);
            // Quan trọng: Không cần deferUpdate/reply ở đây nếu collector trong lệnh đã làm rồi.
            // Nếu bạn muốn xử lý logic riêng biệt, bạn có thể gọi updateMessage ở đây,
            // nhưng cần truyền message và currentPage từ nơi khác hoặc lưu chúng.
            // Cách hiện tại (collector trong lệnh) là tốt nhất cho pagination đơn giản.
        }
    },
};
