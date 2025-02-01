const { Client, GatewayIntentBits, Collection } = require('discord.js');
const axios = require('axios');
const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const rateLimit = require('express-rate-limit');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildEmojisAndStickers
    ]
});

const app = express();
client.commands = new Collection();
client.aliases = new Collection();
client.cooldowns = new Collection();
global.Meta = {};
Meta.onReply = new Map();

const { loadCommands } = require('./handlers/commandHandler');
const { setupAPI } = require('./handlers/apiHandler');
const { handleError } = require('./handlers/errorHandler');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use(limiter);

app.get('/', (req, res) => {
    res.send(`
       <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MeTa-DC-v2 Dashboard</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root {
            --primary: #7289da;
            --secondary: #2c2f33;
            --background: #23272a;
            --text: #ffffff;
            --accent: #99aab5;
            --glass: rgba(255, 255, 255, 0.1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            25% { background-position: 100% 50%; }
            50% { background-position: 50% 100%; }
            75% { background-position: 0% 50%; }
            100% { background-position: 50% 0%; }
        }

        @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(-45deg, #ff3366, #7289da, #00ccff, #33cc33);
            background-size: 400% 400%;
            animation: gradientBG 20s ease infinite;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--text);
        }

        .menu-toggle {
            position: fixed;
            top: 2rem;
            right: 2rem;
            z-index: 1000;
            cursor: pointer;
            background: var(--glass);
            padding: 1rem;
            border-radius: 50%;
            backdrop-filter: blur(10px);
            transition: 0.3s;
        }

        .menu-toggle:hover {
            transform: rotate(90deg);
        }

        .menu {
            position: fixed;
            top: 0;
            right: -300px;
            width: 300px;
            height: 100vh;
            background: rgba(35, 39, 42, 0.95);
            backdrop-filter: blur(20px);
            padding: 2rem;
            transition: 0.5s;
            z-index: 999;
        }

        .menu.active {
            right: 0;
        }

        .menu-item {
            padding: 1rem;
            margin: 1rem 0;
            background: var(--glass);
            border-radius: 10px;
            cursor: pointer;
            transition: 0.3s;
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .menu-item:hover {
            background: var(--primary);
            transform: translateX(-10px);
        }

        .container {
            background: rgba(35, 39, 42, 0.85);
            border-radius: 30px;
            padding: 3rem;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(20px);
            width: 90%;
            max-width: 1200px;
            text-align: center;
            border: 1px solid var(--glass);
        }

        .profile-img {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            border: 4px solid var(--primary);
            margin-bottom: 1rem;
            transition: transform 0.3s;
        }

        .profile-img:hover {
            transform: scale(1.1);
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin: 3rem 0;
        }

        .stat-card {
            background: linear-gradient(135deg, rgba(114, 137, 218, 0.1), rgba(114, 137, 218, 0.05));
            padding: 2rem;
            border-radius: 20px;
            transition: all 0.4s ease;
            border: 1px solid var(--glass);
            backdrop-filter: blur(5px);
            position: relative;
            overflow: hidden;
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            animation: shimmer 2s infinite;
        }

        .stat-card:hover {
            transform: translateY(-10px) scale(1.02);
            background: linear-gradient(135deg, rgba(114, 137, 218, 0.2), rgba(114, 137, 218, 0.1));
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .stat-card i {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: var(--primary);
        }

        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, var(--primary), #ff3366);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
            .container {
                width: 95%;
                padding: 1.5rem;
            }

            .stats {
                grid-template-columns: 1fr;
            }

            h1 {
                font-size: 2.5rem;
            }

            .menu {
                width: 100%;
                right: -100%;
            }
        }
    </style>
</head>
<body>
    <div class="menu-toggle">
        <i class="fas fa-bars fa-2x"></i>
    </div>

    <div class="menu">
        <div class="menu-item" onclick="window.open('https://discord.com/oauth2/authorize?client_id=1322319281819488256', '_blank')">
            <i class="fas fa-robot"></i>
            <span>Connect with Bot</span>
        </div>
        <div class="menu-item" onclick="window.open('https://discord.com/oauth2/authorize?client_id=1322319281819488256', '_blank')">
            <i class="fas fa-server"></i>
            <span>Add to Server</span>
        </div>
        <div class="menu-item" onclick="window.open('https://discord.gg/jFCnkQqC', '_blank')">
            <i class="fas fa-user"></i>
            <span>Contact NZ R.!</span>
        </div>
    </div>

    <div class="container">
        <img src="${client.user.displayAvatarURL({ format: 'png', size: 512 })}" alt="Bot Avatar" class="profile-img">
        <h1>MeTa-DC-v2</h1>
        <div class="stats">
            <div class="stat-card">
                <i class="fas fa-server"></i>
                <h3>Servers</h3>
                <p>${client.guilds.cache.size}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-users"></i>
                <h3>Users</h3>
                <p>${client.users.cache.size}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-code"></i>
                <h3>Commands</h3>
                <p>${client.commands.size}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-clock"></i>
                <h3>Uptime</h3>
                <p id="uptime">Calculating...</p>
            </div>
        </div>
    </div>

    <script>
    function updateUptime() {
        const startTime = ${client.readyTimestamp};
        const now = Date.now();
        const uptime = now - startTime;
        
        const days = Math.floor(uptime / 86400000);
        const hours = Math.floor((uptime % 86400000) / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        
        document.getElementById('uptime').textContent = 
            `${days}d ${hours}h ${minutes}m`;
    }

    setInterval(updateUptime, 60000);
    updateUptime();
</script>
</body>
</html>
    `);
});

app.use((err, req, res, next) => {
    res.status(500).send('Something broke!');
});

process.on('unhandledRejection', error => handleError(error, client));
process.on('uncaughtException', error => handleError(error, client));

client.on('ready', () => {
    console.log(`
    ====================================
    [STARTING] MeTa-DC-V2
    ====================================
    [CREATOR] NZ R
    [STATUS] ${client.user.tag} is online!
    [GUILDS] ${client.guilds.cache.size}
    [USERS] ${client.users.cache.size}
    [COMMANDS] ${client.commands.size}
    ====================================
    `);
    
    setInterval(() => {
        client.user.setActivity(`MeTa-DC-V2 | ${client.guilds.cache.size} servers`, { 
            type: 'PLAYING'
        });
    }, 300000);
});

client.on('guildMemberAdd', async member => {
    const channel = member.guild.systemChannel;
    if (channel && channel.permissionsFor(client.user).has('SEND_MESSAGES')) {
        await channel.send({
            embeds: [{
                color: 0x7289da,
                title: 'Welcome!',
                description: `Welcome ${member.user.tag} to ${member.guild.name}!`,
                fields: [{ name: 'Member Count', value: `${member.guild.memberCount}` }],
                thumbnail: { url: member.user.displayAvatarURL({ dynamic: true }) },
                timestamp: new Date()
            }]
        });
    }
});

client.on('guildMemberRemove', async member => {
    const channel = member.guild.systemChannel;
    if (channel && channel.permissionsFor(client.user).has('SEND_MESSAGES')) {
        await channel.send({
            embeds: [{
                color: 0xff0000,
                description: `${member.user.tag} has left ${member.guild.name}.`,
                fields: [{ name: 'Member Count', value: `${member.guild.memberCount}` }],
                timestamp: new Date()
            }]
        });
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (Meta.onReply.has(message.author.id)) {
        const replyData = Meta.onReply.get(message.author.id);
        if (message.reference && message.reference.messageId === replyData.messageId) {
            try {
                await replyData.callback(message);
            } catch (error) {
                handleError(error, client);
            }
            return;
        }
    }

    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (!cmd) {
        return message.reply({
            embeds: [{
                color: 0xff0000,
                description: `Command not found. Type \`${config.prefix}help\` to see all available commands.`
            }]
        });
    }

    const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));

    if (command) {
        if (!client.cooldowns.has(command.name)) {
            client.cooldowns.set(command.name, new Collection());
        }

        const now = Date.now();
        const timestamps = client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before using the \`${command.name}\` command.`);
            }
        }

        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        try {
            await command.heyMetaStart({
                client,
                message,
                args,
                prefix: config.prefix
            });
        } catch (error) {
            handleError(error, client);
            message.reply('There was an error executing that command.');
        }
    } else {
        message.reply({
            embeds: [{
                color: 0xff0000,
                description: `Command not found. Type \`${config.prefix}help\` to see all available commands.`
            }]
        });
    }
});

async function initializeBot() {
    try {
        await loadCommands(client);
        await setupAPI(app);
        
        const PORT = process.env.PORT || config.port;
        app.listen(PORT, () => {
            console.log(`[MeTa] is running on port ${PORT}`);
        });

        await client.login(config.token);
    } catch (error) {
        console.error('Failed to initialize bot:', error);
        process.exit(1);
    }
}

initializeBot();
