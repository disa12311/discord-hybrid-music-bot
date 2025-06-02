const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Tiếp tục phát nhạc"),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue || queue.playing) {
      return interaction.reply({ content: "❌ Hiện không có bài nào đang bị tạm dừng.", ephemeral: true });
    }
    queue.resume();
    interaction.reply("▶️ Đã tiếp tục phát bài.");
  }
};
