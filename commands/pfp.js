module.exports = {
    config: {
        name: "pfp",
        aliases: ["profile"],
        version: "1.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        category: "utility",
        guide: {
            en: ""
        }
    },
    heyMetaStart: async function({ ctx }) {
        let userId = null;

        if (ctx.message.reply_to_message) {
            userId = ctx.message.reply_to_message.from.id;
        } else if (ctx.message.entities) {
            ctx.message.entities.forEach(entity => {
                if (entity.type === 'mention' || entity.type === 'text_mention') {
                    userId = entity.user ? entity.user.id : null;
                }
            });
        }

        if (!userId) {
            return ctx.reply('Please reply to a user\'s message or tag a user to view their profile picture.');
        }

        try {
            const userProfilePhotos = await ctx.telegram.getUserProfilePhotos(userId);
            if (userProfilePhotos.total_count === 0) {
                return ctx.reply('This user has no profile picture.');
            }

            const photoFileId = userProfilePhotos.photos[0][0].file_id;
            await ctx.replyWithPhoto(photoFileId, { caption: `Here is the profile picture of the user.` });
        } catch (error) {
            ctx.reply('An error occurred while fetching the profile picture.');
        }
    }
};
