const { SlashCommandBuilder } = require('discord.js');
const ytdl = require('ytdl-core');
const { joinVoiceChannel, createAudioResource, createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const queueManager = require('../utils/queueManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube')
    .addStringOption(opt => opt.setName('url').setDescription('YouTube URL').setRequired(true)),
  async execute(interaction) {
    const url = interaction.options.getString('url');
    if (!ytdl.validateURL(url)) return interaction.reply('URL không hợp lệ!');

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) return interaction.reply('Bạn cần trong voice channel');

    const queue = queueManager.get(interaction.guildId);
    queue.add(url);
    if (!queue.playing) {
      await interaction.reply(`Đang play: ${url}`);
      playNext(interaction, queue);
    } else {
      interaction.reply(`Đã thêm vào queue: ${url}`);
    }
  }
};

function playNext(interaction, queue) {
  const url = queue.next();
  const connection = joinVoiceChannel({ channelId: interaction.member.voice.channelId, guildId: interaction.guildId, adapterCreator: interaction.guild.voiceAdapterCreator });
  const stream = ytdl(url, { filter: 'audioonly' });
  const player = createAudioPlayer();
  const resource = createAudioResource(stream);
  player.play(resource);
  connection.subscribe(player);
  queue.playing = true;
  player.on(AudioPlayerStatus.Idle, () => {
    if (queue.hasNext()) playNext(interaction, queue);
    else { queue.playing = false; connection.destroy(); }
  });
}
