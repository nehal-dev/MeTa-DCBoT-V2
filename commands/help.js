const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    config: {
        name: "help",
        aliases: ["h"],
        version: "1.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        shortDescription: {
            en: "Get help with bot commands"
        },
        longDescription: {
            en: "View all commands or get details about a specific command"
        },
        category: "utility",
        guide: {
            en: "-help\n-help <command_name>"
        }
    },
    heyMetaStart: async function({ client, message, args }) {
        try {
            client.commands.clear();
            const commandsPath = path.join(__dirname, "../commands");
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const command = require(path.join(commandsPath, file));
                if (command.config && command.heyMetaStart) {
                    client.commands.set(command.config.name, command);
                }
            }

            if (!args[0]) {
                const categories = new Map();

                client.commands.forEach(cmd => {
                    const category = cmd.config?.category || "Uncategorized";
                    if (!categories.has(category)) {
                        categories.set(category, []);
                    }
                    categories.get(category).push(cmd.config?.name || "Unknown");
                });

                const helpEmbed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('📚 Command List')
                    .setDescription('Use `-help <command>` for detailed information');

                categories.forEach((commands, category) => {
                    if (commands.length > 0) {
                        helpEmbed.addFields({
                            name: `${category}`,
                            value: commands.map(cmd => `\`${cmd}\``).join(', ')
                        });
                    }
                });

                return message.reply({ embeds: [helpEmbed] });
            } else {
                const commandName = args[0].toLowerCase();
                const command = client.commands.get(commandName);

                if (!command) {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#ff6b6b')
                                .setDescription(`❌ Command \`${commandName}\` not found!`)
                        ]
                    });
                }

                const cmdEmbed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle(`Command: ${command.config.name}`)
                    .addFields(
                        {
                            name: '📝 Description',
                            value: command.config.longDescription?.en || command.config.shortDescription?.en || 'No description available'
                        },
                        {
                            name: '📖 Usage',
                            value: command.config.guide?.en || 'No usage guide available'
                        }
                    );

                if (command.config.aliases && command.config.aliases.length > 0) {
                    cmdEmbed.addFields({
                        name: '🔄 Aliases',
                        value: command.config.aliases.map(alias => `\`${alias}\``).join(', ')
                    });
                }

                if (command.config.category) {
                    cmdEmbed.addFields({
                        name: '📁 Category',
                        value: command.config.category
                    });
                }

                return message.reply({ embeds: [cmdEmbed] });
            }
        } catch (error) {
            console.error('Help Command Error:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff6b6b')
                        .setDescription('❌ An error occurred while displaying help information.')
                ]
            });
        }
    }
};