const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    config: {
        name: "cmd",
        aliases: ["command"],
        version: "3.2",
        author: "NZ R",
        countDown: 5,
        role: 2,
        category: "ADMIN",
        guide: {
            en: "cmd loadall - Reload all commands\ncmd load <name> - Load specific command\ncmd del <name> - Delete command\ncmd install <filename.js> <Pastebin/Gist URL> - Install command from URL"
        }
    },
    heyMetaStart: async function({ message, args, client }) {
        const adminUID = "1306646391325589529";
        if (message.author.id !== adminUID) return message.reply("⚠️ Only admin can use this command!");

        if (!args[0]) return message.reply("⚠️ Please specify an action: loadall, load, del, or install");
        const action = args[0].toLowerCase();
        const commandsPath = path.join(__dirname, '..', 'commands');

        const isValidUrl = (url) => {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        };

        const getRawUrl = (url) => {
            if (url.includes('pastebin.com') && !url.includes('/raw/')) {
                const pasteKey = url.split('/').pop();
                return `https://pastebin.com/raw/${pasteKey}`;
            }
            if (url.includes('gist.github.com') && !url.includes('/raw')) {
                const parts = url.split('/');
                const user = parts[3];
                const gistId = parts[4];
                return `https://gist.githubusercontent.com/${user}/${gistId}/raw`;
            }
            return url;
        };

        switch (action) {
            case 'loadall':
                const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
                let loadedCount = 0;
                files.forEach(file => {
                    const filePath = path.join(commandsPath, file);
                    delete require.cache[require.resolve(filePath)];
                    const commandFile = require(filePath);
                    if (commandFile.config && commandFile.config.name) {
                        client.commands.set(commandFile.config.name, commandFile);
                        loadedCount++;
                    }
                });
                message.reply(`✅ Reloaded ${loadedCount} commands!`);
                break;

            case 'load':
                if (!args[1]) return message.reply("⚠️ Specify a command name!");
                const commandPath = path.join(commandsPath, `${args[1]}.js`);
                if (!fs.existsSync(commandPath)) return message.reply(`❌ Command ${args[1]} not found!`);
                delete require.cache[require.resolve(commandPath)];
                const command = require(commandPath);
                if (command.config && command.config.name) {
                    client.commands.set(command.config.name, command);
                    message.reply(`✅ Loaded command: ${args[1]}`);
                } else {
                    message.reply("❌ Invalid command structure!");
                }
                break;

            case 'del':
                if (!args[1]) return message.reply("⚠️ Specify a command name!");
                const delPath = path.join(commandsPath, `${args[1]}.js`);
                if (!fs.existsSync(delPath)) return message.reply(`❌ Command ${args[1]} not found!`);
                fs.unlinkSync(delPath);
                client.commands.delete(args[1]);
                message.reply(`✅ Deleted command: ${args[1]}`);
                break;

            case 'install':
                if (!args[1] || !args[2]) return message.reply("⚠️ Provide a filename and a valid URL!");
                const fileName = args[1].endsWith('.js') ? args[1] : `${args[1]}.js`;
                const fileUrl = getRawUrl(args[2]);
                if (!isValidUrl(fileUrl)) return message.reply("❌ Invalid URL!");
                const filePath = path.join(commandsPath, fileName);

                if (fs.existsSync(filePath)) {
                    const confirmEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('⚠️ Overwrite Existing Command?')
                        .setDescription(`The command **${fileName}** already exists. Do you want to overwrite it?`)
                        .setTimestamp();

                    const yesButton = new ButtonBuilder()
                        .setCustomId('yes')
                        .setLabel('Yes')
                        .setStyle(ButtonStyle.Danger);

                    const noButton = new ButtonBuilder()
                        .setCustomId('no')
                        .setLabel('No')
                        .setStyle(ButtonStyle.Secondary);

                    const buttonRow = new ActionRowBuilder().addComponents(yesButton, noButton);

                    const confirmMessage = await message.reply({
                        embeds: [confirmEmbed],
                        components: [buttonRow]
                    });

                    const filter = (interaction) => interaction.user.id === message.author.id;
                    const collector = confirmMessage.createMessageComponentCollector({
                        filter,
                        time: 30000
                    });

                    collector.on('collect', async (interaction) => {
                        if (interaction.customId === 'yes') {
                            const response = await axios.get(fileUrl, { timeout: 10000 });
                            fs.writeFileSync(filePath, response.data);
                            delete require.cache[require.resolve(filePath)];
                            const newCommand = require(filePath);
                            if (newCommand.config && newCommand.config.name) {
                                client.commands.set(newCommand.config.name, newCommand);
                                await interaction.update({
                                    content: `✅ Overwritten and installed command: ${fileName}`,
                                    embeds: [],
                                    components: []
                                });
                            } else {
                                fs.unlinkSync(filePath);
                                await interaction.update({
                                    content: "❌ Invalid structure in the downloaded file!",
                                    embeds: [],
                                    components: []
                                });
                            }
                        } else if (interaction.customId === 'no') {
                            await confirmMessage.delete();
                        }
                    });

                    collector.on('end', (collected) => {
                        if (!collected.size) confirmMessage.delete();
                    });
                } else {
                    const response = await axios.get(fileUrl, { timeout: 10000 });
                    fs.writeFileSync(filePath, response.data);
                    delete require.cache[require.resolve(filePath)];
                    const newCommand = require(filePath);
                    if (newCommand.config && newCommand.config.name) {
                        client.commands.set(newCommand.config.name, newCommand);
                        message.reply(`✅ Installed command: ${fileName}`);
                    } else {
                        fs.unlinkSync(filePath);
                        message.reply("❌ Invalid structure in the downloaded file!");
                    }
                }
                break;

            default:
                message.reply("⚠️ Invalid action! Use: loadall, load, del, or install");
        }
    }
};