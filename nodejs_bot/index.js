const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer } = require('@discordjs/voice');
const config = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).filter(f => f.endsWith('.js')).forEach(file => {
  const cmd = require(path.join(commandsPath, file));
  client.commands.set(cmd.data.name, cmd);
});

// Events
fs.readdirSync(path.join(__dirname, 'events')).filter(f => f.endsWith('.js')).forEach(file => {
  const event = require(path.join(__dirname, 'events', file));
  if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
  else client.on(event.name, (...args) => event.execute(...args, client));
});

client.login(process.env.TOKEN || config.token);
