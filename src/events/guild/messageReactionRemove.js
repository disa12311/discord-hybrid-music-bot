// events/guild/messageReactionRemove.js
export default {
    name: 'messageReactionRemove',
    async execute(client, reaction, user) {
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message:', error);
                return;
            }
        }
        if (user.bot) return;

        const roleMap = client.reactionRoles?.get(reaction.message.id);
        if (!roleMap) return;

        const roleId = roleMap.get(reaction.emoji.name) || roleMap.get(reaction.emoji.id);

        if (!roleId) return;

        const guild = reaction.message.guild;
        const member = await guild.members.fetch(user.id);
        const role = guild.roles.cache.get(roleId);

        if (!role) {
            console.warn(`[ReactionRole] Role ID ${roleId} not found in guild ${guild.name}.`);
            return;
        }

        try {
            await member.roles.remove(role);
            console.log(`[ReactionRole] Removed role ${role.name} from ${member.user.tag}`);
        } catch (error) {
            console.error(`[ReactionRole] Failed to remove role ${role.name} from ${member.user.tag}:`, error);
        }
    },
};
