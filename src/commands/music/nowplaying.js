const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Xem bài đang phát"),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: "❌ Hiện không có bài nào đang phát.", ephemeral: true });
    }

    const current = queue.songs[0];
    const embed = new EmbedBuilder()
      .setTitle("🎵 Now Playing")
      .setDescription(`[${current.name}](${current.url})`)
      .addFields(
        { name: "Thời lượng", value: current.formattedDuration, inline: true },
        { name: "Yêu cầu bởi", value: `${current.user}`, inline: true }
      )
      .setThumbnail(current.thumbnail)
      .setColor(0x1DB954);

    interaction.reply({ embeds: [embed] });
  }
};
