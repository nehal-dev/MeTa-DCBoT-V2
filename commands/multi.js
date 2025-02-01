module.exports = {
    config: {
        name: "multi",
        aliases: ["m"],
        version: "1.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        category: "SYSTEM",
        guide: {
            en: "Multi-purpose command: \njoin [server url] - Join server\nsetavt - Set bot avatar (reply with image)"
        }
    },
    heyMetaStart: async function({ api, args, message, client }) {
        const command = args[0]?.toLowerCase();
        
        if (!command) {
            return message.reply("Available options: join, setavt");
        }

        switch (command) {
            case "join":
                const inviteUrl = args[1];
                if (!inviteUrl) return message.reply("Please provide a server invite URL");
                
                try {
                    await client.acceptInvite(inviteUrl);
                    await message.reply("Successfully joined the server!");
                } catch (error) {
                    await message.reply("Failed to join server. Please check the invite URL and try again.");
                }
                break;

            case "setavt":
                const attachment = message.reference ? 
                    await message.fetchReference().then(msg => msg.attachments.first()) : 
                    message.attachments.first();

                if (!attachment) {
                    return message.reply("Please reply to an image to set as avatar");
                }

                try {
                    await client.user.setAvatar(attachment.url);
                    await message.reply("Successfully updated bot avatar!");
                } catch (error) {
                    await message.reply("Failed to update avatar. Please try again later.");
                }
                break;

            default:
                await message.reply("Invalid option. Available options: join, setavt");
        }
    }
};