// src/handlers/commandHandler.js
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

module.exports = (client, commandsPath) => {
    const commands = [];
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON());
                client.logger.debug(`Đã tải lệnh: ${command.data.name} từ ${filePath}`);
            } else {
                client.logger.warn(`Lệnh tại ${filePath} thiếu thuộc tính "data" hoặc "execute" bắt buộc.`);
            }
        }
    }

    // Đăng ký lệnh với Discord API
    client.once('ready', async () => {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        try {
            client.logger.info(`Đang làm mới ${commands.length} (/) lệnh ứng dụng.`);
            const data = await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                { body: commands },
            );
            client.logger.info(`Đã tải lại thành công ${data.length} (/) lệnh ứng dụng.`);
        } catch (error) {
            client.logger.error(`Lỗi khi đăng ký lệnh ứng dụng: ${error.message}`, error);
        }
    });

    // Lắng nghe tương tác lệnh
    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            client.logger.error(`Không tìm thấy lệnh ${interaction.commandName}.`);
            return;
        }

        try {
            await command.execute(interaction, client);
        } catch (error) {
            client.handleError(error, interaction, client);
        }
    });
};
