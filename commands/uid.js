const { EmbedBuilder } = require('discord.js');

module.exports = {
    config: {
        name: "uid",
        aliases: ["id"],
        version: "1.0",
        author: "NZ R",
        countDown: 3,
        role: 0,
        category: "UTILITY",
        guide: {
            en: "Get user ID\nUsage: -uid [@user]"
        }
    },
    heyMetaStart: async function({ message }) {
        try {
            const targetUser = message.mentions.users.first() || message.author;

            const embed = new EmbedBuilder()
                .setColor('#2F3136')
                .setDescription(`${targetUser.username}'s UID: \`${targetUser.id}\``);

            message.reply({ embeds: [embed] });

        } catch (error) {
            message.reply('❌ Failed to get user ID.');
        }
    }
};