// commands/utility/reactionrole.js
import { SlashCommandBuilder, PermissionsBitField, ChannelType } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Thiết lập một tin nhắn reaction role.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Kênh để gửi tin nhắn reaction role.')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('ID của tin nhắn reaction role đã có (để chỉnh sửa).')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Nội dung mô tả cho tin nhắn reaction role.')
                .setRequired(false))
        .addStringOption(option => // Example: "✅:@role1 ❌:@role2"
            option.setName('roles')
                .setDescription('Các cặp emoji và role (ví dụ: "✅:@Member 🍎:@AppleUser").')
                .setRequired(true)),
    async execute(interaction, client) {
        // Kiểm tra quyền của người dùng (chỉ Admin)
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Bạn không có quyền sử dụng lệnh này!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const targetChannel = interaction.options.getChannel('channel');
        const messageId = interaction.options.getString('message_id');
        const description = interaction.options.getString('description') || 'Hãy reaction để nhận vai trò!';
        const rolesInput = interaction.options.getString('roles');

        // Parse rolesInput: "✅:@Member 🍎:@AppleUser" -> { "✅": "roleId1", "🍎": "roleId2" }
        const roleMap = new Map();
        const emojiRoles = rolesInput.split(' ').map(pair => pair.split(':')); // [['✅', '@Member'], ['🍎', '@AppleUser']]

        for (const [emoji, roleMention] of emojiRoles) {
            const roleMatch = roleMention.match(/<@&(\d+)>/); // Extract role ID from mention
            if (roleMatch) {
                const roleId = roleMatch[1];
                const role = interaction.guild.roles.cache.get(roleId);
                if (role) {
                    roleMap.set(emoji, role.id);
                } else {
                    return interaction.editReply(`Không tìm thấy vai trò: ${roleMention}. Vui lòng đảm bảo bạn đã đề cập vai trò đúng cách.`);
                }
            } else {
                 return interaction.editReply(`Định dạng vai trò không hợp lệ: ${roleMention}. Vui lòng sử dụng định dạng \`emoji:@RoleName\`.`);
            }
        }

        // Tạo nội dung embed và emojis để reaction
        let embedFields = [];
        let reactionEmojis = [];
        for (const [emoji, roleId] of roleMap.entries()) {
            const role = interaction.guild.roles.cache.get(roleId);
            if (role) {
                embedFields.push({ name: emoji, value: `${role.name}`, inline: true });
                reactionEmojis.push(emoji);
            }
        }

        const embed = {
            title: 'Chọn vai trò của bạn!',
            description: description,
            fields: embedFields,
            color: client.config.embedColor,
            footer: { text: 'Reaction vào emoji để nhận vai trò!' },
            timestamp: new Date(),
        };

        let msg;
        try {
            if (messageId) {
                // Chỉnh sửa tin nhắn đã có
                msg = await targetChannel.messages.fetch(messageId);
                await msg.edit({ embeds: [embed] });
                // Gỡ bỏ tất cả reactions cũ và thêm reactions mới
                await msg.reactions.removeAll();
                for (const emoji of reactionEmojis) {
                    await msg.react(emoji);
                }
                await interaction.editReply(`Đã cập nhật tin nhắn reaction role tại: ${msg.url}`);
            } else {
                // Gửi tin nhắn mới
                msg = await targetChannel.send({ embeds: [embed] });
                for (const emoji of reactionEmojis) {
                    await msg.react(emoji);
                }
                await interaction.editReply(`Đã gửi tin nhắn reaction role mới tại: ${msg.url}`);
            }

            // Lưu thông tin reaction role vào client hoặc database (Quan trọng!)
            // Để đơn giản, chúng ta sẽ lưu tạm vào client. Để bền vững hơn, bạn nên dùng DB.
            if (!client.reactionRoles) {
                client.reactionRoles = new Map();
            }
            client.reactionRoles.set(msg.id, roleMap); // Lưu Map<Emoji, RoleID>
            console.log(`[ReactionRole] Stored reaction role for message ID: ${msg.id}`);

        } catch (error) {
            console.error('Error setting up reaction role:', error);
            await interaction.editReply('Đã xảy ra lỗi khi thiết lập tin nhắn reaction role. Vui lòng kiểm tra quyền và thông tin bạn cung cấp.');
        }
    },
};
