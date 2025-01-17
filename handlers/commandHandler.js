const fs = require('fs');
const path = require('path');

function loadCommands(client) {
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));

        if (command.config && command.config.name) {
            client.commands.set(command.config.name, command);

            if (command.config.aliases) {
                command.config.aliases.forEach(alias => {
                    client.aliases.set(alias, command.config.name);
                });
            }
        }
    }
}

module.exports = { loadCommands };
