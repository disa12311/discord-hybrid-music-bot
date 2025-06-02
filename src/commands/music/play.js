const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Phát nhạc từ YouTube/Spotify/SoundCloud")
    .addStringOption(option =>
      option.setName("query")
        .setDescription("Tên bài hoặc URL")
        .setRequired(true)
    ),
  async execute(interaction, client) {
    const query = interaction.options.getString("query", true);
    const member = interaction.member;

    if (!member.voice.channel) {
      return interaction.reply({ content: "❌ Bạn cần vào voice channel trước khi dùng lệnh này.", ephemeral: true });
    }
    const voiceChannel = member.voice.channel;

    await interaction.reply(`🔎 Đang tìm kiếm: \`${query}\`...`);
    try {
      // DisTube tự join voice channel và play
      await client.distube.play(voiceChannel, query, { textChannel: interaction.channel, member });
    } catch (err) {
      console.error(err);
      interaction.editReply("❌ Không thể tìm hoặc phát bài hát. Vui lòng thử lại sau.");
    }
  }
};
