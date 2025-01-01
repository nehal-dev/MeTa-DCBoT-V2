module.exports = {
    config: {
        name: "ping",
        aliases: ["p"],
        version: "1.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        category: "system",
        guide: {
            en: "Check bot's response time"
        }
    },
    heyMetaStart: async function({ ctx }) {
        const start = Date.now();
        const msg = await ctx.reply('🏓 Pinging...');
        const latency = Date.now() - start;

        await ctx.telegram.editMessageText(
            ctx.chat.id,
            msg.message_id,
            null,
            `🏓 Pong!\nLatency: ${latency}ms`
        );
    }
};