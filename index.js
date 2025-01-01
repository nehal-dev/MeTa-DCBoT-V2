const { Telegraf } = require('telegraf');
const config = require('./config.json');
const path = require('path');
const fs = require('fs-extra');

global.Meta = {
    commands: new Map(),
    onReply: new Map(),
    activeCommands: new Map(),
    stats: {
        commandsUsed: 0,
        messagesProcessed: 0,
        startTime: Date.now(),
        groupsJoined: 0,
        totalMembers: 0
    },
    cooldowns: new Map(),
    antiSpam: new Map(),
    groupSettings: new Map()
};

const { handleCommand, findSimilarCommand } = require('./handlers/commandHandler');
const { handleError } = require('./errorHandler');

const bot = new Telegraf(config.botToken);

const introMessage = `Hello I'am MeTa-AI 🎀\n\nPrefix: ${config.prefix}\n\nType ${config.prefix}help to see my all available commands!`;

const textDirector = new Map([
    ['prefix', introMessage],
    ['meta', introMessage],
    ['meta-ai', introMessage],
    [config.prefix, introMessage],
    ['hello meta', introMessage],
    ['hi meta', introMessage]
]);

bot.on('text', async (ctx) => {
    try {
        const message = ctx.message.text.toLowerCase();
        global.Meta.stats.messagesProcessed++;

        const userId = ctx.from.id.toString();
        const now = Date.now();

        if (!global.Meta.antiSpam.has(userId)) {
            global.Meta.antiSpam.set(userId, { count: 0, firstMsg: now });
        }

        let userSpam = global.Meta.antiSpam.get(userId);
        userSpam.count++;

        if (now - userSpam.firstMsg < 5000 && userSpam.count > 5) {
            return ctx.reply('⚠️ Please slow down! You are sending messages too quickly.');
        }

        if (now - userSpam.firstMsg >= 5000) {
            global.Meta.antiSpam.set(userId, { count: 1, firstMsg: now });
        }

        if (textDirector.has(message)) {
            return ctx.reply(textDirector.get(message));
        }

        if (!message.startsWith(config.prefix)) {
            if (ctx.message.reply_to_message) {
                const replyHandler = Meta.onReply.get(ctx.message.reply_to_message.message_id);
                if (replyHandler) return replyHandler(ctx);
            }
            return;
        }

        const commandResult = await handleCommand(ctx, message.slice(config.prefix.length));

        if (commandResult.status === 'unknown') {
            const similarCommands = findSimilarCommand(commandResult.attempted);
            let errorMsg = `❌ Command "${commandResult.attempted}" not found.\n\n`;

            if (similarCommands.length > 0) {
                errorMsg += `Did you mean:\n${similarCommands.map(cmd => `➜ ${config.prefix}${cmd}`).join('\n')}`;
            } else {
                errorMsg += `Type ${config.prefix}help to see all available commands.`;
            }

            await ctx.reply(errorMsg);
        } else if (commandResult.status === 'error') {
            await ctx.reply(`❌ Error: ${commandResult.message}`);
        }

    } catch (error) {
        handleError('MessageProcessing', error);
        ctx.reply('❌ An unexpected error occurred.');
    }
});

bot.on('new_chat_members', async (ctx) => {
    try {
        const newMembers = ctx.message.new_chat_members;
        const chat = ctx.chat;
        global.Meta.stats.groupsJoined++;
        global.Meta.stats.totalMembers += newMembers.length;

        for (const member of newMembers) {
            if (member.id === ctx.botInfo.id) {
                await ctx.reply(`🎉 Thanks for adding me to ${chat.title}!\n\nPrefix: ${config.prefix}\nType ${config.prefix}help to see my commands.`);
            } else {
                const welcomeMsg = config.welcomeMessage
                    .replace('{user}', `[${member.first_name}](tg://user?id=${member.id})`)
                    .replace('{group}', chat.title);
                await ctx.replyWithMarkdown(welcomeMsg);
            }
        }
    } catch (error) {
        handleError('WelcomeMessage', error);
    }
});

bot.on('left_chat_member', async (ctx) => {
    try {
        const member = ctx.message.left_chat_member;
        if (member.id !== ctx.botInfo.id) {
            const leaveMsg = config.leaveMessage
                .replace('{user}', `[${member.first_name}](tg://user?id=${member.id})`)
                .replace('{group}', ctx.chat.title);
            await ctx.replyWithMarkdown(leaveMsg);
            global.Meta.stats.totalMembers--;
        }
    } catch (error) {
        handleError('LeaveMessage', error);
    }
});

bot.on('callback_query', async (ctx) => {
    try {
        const data = ctx.callbackQuery.data;
        const handler = Meta.onReply.get(data);
        if (handler) {
            await handler(ctx);
            Meta.onReply.delete(data);
        }
        await ctx.answerCbQuery();
    } catch (error) {
        handleError('CallbackQuery', error);
    }
});

bot.on('chat_member', async (ctx) => {
    try {
        const { old_chat_member, new_chat_member } = ctx.chatMember;
        if (old_chat_member.status === 'member' && new_chat_member.status === 'kicked') {
            const kickMsg = `👢 ${new_chat_member.user.first_name} was kicked from the group.`;
            await ctx.reply(kickMsg);
        }
    } catch (error) {
        handleError('ChatMember', error);
    }
});

bot.catch(async (err, ctx) => {
    const errorMessage = {
        'message too long': '❌ Response message is too long for Telegram.',
        'failed to fetch': '❌ Failed to fetch external resource.',
        'not enough rights': '❌ I need admin rights to perform this action.',
        'Too Many Requests': '❌ Bot is being rate limited. Please try again later.',
        'default': '❌ An unexpected error occurred.'
    };

    const msg = errorMessage[Object.keys(errorMessage).find(key => err.message.includes(key))] || errorMessage.default;
    await ctx.reply(msg);
    handleError('BotError', err);
});

const tempDir = path.join(__dirname, 'temp');
fs.ensureDirSync(tempDir);

setInterval(() => {
    const now = Date.now();
    global.Meta.cooldowns.forEach((time, key) => {
        if (now >= time) global.Meta.cooldowns.delete(key);
    });
    global.Meta.antiSpam.forEach((data, key) => {
        if (now - data.firstMsg >= 5000) global.Meta.antiSpam.delete(key);
    });
}, 5000);

bot.launch().then(() => {
    console.clear();
    const box = '═'.repeat(40);
    console.log(`╔${box}╗`);
    console.log('║           MeTa-AI Bot System           ║');
    console.log(`╠${box}╣`);
    console.log(`║ Status    : Online                     ║`);
    console.log(`║ Prefix    : ${config.prefix.padEnd(27)}║`);
    console.log(`║ Owner     : ${config.ownerUID.padEnd(27)}║`);
    console.log(`║ Time      : ${new Date().toLocaleString().padEnd(27)}║`);
    console.log(`╚${box}╝`);
}).catch(err => {
    handleError('StartupError', err);
    process.exit(1);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));