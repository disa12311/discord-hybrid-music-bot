// src/commands/music/stop.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Dừng phát nhạc và xóa toàn bộ hàng đợi.')
        // Chỉ những người có quyền "Kick Members" (hoặc cao hơn) mới có thể dùng lệnh này
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setDMPermission(false), // Không cho phép dùng trong DM
    
    async execute(interaction, client) {
    // Luôn deferReply trước khi kiểm tra quyền nếu bạn muốn trả lời lỗi
    await interaction.deferReply({ ephemeral: true });

    // Đảm bảo lệnh chỉ dùng trong Guild
    if (!interaction.inGuild()) {
        return interaction.followUp({ content: 'Lệnh này chỉ có thể sử dụng trong một máy chủ (server).', ephemeral: true });
    }

    // Kiểm tra quyền hạn của người dùng (lớp bảo vệ thứ hai)
    // Nếu bạn đã dùng setDefaultMemberPermissions, dòng này có thể dư thừa nhưng an toàn.
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return interaction.followUp({ content: 'Bạn không có đủ quyền để sử dụng lệnh này! (Yêu cầu quyền Kick Members).', ephemeral: true });
    }
            await interaction.followUp('⏹️ Đã dừng phát nhạc và xóa hàng đợi.');
        } catch (error) {
            client.handleError(error, interaction, client);
        }
    },
};
