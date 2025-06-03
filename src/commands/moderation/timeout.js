// commands/moderation/timeout.js
import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Tắt tiếng tạm thời một thành viên.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Thành viên muốn tắt tiếng.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Thời gian tắt tiếng (phút).')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(28 * 24 * 60)) // Tối đa 28 ngày (phút)
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Lý do tắt tiếng.')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),
    async execute(interaction, client) {
        const target = interaction.options.getUser('target');
        const duration = interaction.options.getInteger('duration'); // in minutes
        const reason = interaction.options.getString('reason') || 'Không có lý do.';
        const member = interaction.guild.members.cache.get(target.id);

        const durationMs = duration * 60 * 1000; // Convert minutes to milliseconds

        // Kiểm tra quyền
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: 'Bạn không có quyền tắt tiếng thành viên!', ephemeral: true });
        }
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: 'Tôi không có quyền tắt tiếng thành viên!', ephemeral: true });
        }
        if (member && !member.moderatable) { // `moderatable` kiểm tra xem bot có thể timeout người này không
            return interaction.reply({ content: `Không thể tắt tiếng ${target.tag} vì họ có vai trò cao hơn hoặc ngang bằng tôi.`, ephemeral: true });
        }
        if (member && interaction.member.roles.highest.position <= member.roles.highest.position) {
            return interaction.reply({ content: `Bạn không thể tắt tiếng ${target.tag} vì họ có vai trò cao hơn hoặc ngang bằng bạn.`, ephemeral: true });
        }


        try {
            if (member) {
                await member.timeout(durationMs, reason);
                await interaction.reply({ content: `Đã tắt tiếng **${target.tag}** trong **${duration} phút** với lý do: \`${reason}\`.`, ephemeral: false });
            } else {
                await interaction.reply({ content: `Không tìm thấy thành viên ${target.tag} trong máy chủ.`, ephemeral: true });
            }
        } catch (error) {
            console.error(`Error timing out user ${target.tag}:`, error);
            await interaction.reply({ content: `Đã xảy ra lỗi khi tắt tiếng ${target.tag}.`, ephemeral: true });
        }
    },
};
