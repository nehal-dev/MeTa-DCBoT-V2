const fs = require('fs-extra');
const path = require('path');
const { handleError } = require('../errorHandler');
const config = require('../config.json');

function calculateStringSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return 1 - (matrix[len1][len2] / Math.max(len1, len2));
}

function findSimilarCommand(commandName) {
    const threshold = 0.5;
    const similarities = [...new Set([...global.Meta.commands.keys()])]
        .map(cmd => ({
            command: cmd,
            similarity: calculateStringSimilarity(commandName, cmd)
        }))
        .filter(item => item.similarity > threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3)
        .map(item => item.command);

    return similarities;
}

const loadCommands = () => {
    try {
        if (!fs.existsSync(path.join(__dirname, '../commands'))) {
            fs.mkdirSync(path.join(__dirname, '../commands'), { recursive: true });
        }

        const commandFiles = fs.readdirSync(path.join(__dirname, '../commands'))
            .filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            global.Meta.commands.set(command.config.name, command);
            if (command.config.aliases) {
                command.config.aliases.forEach(alias => {
                    global.Meta.commands.set(alias, command);
                });
            }
        }
    } catch (error) {
        handleError('CommandLoading', error);
    }
};

const handleCommand = async (ctx, commandString) => {
    const args = commandString.split(' ');
    const commandName = args.shift().toLowerCase();
    const command = global.Meta.commands.get(commandName);

    if (!command) {
        return {
            status: 'unknown',
            attempted: commandName
        };
    }

    try {
        if (command.config.role === 2 && ctx.from.id.toString() !== config.ownerUID) {
            return {
                status: 'error',
                message: '⚠️ This command is only for the bot owner!'
            };
        }

        const cooldown = global.Meta.activeCommands.get(`${ctx.from.id}-${command.config.name}`);
        if (cooldown && Date.now() < cooldown) {
            const timeLeft = Math.ceil((cooldown - Date.now()) / 1000);
            return {
                status: 'error',
                message: `⏳ Please wait ${timeLeft}s before using this command again.`
            };
        }

        if (command.config.countDown) {
            global.Meta.activeCommands.set(
                `${ctx.from.id}-${command.config.name}`,
                Date.now() + (command.config.countDown * 1000)
            );
        }

        await command.heyMetaStart({ 
            ctx, 
            args,
            prefix: config.prefix,
            command: commandName
        });

        global.Meta.stats.commandsUsed++;
        return { status: 'success' };

    } catch (error) {
        handleError(`Command_${commandName}`, error);
        return {
            status: 'error',
            message: 'An error occurred while executing this command.'
        };
    }
};

loadCommands();

module.exports = { handleCommand, findSimilarCommand };