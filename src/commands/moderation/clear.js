// commands/moderation/clear.js
import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Xóa một số lượng tin nhắn nhất định trong kênh.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Số lượng tin nhắn muốn xóa (tối đa 100).')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
    async execute(interaction, client) {
        const amount = interaction.options.getInteger('amount');

        // Kiểm tra quyền
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: 'Bạn không có quyền quản lý tin nhắn!', ephemeral: true });
        }
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: 'Tôi không có quyền quản lý tin nhắn!', ephemeral: true });
        }

        try {
            // Fetch tin nhắn (cộng thêm 1 để xóa cả lệnh của bot)
            const fetched = await interaction.channel.messages.fetch({ limit: amount + 1 });
            const filtered = fetched.filter(msg => !msg.pinned); // Không xóa tin nhắn đã ghim

            if (filtered.size === 0) {
                return interaction.reply({ content: 'Không có tin nhắn nào để xóa trong phạm vi này.', ephemeral: true });
            }

            // Xóa tin nhắn
            await interaction.channel.bulkDelete(filtered, true); // true để bỏ qua tin nhắn cũ hơn 14 ngày

            await interaction.reply({ content: `Đã xóa thành công ${filtered.size} tin nhắn.`, ephemeral: true });
            // Tự động xóa tin nhắn phản hồi sau 5 giây
            setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);

        } catch (error) {
            console.error(`Error clearing messages:`, error);
            await interaction.reply({ content: 'Đã xảy ra lỗi khi xóa tin nhắn. Vui lòng kiểm tra quyền hoặc đảm bảo tin nhắn không quá 14 ngày tuổi.', ephemeral: true });
        }
    },
};
