// commands/utility/rolepicker.js
import { SlashCommandBuilder, PermissionsBitField, StringSelectMenuBuilder, ActionRowBuilder, ComponentType } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('rolepicker')
        .setDescription('Tạo một tin nhắn cho phép người dùng chọn vai trò.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Tiêu đề của tin nhắn chọn vai trò.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Mô tả của tin nhắn chọn vai trò.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('roles')
                .setDescription('Liệt kê các vai trò theo định dạng: @Role1, @Role2, @Role3')
                .setRequired(true)),
    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const rolesInput = interaction.options.getString('roles');

        const roleMentions = rolesInput.split(',').map(r => r.trim()); // Tách các mention vai trò

        const selectOptions = [];
        const validRoles = [];

        for (const mention of roleMentions) {
            const roleMatch = mention.match(/<@&(\d+)>/); // Extract role ID from mention
            if (roleMatch) {
                const roleId = roleMatch[1];
                const role = interaction.guild.roles.cache.get(roleId);
                if (role) {
                    selectOptions.push({
                        label: role.name,
                        value: role.id,
                        description: `Chọn vai trò ${role.name}`,
                    });
                    validRoles.push(role.id);
                }
            }
        }

        if (selectOptions.length === 0) {
            return interaction.editReply('Không có vai trò hợp lệ nào được cung cấp. Vui lòng đảm bảo bạn đã đề cập vai trò đúng cách.');
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('role-select-menu')
            .setPlaceholder('Chọn vai trò của bạn...')
            .addOptions(selectOptions)
            .setMinValues(0) // Cho phép không chọn gì
            .setMaxValues(selectOptions.length); // Cho phép chọn tất cả

        const actionRow = new ActionRowBuilder().addComponents(selectMenu);

        const embed = {
            title: title,
            description: description,
            color: client.config.embedColor,
            footer: { text: 'Sử dụng menu bên dưới để chọn/bỏ chọn vai trò.' },
            timestamp: new Date(),
        };

        try {
            await interaction.channel.send({
                embeds: [embed],
                components: [actionRow],
            });
            await interaction.editReply('Đã tạo tin nhắn chọn vai trò thành công!');
        } catch (error) {
            console.error('Error creating role picker message:', error);
            await interaction.editReply('Đã xảy ra lỗi khi tạo tin nhắn chọn vai trò.');
        }
    },
};
