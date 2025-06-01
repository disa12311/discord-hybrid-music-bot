// src/handlers/eventHandler.js
const fs = require('fs');
const path = require('path');

module.exports = (client, eventsPath) => {
    const categories = fs.readdirSync(eventsPath);

    for (const category of categories) {
        const categoryPath = path.join(eventsPath, category);
        const eventFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const filePath = path.join(categoryPath, file);
            const event = require(filePath);

            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
            client.logger.debug(`Đã tải event: ${event.name} từ ${filePath}`);
        }
    }
};
