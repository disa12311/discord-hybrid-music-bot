const { SlashCommandBuilder } = require('discord.js');
const ytdl = require('ytdl-core');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const queueManager = require('../utils/queueManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Phát bài hát từ YouTube')
    .addStringOption(opt => opt.setName('url').setDescription('URL').setRequired(true)),

  async execute(interaction) {
    const url = interaction.options.getString('url');
    if (!ytdl.validateURL(url)) return interaction.reply('URL không hợp lệ!');
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) return interaction.reply('Bạn cần vào voice channel!');

    const queue = queueManager.get(interaction.guildId);
    queue.add(url);

    if (!queue.playing) {
      await interaction.reply(`Đang phát: ${url}`);
      playNext(interaction, queue, voiceChannel);
    } else {
      await interaction.reply(`Đã thêm vào hàng đợi: ${url}`);
    }
  }
};

async function playNext(interaction, queue, voiceChannel) {
  const url = queue.next();
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: interaction.guildId,
    adapterCreator: interaction.guild.voiceAdapterCreator
  });
  const stream = ytdl(url, { filter: 'audioonly' });
  const resource = createAudioResource(stream);
  const player = createAudioPlayer();
  connection.subscribe(player);
  player.play(resource);
  queue.playing = true;
  player.on(AudioPlayerStatus.Idle, () => {
    if (queue.hasNext()) playNext(interaction, queue, voiceChannel);
    else {
      queue.playing = false;
      connection.destroy();
    }
  });
}
