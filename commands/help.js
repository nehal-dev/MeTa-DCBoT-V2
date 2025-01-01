const config = require('../config.json');

module.exports = {
    config: {
        name: "help",
        aliases: ["h", "menu"],
        version: "1.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        category: "general",
        guide: {
            en: `${config.prefix}help [command name]`
        }
    },
    heyMetaStart: async function({ ctx, args }) {
        if (!args[0]) {
            const categories = new Map();

            // Group commands by category
            [...global.Meta.commands.values()].forEach(cmd => {
                if (!categories.has(cmd.config.category)) {
                    categories.set(cmd.config.category, []);
                }
                if (!categories.get(cmd.config.category).includes(cmd.config.name)) {
                    categories.get(cmd.config.category).push(cmd.config.name);
                }
            });

            let helpMessage = `『 MeTa-AI Command List 』\n\n`;

            for (const [category, commands] of categories) {
                helpMessage += `『 ${category.toUpperCase()} 』\n`;
                commands.forEach(cmd => {
                    helpMessage += `❏ ${config.prefix}${cmd}\n`;
                });
                helpMessage += '\n';
            }

            helpMessage += `\n📝 Total Commands: ${[...new Set([...global.Meta.commands.values()].map(cmd => cmd.config.name))].length}`;
            helpMessage += `\n\nType ${config.prefix}help <command> for more details about a command.`;

            return ctx.reply(helpMessage);
        }

        const commandName = args[0].toLowerCase();
        const command = global.Meta.commands.get(commandName);

        if (!command) {
            return ctx.reply(`❌ Command "${commandName}" not found.`);
        }

        const helpText = `『 Command: ${command.config.name} 』\n\n` +
            `Description: ${command.config.guide.en}\n` +
            `Category: ${command.config.category}\n` +
            `Aliases: ${command.config.aliases ? command.config.aliases.join(', ') : 'None'}\n` +
            `Cooldown: ${command.config.countDown}s\n` +
            `Author: ${command.config.author}\n` +
            `Version: ${command.config.version}\n` +
            `Role Required: ${command.config.role === 2 ? 'Owner Only' : command.config.role === 1 ? 'Admin' : 'All Users'}`;

        return ctx.reply(helpText);
    }
};