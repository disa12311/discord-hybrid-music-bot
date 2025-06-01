// src/events/interactions/queueButtons.js
const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction, client) {
        if (!interaction.isButton()) return;

        // Logic cho button interactions của queue được xử lý bởi collector trong lệnh /queue.js
        // File này chỉ đóng vai trò là một điểm entry cho handler sự kiện nếu cần
        // Hoặc để log việc nhấn nút, đảm bảo collector đang hoạt động.
        if (interaction.customId === 'prev_queue' || interaction.customId === 'next_queue') {
             client.logger.debug(`[QueueButtonsEvent] Nút queue đã được nhấn: ${interaction.customId} bởi ${interaction.user.tag}`);
             // Không cần deferUpdate/reply ở đây vì collector trong queue.js đã xử lý.
        }
    },
};
