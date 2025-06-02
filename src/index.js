const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const { TOKEN, SPOTIFY_ID, SPOTIFY_SECRET } = require("./config/config");
const fs = require("fs");
const path = require("path");
const { DisTube } = require("distube");
const { SpotifyPlugin } = require("@distube/spotify");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { info, error } = require("./utils/logger");

// Tạo client Discord với intents cần thiết
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages
  ],
  partials: [Partials.Channel]
});

// Map để lưu slash commands
client.commands = new Collection();

// Đệ quy load command
const commandsPath = path.join(__dirname, "commands");
function loadCommands(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommands(fullPath);
    } else if (entry.name.endsWith(".js")) {
      const command = require(fullPath);
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
      }
    }
  }
}
loadCommands(commandsPath);

// Khởi tạo DisTube với plugin Spotify & SoundCloud
client.distube = new DisTube(client, {
  leaveOnEmpty: true,
  leaveOnFinish: false,
  leaveOnStop: false,
  plugins: [
    new SpotifyPlugin({
      clientID: SPOTIFY_ID,
      clientSecret: SPOTIFY_SECRET
    }),
    new SoundCloudPlugin()
  ]
});

// Load events
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));
for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Đăng nhập bot
client.login(TOKEN).catch(err => {
  error("Đăng nhập thất bại:", err);
});
