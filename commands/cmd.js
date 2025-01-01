const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: "cmd",
        aliases: ["command"],
        version: "1.0",
        author: "NZ R",
        countDown: 5,
        role: 2,
        category: "system",
        guide: {
            en: "-cmd loadall\n-cmd unload <cmdName>\n-cmd install <link/code>\n-cmd del <cmdName>\n-cmd role <cmdName> <1|2>"
        }
    },
    heyMetaStart: async function({ ctx, args }) {
        if (!args[0]) return ctx.reply("⚠️ Missing action parameter!");

        const action = args[0].toLowerCase();
        const cmdPath = path.join(__dirname, '../commands');

        switch (action) {
            case "loadall":
                try {
                    const files = fs.readdirSync(cmdPath).filter(file => file.endsWith('.js'));
                    global.Meta.commands.clear();
                    
                    for (const file of files) {
                        delete require.cache[require.resolve(path.join(cmdPath, file))];
                        const command = require(path.join(cmdPath, file));
                        global.Meta.commands.set(command.config.name, command);
                        if (command.config.aliases) {
                            command.config.aliases.forEach(alias => {
                                global.Meta.commands.set(alias, command);
                            });
                        }
                    }
                    return ctx.reply(`✅ Successfully loaded ${files.length} commands!`);
                } catch (error) {
                    return ctx.reply("❌ Error loading commands: " + error.message);
                }

            case "unload":
                if (!args[1]) return ctx.reply("⚠️ Please specify command name!");
                try {
                    const cmdName = args[1].toLowerCase();
                    if (global.Meta.commands.has(cmdName)) {
                        global.Meta.commands.delete(cmdName);
                        return ctx.reply(`✅ Unloaded command: ${cmdName}`);
                    }
                    return ctx.reply("❌ Command not found!");
                } catch (error) {
                    return ctx.reply("❌ Error unloading command: " + error.message);
                }

            case "install":
                if (!args[1]) return ctx.reply("⚠️ Please provide command code or link!");
                try {
                    let code = args.slice(1).join(" ");
                    if (code.startsWith("http")) {
                        const response = await axios.get(code);
                        code = response.data;
                    }
                    
                    const matches = code.match(/name:\s*"([^"]+)"/);
                    if (!matches) return ctx.reply("❌ Invalid command format!");
                    
                    const cmdName = matches[1];
                    const cmdFile = path.join(cmdPath, `${cmdName}.js`);
                    
                    await fs.writeFile(cmdFile, code);
                    delete require.cache[require.resolve(cmdFile)];
                    const command = require(cmdFile);
                    global.Meta.commands.set(command.config.name, command);
                    
                    return ctx.reply(`✅ Installed command: ${cmdName}`);
                } catch (error) {
                    return ctx.reply("❌ Error installing command: " + error.message);
                }

            case "del":
                if (!args[1]) return ctx.reply("⚠️ Please specify command name!");
                try {
                    const cmdName = args[1].toLowerCase();
                    const cmdFile = path.join(cmdPath, `${cmdName}.js`);
                    
                    if (fs.existsSync(cmdFile)) {
                        fs.unlinkSync(cmdFile);
                        global.Meta.commands.delete(cmdName);
                        return ctx.reply(`✅ Deleted command: ${cmdName}`);
                    }
                    return ctx.reply("❌ Command file not found!");
                } catch (error) {
                    return ctx.reply("❌ Error deleting command: " + error.message);
                }

            case "role":
                if (!args[1] || !args[2]) return ctx.reply("⚠️ Please specify command name and role!");
                try {
                    const cmdName = args[1].toLowerCase();
                    const role = parseInt(args[2]);
                    
                    if (role !== 1 && role !== 2) return ctx.reply("❌ Invalid role! Use 1 or 2");
                    
                    const command = global.Meta.commands.get(cmdName);
                    if (!command) return ctx.reply("❌ Command not found!");
                    
                    command.config.role = role;
                    return ctx.reply(`✅ Changed ${cmdName}'s role to ${role}`);
                } catch (error) {
                    return ctx.reply("❌ Error changing role: " + error.message);
                }

            default:
                return ctx.reply("❌ Invalid action!");
        }
    }
};