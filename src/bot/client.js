// src/bot/client.js
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const logger = require('../utils/logger');
const handleError = require('../utils/errorHandler');
const helpers = require('../utils/helpers');

module.exports = () => {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent
        ]
    });

    client.commands = new Collection();
    client.voicePlayers = new Collection();     // Map: guildId -> AudioPlayer
    client.musicQueues = new Collection();      // Map: guildId -> Array of songs (object { song_info, textChannelId, requester, _loopMode })
    client.voiceConnections = new Collection(); // Map: guildId -> VoiceConnection
    client.autoDisconnectTimeouts = new Collection(); // NEW: Map: guildId -> Timeout object

    // Gắn các utility functions vào client để truy cập dễ dàng
    client.logger = logger;
    client.handleError = handleError;
    client.helpers = helpers;

    return client;
};
