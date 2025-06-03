// src/handlers/eventHandler.js
import { readdirSync } from 'fs';

/**
 * Loads events from the 'events' directory.
 * @param {import('discord.js').Client} client The Discord client.
 */
export async function loadEvents(client) {
    const eventFolders = readdirSync('./events');

    for (const folder of eventFolders) {
        const eventFiles = readdirSync(`./events/${folder}`).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const { default: event } = await import(`../../events/${folder}/${file}`);
            if (event.once) {
                client.once(event.name, (...args) => event.execute(client, ...args));
            } else {
                client.on(event.name, (...args) => event.execute(client, ...args));
            }
        }
    }
    console.log(`Loaded ${client.eventNames().length} events.`);
}
