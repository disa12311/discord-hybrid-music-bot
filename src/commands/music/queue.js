const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Xem hàng đợi nhạc")
    .addIntegerOption(option =>
      option.setName("page")
        .setDescription("Số trang (mỗi trang 10 bài)")
        .setRequired(false)
    ),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: "❌ Hàng đợi trống.", ephemeral: true });
    }

    const page = interaction.options.getInteger("page") || 1;
    const perPage = 10;
    const totalPages = Math.ceil(queue.songs.length / perPage);
    if (page < 1 || page > totalPages) {
      return interaction.reply({ content: `❌ Trang không hợp lệ. Hiện có ${totalPages} trang.`, ephemeral: true });
    }

    const start = (page - 1) * perPage;
    const songsPage = queue.songs.slice(start, start + perPage);
    const embed = new EmbedBuilder()
      .setTitle(`🎶 Queue (Trang ${page}/${totalPages})`)
      .setColor(0x1DB954)
      .setDescription(
        songsPage.map((song, i) => `\`${start + i + 1}.\` [${song.name}](${song.url}) - \`${song.formattedDuration}\``).join("\n")
      )
      .setFooter({ text: `Tổng cộng ${queue.songs.length} bài` });

    interaction.reply({ embeds: [embed] });
  }
};
