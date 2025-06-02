// src/events/interactionCreate.js
const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Xử lý Autocomplete
        if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`Không tìm thấy lệnh ${interaction.commandName} cho autocomplete.`);
                return;
            }

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(`Lỗi khi xử lý autocomplete cho ${interaction.commandName}:`, error);
            }
            return; // Đảm bảo thoát sau khi xử lý autocomplete
        }

        // Xử lý Slash Commands
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`Không tìm thấy lệnh ${interaction.commandName}.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Lỗi khi thực thi lệnh ${interaction.commandName}:`, error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: 'Đã xảy ra lỗi khi thực thi lệnh này!', ephemeral: true }).catch(err => console.error("Lỗi khi editReply:", err));
            } else {
                await interaction.reply({ content: 'Đã xảy ra lỗi khi thực thi lệnh này!', ephemeral: true }).catch(err => console.error("Lỗi khi reply:", err));
            }
            // Gửi lỗi đến kênh admin qua error handler nếu cần
            const adminLogChannelId = process.env.ADMIN_LOG_CHANNEL_ID;
            if (adminLogChannelId) {
                const adminChannel = await interaction.client.channels.fetch(adminLogChannelId).catch(() => null);
                if (adminChannel) {
                    adminChannel.send(`\`\`\`ansi\n[2;31m[COMMAND ERROR][0m\n[0;31mLệnh: /${interaction.commandName}\nNgười dùng: ${interaction.user.tag} (${interaction.user.id})\nServer: ${interaction.guild?.name} (${interaction.guild?.id})\nLỗi: ${error.message}\nStack: ${error.stack}\n\`\`\``).catch(console.error);
                }
            }
        }
    },
};
