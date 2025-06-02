const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const { TOKEN, SPOTIFY_ID, SPOTIFY_SECRET } = require("./config/config");
const fs = require("fs");
const path = require("path");
const { DisTube } = require("distube");
const { SpotifyPlugin } = require("@distube/spotify");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { info } = require("./utils/logger");
const errorHandler = require("./utils/errorHandler");

// Tạo client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages
  ],
  partials: [Partials.Channel]
});

// Load commands (giữ nguyên cách bạn làm)
client.commands = new Collection();
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

// Khởi tạo DisTube
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

// Load các event khác (ready, interactionCreate, v.v.)
const eventsPath = path.join(__dirname, "events");
fs.readdirSync(eventsPath)
  .filter(file => file.endsWith(".js"))
  .forEach(file => {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  });

// Gắn error handler từ file hiện có
client.on("error", errorHandler);
client.on("warn", info); // nếu muốn ghi warn ra console

// Đăng nhập
client.login(TOKEN).catch(errorHandler);
