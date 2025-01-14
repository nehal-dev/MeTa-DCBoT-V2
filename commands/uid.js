module.exports = {
    config: {
        name: "uid",
        aliases: ["userid"],
        version: "1.2",
        author: "NZ R",
        countDown: 5,
        role: 0,
        category: "utility",
        guide: {
            en: "-uid"
        }
    },
    heyMetaStart: async function({ ctx }) {
        const userId = ctx.from.id;

        if (!userId) return ctx.reply("❌ Unable to fetch your UID!");

        const replyText = `<code>${userId}</code>`;

        return ctx.reply(replyText, {
            parse_mode: "HTML",
            reply_to_message_id: ctx.message.message_id,
        });
    }
};
