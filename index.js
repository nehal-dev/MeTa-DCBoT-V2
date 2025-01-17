const { Client, GatewayIntentBits, Collection } = require('discord.js');
const axios = require('axios');
const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const app = express();
client.commands = new Collection();
client.aliases = new Collection();
global.Meta = {};

Meta.onReply = new Map();

const { loadCommands } = require('./handler/commandHandler');
const { setupAPI } = require('./handler/apiHandler');
const { handleError } = require('./handler/errorHandler');

app.use(express.json());

process.on('unhandledRejection', error => {
    handleError(error, client);
});

client.on('ready', () => {
    console.log(`
    ====================================
    [STARTING] MeTa-DC-V2 Robot
    ====================================
    [CREATOR] NZ R
    [STATUS] ${client.user.tag} is online!
    ====================================
    `);
    console.log(`[META] Loaded ${client.commands.size} commands`);
    client.user.setActivity('MeTa-DC-V2 | By NZ R', { type: 'PLAYING' });
});

client.on('guildMemberAdd', member => {
    const channel = member.guild.systemChannel;
    if (channel) channel.send(`Welcome ${member.user.tag} to ${member.guild.name}!`);
});

client.on('guildMemberRemove', member => {
    const channel = member.guild.systemChannel;
    if (channel) channel.send(`${member.user.tag} has left ${member.guild.name}.`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (Meta.onReply.has(message.author.id)) {
        const replyData = Meta.onReply.get(message.author.id);
        if (message.reference && message.reference.messageId === replyData.messageId) {
            return replyData.callback(message);
        }
    }

    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (!cmd) {
        return message.reply(`Command not found. Type \`${config.prefix}help\` to see all available commands.`);
    }

    const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));

    if (command) {
        try {
            await command.heyMetaStart({
                client,
                message,
                args,
                prefix: config.prefix
            });
        } catch (error) {
            handleError(error, client);
        }
    } else {
        return message.reply(`Command not found. Type \`${config.prefix}help\` to see all available commands.`);
    }
});

loadCommands(client);
setupAPI(app);

const PORT = process.env.PORT || config.port;
app.listen(PORT, () => {
    console.log(`[META] API Server running on port ${PORT}`);
});

client.login(config.token);
