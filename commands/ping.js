module.exports = {
    config: {
        name: "ping",
        aliases: ["p"],
        version: "1.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        category: "SYSTEM",
        guide: {
            en: "Check bot's latency"
        }
    },
    heyMetaStart: async function({ client, message }) {
        const ping = Date.now() - message.createdTimestamp;
        const apiPing = Math.round(client.ws.ping);
        
        await message.reply(`🏓 Pong!\n📡 Latency: ${ping}ms\n🌐 API: ${apiPing}ms`);
    }
};