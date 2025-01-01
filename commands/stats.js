const prettyMs = require('pretty-ms');

module.exports = {
    config: {
        name: "stats",
        aliases: ["status", "uptime"],
        version: "1.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        category: "system",
        guide: {
            en: "Shows bot statistics"
        }
    },
    heyMetaStart: async function({ ctx }) {
        const uptime = prettyMs(Date.now() - global.Meta.stats.startTime, {
            verbose: true,
            secondsDecimalDigits: 0
        });

        const statsMessage = `『 MeTa-AI Statistics 』\n\n` +
            `➜ Commands Used: ${global.Meta.stats.commandsUsed}\n` +
            `➜ Messages Processed: ${global.Meta.stats.messagesProcessed}\n` +
            `➜ Uptime: ${uptime}\n` +
            `➜ Commands Loaded: ${[...new Set([...global.Meta.commands.values()].map(cmd => cmd.config.name))].length}\n` +
            `➜ Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`;

        await ctx.reply(statsMessage);
    }
};