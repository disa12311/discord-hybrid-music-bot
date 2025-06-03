// src/handlers/commandHandler.js
import { readdirSync } from 'fs';
import { Collection } from 'discord.js';

export async function loadCommands(client) {
    client.commands = new Collection();
    client.slashCommands = [];

    const commandFolders = readdirSync('./commands');

    for (const folder of commandFolders) {
        const commandFiles = readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const { default: command } = await import(`../../commands/${folder}/${file}`);

            if (command.data) { // Slash Command
                client.slashCommands.push(command.data.toJSON());
                client.commands.set(command.data.name, command);
            } else if (command.name) { // Prefix Command
                client.commands.set(command.name, command);
            } else {
                console.warn(`[WARNING] Command at ${folder}/${file} is missing 'data' or 'name' property.`);
            }
        }
    }

    console.log(`Loaded ${client.commands.size} commands.`);
    return client.commands;
}
