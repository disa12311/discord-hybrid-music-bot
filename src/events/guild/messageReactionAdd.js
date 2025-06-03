// events/guild/messageReactionAdd.js
export default {
    name: 'messageReactionAdd',
    async execute(client, reaction, user) {
        // Nếu reaction không đầy đủ thông tin hoặc là bot tự reaction, bỏ qua
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message:', error);
                return;
            }
        }
        if (user.bot) return; // Bỏ qua nếu bot là người reaction

        // Kiểm tra xem đây có phải là tin nhắn reaction role đã lưu không
        const roleMap = client.reactionRoles?.get(reaction.message.id);
        if (!roleMap) return; // Không phải tin nhắn reaction role của bot

        // Lấy role ID tương ứng với emoji
        const roleId = roleMap.get(reaction.emoji.name) || roleMap.get(reaction.emoji.id); // Check for unicode emoji name or custom emoji ID

        if (!roleId) return; // Emoji không được cấu hình cho reaction role này

        const guild = reaction.message.guild;
        const member = await guild.members.fetch(user.id);
        const role = guild.roles.cache.get(roleId);

        if (!role) {
            console.warn(`[ReactionRole] Role ID ${roleId} not found in guild ${guild.name}.`);
            return;
        }

        try {
            await member.roles.add(role);
            console.log(`[ReactionRole] Added role ${role.name} to ${member.user.tag}`);
        } catch (error) {
            console.error(`[ReactionRole] Failed to add role ${role.name} to ${member.user.tag}:`, error);
        }
    },
};
