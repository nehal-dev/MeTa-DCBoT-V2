module.exports = {
    config: {
        name: "unsend",
        aliases: ["uns"],
        version: "1.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        category: "utility",
        guide: {
            en: "-unsend"
        }
    },
    heyMetaStart: async function({ ctx }) {
        if (!ctx.message.reply_to_message) return; 
        const botMessage = ctx.message.reply_to_message;

        
        if (botMessage.from.id === ctx.botInfo.id) {
            try {
                await ctx.deleteMessage(botMessage.message_id); 
            } catch (error) {
                console.error("Error deleting message:", error);
            }
        }
    }
};
