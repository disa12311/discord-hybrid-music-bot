const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const config = require('./config.json');

const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildMessages
] });

client.commands = new Collection();
const queue = new Map();

// Slash command setup simplified
client.on('ready', () => {
  console.log(`✅ Bot ready as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const serverQueue = queue.get(interaction.guild.id);

  if (interaction.commandName === 'play') {
    const url = interaction.options.getString('url');
    if (!url || !ytdl.validateURL(url)) {
      return interaction.reply('❌ URL không hợp lệ.');
    }

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) return interaction.reply('❌ Bạn phải ở trong voice channel.');

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator
    });

    const stream = ytdl(url, { filter: 'audioonly' });
    const resource = createAudioResource(stream);
    const player = createAudioPlayer();
    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
    });

    interaction.reply(`🎶 Đang phát: ${url}`);
  }
});

client.login(config.token);
