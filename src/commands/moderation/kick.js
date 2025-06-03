// commands/moderation/kick.js
import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Đuổi một thành viên khỏi máy chủ.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Thành viên muốn đuổi.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Lý do đuổi thành viên.')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers),
    async execute(interaction, client) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'Không có lý do.';
        const member = interaction.guild.members.cache.get(target.id);

        // Kiểm tra quyền
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: 'Bạn không có quyền đuổi thành viên!', ephemeral: true });
        }
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: 'Tôi không có quyền đuổi thành viên!', ephemeral: true });
        }
        if (member && !member.kickable) {
            return interaction.reply({ content: `Không thể đuổi ${target.tag} vì họ có vai trò cao hơn hoặc ngang bằng tôi.`, ephemeral: true });
        }
        if (member && interaction.member.roles.highest.position <= member.roles.highest.position) {
            return interaction.reply({ content: `Bạn không thể đuổi ${target.tag} vì họ có vai trò cao hơn hoặc ngang bằng bạn.`, ephemeral: true });
        }

        try {
            if (member) {
                await member.kick(reason);
                await interaction.reply({ content: `Đã đuổi **${target.tag}** với lý do: \`${reason}\`.`, ephemeral: false });
            } else {
                await interaction.reply({ content: `Không tìm thấy thành viên ${target.tag} trong máy chủ.`, ephemeral: true });
            }
        } catch (error) {
            console.error(`Error kicking user ${target.tag}:`, error);
            await interaction.reply({ content: `Đã xảy ra lỗi khi đuổi ${target.tag}.`, ephemeral: true });
        }
    },
};
