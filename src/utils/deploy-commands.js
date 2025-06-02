const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const fs = require("fs");
const path = require("path");
const { CLIENT_ID, GUILD_ID, TOKEN } = require("../config/config");

(async () => {
  try {
    const commands = [];
    const commandsPath = path.join(__dirname, "..", "commands");

    // Đệ quy load tất cả file .js trong folder commands
    function loadCommands(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          loadCommands(fullPath);
        } else if (entry.name.endsWith(".js")) {
          const command = require(fullPath);
          if (command.data && command.execute) {
            commands.push(command.data.toJSON());
          }
        }
      }
    }
    loadCommands(commandsPath);

    const rest = new REST({ version: "10" }).setToken(TOKEN);
    console.log(`Đang deploy ${commands.length} slash commands lên guild ${GUILD_ID}...`);
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("✅ Deploy commands thành công!");
  } catch (err) {
    console.error(err);
  }
})();
