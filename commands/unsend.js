module.exports = {
    config: {
        name: "unsend",
        aliases: ["uns"],
        version: "1.0.0",
        author: "NZ R",
        category: "utility",
        guide: {
            en: "-unsend [reply to a bot message]"
        }
    },
    heyMetaStart: async function({ message }) {
        if (message.reference) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            if (referencedMessage.author.bot) {
                await referencedMessage.delete();
            }
        }
    }
};