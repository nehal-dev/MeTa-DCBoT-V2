const { EmbedBuilder } = require('discord.js');

module.exports = {
    config: {
        name: "spy",
        aliases: ["userinfo"],
        version: "1.0.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        category: "utility",
        guide: {
            en: "-spy <@mention> (to get detailed info about a user)"
        }
    },
    heyMetaStart: async function ({ message, args }) {
        try {
            const target = message.mentions.users.first() || message.guild.members.cache.get(args[0]);

            if (!target) {
                return message.reply("❌ Please mention a valid user to spy on.");
            }

            const member = message.guild.members.cache.get(target.id);
            const embed = new EmbedBuilder()
                .setColor("#3498db")
                .setTitle(`🔍 Spying on ${target.username}`)
                .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 1024 }))
                .addFields(
                    { name: "👤 Username", value: `${target.username}#${target.discriminator}`, inline: true },
                    { name: "🆔 User ID", value: target.id, inline: true },
                    { name: "📅 Account Created", value: `<t:${Math.floor(target.createdTimestamp / 1000)}:F>`, inline: true },
                    { name: "📥 Joined Server", value: member?.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : "N/A", inline: true },
                    { name: "🏷️ Roles", value: member?.roles.cache.map(r => r.name).join(', ') || "None", inline: false }
                )
                .setFooter({
                    text: "Requested by " + message.author.username,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                });

            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("Error fetching user info:", error);
            await message.reply("❌ An error occurred while trying to spy on the user.");
        }
    }
};