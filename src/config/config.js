require("dotenv").config();

module.exports = {
  TOKEN: process.env.DISCORD_TOKEN,
  CLIENT_ID: process.env.CLIENT_ID,
  GUILD_ID: process.env.GUILD_ID,
  SPOTIFY_ID: process.env.SPOTIFY_CLIENT_ID || "",
  SPOTIFY_SECRET: process.env.SPOTIFY_CLIENT_SECRET || "",
  PORT: process.env.PORT || "3000"
};
