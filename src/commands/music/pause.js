const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Tạm dừng bài đang phát"),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue || !queue.playing) {
      return interaction.reply({ content: "❌ Hiện không có bài nào đang phát.", ephemeral: true });
    }
    queue.pause();
    interaction.reply("⏸ Bài đã được tạm dừng.");
  }
};
