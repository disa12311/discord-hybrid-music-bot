const { info, error } = require("../utils/logger");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (err) {
      error(`Lỗi khi chạy lệnh ${interaction.commandName}:`, err);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: "❌ Đã có lỗi xảy ra khi thực thi lệnh.", ephemeral: true });
      } else {
        await interaction.reply({ content: "❌ Đã có lỗi xảy ra khi thực thi lệnh.", ephemeral: true });
      }
    }
  }
};
