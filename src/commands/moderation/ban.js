// commands/moderation/ban.js
import { SlashCommandBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Cấm một thành viên khỏi máy chủ.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Thành viên muốn cấm.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers), // Chỉ những người có quyền Ban Members mới thấy lệnh này
    async execute(interaction, client) {
        const target = interaction.options.getUser('target');
        const member = interaction.guild.members.cache.get(target.id);

        // Kiểm tra quyền của người dùng thực hiện lệnh
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: 'Bạn không có quyền cấm thành viên!', ephemeral: true });
        }

        // Kiểm tra quyền của bot
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: 'Tôi không có quyền cấm thành viên!', ephemeral: true });
        }

        // Kiểm tra xem có thể cấm được thành viên mục tiêu không
        if (member && !member.bannable) {
            return interaction.reply({ content: `Không thể cấm ${target.tag} vì họ có vai trò cao hơn hoặc ngang bằng tôi.`, ephemeral: true });
        }
        if (member && interaction.member.roles.highest.position <= member.roles.highest.position) {
            return interaction.reply({ content: `Bạn không thể cấm ${target.tag} vì họ có vai trò cao hơn hoặc ngang bằng bạn.`, ephemeral: true });
        }

        // Tạo Modal để nhập lý do
        const modal = new ModalBuilder()
            .setCustomId(`banModal-${target.id}`) // CustomId độc nhất để xử lý
            .setTitle(`Cấm ${target.tag}`);

        const reasonInput = new TextInputBuilder()
            .setCustomId('banReasonInput')
            .setLabel('Lý do cấm')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(500)
            .setPlaceholder('Ví dụ: Vi phạm quy tắc, spam...');

        const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);

        modal.addComponents(firstActionRow);

        await interaction.showModal(modal); // Hiển thị modal cho người dùng
    },
};
