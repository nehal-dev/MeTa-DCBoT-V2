const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    config: {
        name: "cmd",
        aliases: ["command"],
        version: "1.0",
        author: "NZ R",
        countDown: 5,
        role: 2,
        category: "ADMIN",
        guide: {
            en: "cmd loadall - Reload all commands\ncmd load <name> - Load specific command\ncmd del <name> - Delete command\ncmd install <filename.js> <link> - Install command from URL"
        }
    },
    heyMetaStart: async function({ message, args, client }) {
        try {
            const adminUID = "1306646391325589529";

            if (message.author.id !== adminUID) {
                return message.reply("⚠️ Only admin can use this command!");
            }

            if (!args[0]) {
                return message.reply("⚠️ Please specify an action: loadall, load, del, or install");
            }

            const action = args[0].toLowerCase();
            const commandsPath = path.join(__dirname, '..', 'commands');

            switch (action) {
                case 'loadall':
                    try {
                        const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
                        let loadedCount = 0;

                        for (const file of files) {
                            try {
                                const filePath = path.join(commandsPath, file);
                                delete require.cache[require.resolve(filePath)];
                                const commandFile = require(filePath);

                                if (commandFile.config && commandFile.config.name) {
                                    client.commands.set(commandFile.config.name, commandFile);
                                    loadedCount++;
                                }
                            } catch (err) {
                                console.error(`Failed to load ${file}:`, err);
                            }
                        }
                        message.reply(`✅ Successfully reloaded ${loadedCount} commands!`);
                    } catch (err) {
                        message.reply("❌ Error while reloading commands!");
                        console.error(err);
                    }
                    break;

                case 'load':
                    if (!args[1]) return message.reply("⚠️ Please specify a command name!");
                    const commandFile = `${args[1]}.js`;
                    const commandPath = path.join(commandsPath, commandFile);

                    if (!fs.existsSync(commandPath)) {
                        return message.reply(`❌ Command ${args[1]} not found!`);
                    }

                    try {
                        delete require.cache[require.resolve(commandPath)];
                        const command = require(commandPath);

                        if (command.config && command.config.name) {
                            client.commands.set(command.config.name, command);
                            message.reply(`✅ Successfully loaded command: ${args[1]}`);
                        } else {
                            message.reply("❌ Invalid command structure!");
                        }
                    } catch (err) {
                        message.reply(`❌ Error loading command: ${args[1]}`);
                        console.error(err);
                    }
                    break;

                case 'del':
                    if (!args[1]) return message.reply("⚠️ Please specify a command name!");
                    const cmdFile = `${args[1]}.js`;
                    const cmdPath = path.join(commandsPath, cmdFile);

                    if (!fs.existsSync(cmdPath)) {
                        return message.reply(`❌ Command ${args[1]} not found!`);
                    }

                    try {
                        fs.unlinkSync(cmdPath);
                        client.commands.delete(args[1]);
                        message.reply(`✅ Successfully deleted command: ${args[1]}`);
                    } catch (err) {
                        message.reply(`❌ Error deleting command: ${args[1]}`);
                        console.error(err);
                    }
                    break;

                case 'install':
                    if (!args[1] || !args[2]) {
                        return message.reply("⚠️ Please provide filename and URL!\nUsage: cmd install filename.js <url>");
                    }

                    const fileName = args[1].endsWith('.js') ? args[1] : `${args[1]}.js`;
                    const fileUrl = args[2];

                    try {
                        const response = await axios.get(fileUrl);
                        const filePath = path.join(commandsPath, fileName);

                        fs.writeFileSync(filePath, response.data);

                        try {
                            delete require.cache[require.resolve(filePath)];
                            const newCommand = require(filePath);

                            if (newCommand.config && newCommand.config.name) {
                                client.commands.set(newCommand.config.name, newCommand);
                                message.reply(`✅ Successfully installed command: ${fileName}`);
                            } else {
                                fs.unlinkSync(filePath);
                                message.reply("❌ Invalid command structure in the downloaded file!");
                            }
                        } catch (err) {
                            fs.unlinkSync(filePath);
                            message.reply("❌ Error loading the installed command!");
                            console.error(err);
                        }
                    } catch (error) {
                        message.reply("❌ Failed to install command! Invalid URL or file format.");
                        console.error(error);
                    }
                    break;

                default:
                    message.reply("⚠️ Invalid action! Use: loadall, load, del, or install");
            }
        } catch (error) {
            console.error(error);
            message.reply("❌ An error occurred while processing the command!");
        }
    }
};