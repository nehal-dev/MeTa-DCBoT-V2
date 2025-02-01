const { EmbedBuilder } = require('discord.js');
const os = require('os');
const moment = require('moment');

module.exports = {
    config: {
        name: "info",
        aliases: ["botinfo"],
        version: "1.0.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        category: "information",
        guide: {
            en: "-info (view the bot information)"
        }
    },
    heyMetaStart: async function({ message, client }) {
        const totalServers = client.guilds.cache.size;
        const totalUsers = client.users.cache.size;
        const uptime = moment.duration(client.uptime).humanize();
        const nodeVersion = process.version;
        const platform = os.platform();
        const cpuArch = os.arch();
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB';
        const botAvatar = client.user.displayAvatarURL();

        const embed = new EmbedBuilder()
            .setColor('#4ecdc4')
            .setTitle('MeTa\'s Information') // Escaped apostrophe
            .setThumbnail(botAvatar)
            .addFields(
                { name: 'Uptime', value: uptime, inline: true },
                { name: 'Total Users', value: totalUsers.toString(), inline: true },
                { name: 'Total Servers', value: totalServers.toString(), inline: true },
                { name: 'Node.js Version', value: nodeVersion, inline: true },
                { name: 'Platform', value: platform, inline: true },
                { name: 'CPU Architecture', value: cpuArch, inline: true },
                { name: 'Memory Usage', value: memoryUsage, inline: true }
            )
            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

        await message.reply({ embeds: [embed] });
    }
};