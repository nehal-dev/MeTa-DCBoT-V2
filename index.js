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
            <style>
                :root {
                    --primary: #7289da;
                    --secondary: #2c2f33;
                    --background: #23272a;
                    --text: #ffffff;
                    --accent: #99aab5;
                }
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                @keyframes gradientBG {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                    100% { transform: translateY(0px); }
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(-45deg, #23272a, #2c2f33, #7289da, #99aab5);
                    background-size: 400% 400%;
                    animation: gradientBG 15s ease infinite;
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: var(--text);
                }
                
                .container {
                    background: rgba(35, 39, 42, 0.95);
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(15px);
                    width: 90%;
                    max-width: 800px;
                    text-align: center;
                }
                
                .profile-img {
                    width: 150px;
                    height: 150px;
                    border-radius: 50%;
                    border: 4px solid var(--primary);
                    margin-bottom: 1rem;
                    animation: float 6s ease-in-out infinite;
                }
                
                .status {
                    display: inline-block;
                    padding: 0.5rem 1rem;
                    background: var(--primary);
                    border-radius: 25px;
                    margin: 1rem 0;
                    animation: pulse 2s infinite;
                }
                
                .stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin: 2rem 0;
                }
                
                .stat-card {
                    background: rgba(114, 137, 218, 0.1);
                    padding: 1rem;
                    border-radius: 15px;
                    transition: transform 0.3s ease;
                }
                
                .stat-card:hover {
                    transform: translateY(-5px);
                    background: rgba(114, 137, 218, 0.2);
                }
                
                h1 {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    background: linear-gradient(45deg, var(--primary), var(--accent));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                
                @media (max-width: 600px) {
                    .container {
                        width: 95%;
                        padding: 1rem;
                    }
                    
                    .stats {
                        grid-template-columns: 1fr;
                    }
                    
                    h1 {
                        font-size: 2rem;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <img src="${client.user.displayAvatarURL({ format: 'png', size: 512 })}" alt="Bot Avatar" class="profile-img">
                <h1>MeTa-DC-v2</h1>
                <div class="stats">
                    <div class="stat-card">
                        <h3>Servers</h3>
                        <p>${client.guilds.cache.size}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Users</h3>
                        <p>${client.users.cache.size}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Commands</h3>
                        <p>${client.commands.size}</p>
                    </div>
                    <div class="stat-card">
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
                        \`\${days}d \${hours}h \${minutes}m\`;
                }
                
                setInterval(updateUptime, 60000);
                updateUptime();
                
                document.querySelectorAll('.stat-card').forEach(card => {
                    card.addEventListener('mouseover', () => {
                        card.style.transform = 'scale(1.05) translateY(-5px)';
                    });
                    
                    card.addEventListener('mouseout', () => {
                        card.style.transform = 'translateY(0)';
                    });
                });
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
