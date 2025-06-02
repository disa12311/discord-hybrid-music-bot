const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Bỏ bài hiện tại"),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) {
      return interaction.reply({ content: "❌ Hiện không có bài nào trong queue.", ephemeral: true });
    }
    queue.skip();
    interaction.reply("⏭ Bỏ qua bài hiện tại.");
  }
};
