// src/handlers/commandHandler.js
import { readdirSync } from 'fs';
import { Collection } from 'discord.js';

/**
 * Loads commands from the 'commands' directory.
 * @param {import('discord.js').Client} client The Discord client.
 */
export async function loadCommands(client) {
    client.commands = new Collection();
    client.slashCommands = []; // Mảng để lưu trữ dữ liệu slash commands để đăng ký

    const commandFolders = readdirSync('./commands');

    for (const folder of commandFolders) {
        const commandFiles = readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const { default: command } = await import(`../../commands/${folder}/${file}`);

            if (command.data) { // Đây là Slash Command
                client.slashCommands.push(command.data.toJSON());
                client.commands.set(command.data.name, command);
            } else if (command.name) { // Đây là Prefix Command
                client.commands.set(command.name, command);
            } else {
                console.warn(`[WARNING] Command at ${folder}/${file} is missing 'data' or 'name' property.`);
            }
        }
    }

    console.log(`Loaded ${client.commands.size} commands.`);
    return client.commands;
}
