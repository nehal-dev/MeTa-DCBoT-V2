const { Telegraf } = require('telegraf');
const config = require('./config.json');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { Readable } = require('stream');

global.Meta = {
    commands: new Map(),
    onReply: new Map(),
    activeCommands: new Map(),
    stats: {
        commandsUsed: 0,
        messagesProcessed: 0,
        startTime: Date.now(),
        groupsJoined: 0,
        totalMembers: 0,
        mediaProcessed: 0
    },
    cooldowns: new Map(),
    antiSpam: new Map(),
    groupSettings: new Map(),
    mediaQueue: new Map()
};

const { handleCommand, findSimilarCommand } = require('./handlers/commandHandler');
const { handleError } = require('./errorHandler');
const bot = new Telegraf(config.botToken);

async function downloadMedia(url, filename) {
    const response = await axios({ url, method: 'GET', responseType: 'stream', maxContentLength: 50 * 1024 * 1024 });
    const filePath = path.join(__dirname, 'temp', filename);
    const writer = fs.createWriteStream(filePath);
    return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
    });
}

async function processAudio(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .toFormat('mp3')
            .audioBitrate('128k')
            .audioChannels(2)
            .audioFrequency(44100)
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .save(outputPath);
    });
}

async function processVideo(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .toFormat('mp4')
            .videoBitrate('1000k')
            .videoCodec('libx264')
            .size('640x?')
            .audioCodec('aac')
            .audioBitrate('128k')
            .fps(30)
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .save(outputPath);
    });
}

function cleanupTempFiles() {
    const tempDir = path.join(__dirname, 'temp');
    fs.readdir(tempDir, (err, files) => {
        if (err) return;
        files.forEach(file => {
            const filePath = path.join(tempDir, file);
            const stats = fs.statSync(filePath);
            const now = Date.now();
            if (now - stats.mtimeMs > 3600000) fs.unlinkSync(filePath);
        });
    });
}

const introMessage = `Hello I'm MeTa-AI 🎀\n\nPrefix: ${config.prefix}\n\nType ${config.prefix}help to see my all available commands!`;

const textDirector = new Map([
    ['prefix', introMessage],
    ['meta', introMessage],
    ['meta-ai', introMessage],
    [config.prefix, introMessage],
    ['hello meta', introMessage],
    ['hi meta', introMessage]
]);

bot.on(['audio', 'voice'], async (ctx) => {
    try {
        const audioMsg = ctx.message.audio || ctx.message.voice;
        const fileId = audioMsg.file_id;
        const fileName = `audio_${Date.now()}.mp3`;
        await ctx.reply('🎵 Processing audio...');
        const file = await ctx.telegram.getFile(fileId);
        const inputPath = path.join(__dirname, 'temp', `input_${fileName}`);
        const outputPath = path.join(__dirname, 'temp', fileName);
        await downloadMedia(`https://api.telegram.org/file/bot${config.botToken}/${file.file_path}`, `input_${fileName}`);
        await processAudio(inputPath, outputPath);
        await ctx.replyWithAudio({ source: outputPath });
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
        global.Meta.stats.mediaProcessed++;
    } catch (error) {
        ctx.reply('❌ Error processing audio file');
        handleError('AudioProcessing', error);
    }
});

bot.on('video', async (ctx) => {
    try {
        const videoMsg = ctx.message.video;
        const fileId = videoMsg.file_id;
        const fileName = `video_${Date.now()}.mp4`;
        await ctx.reply('🎥 Processing video...');
        const file = await ctx.telegram.getFile(fileId);
        const inputPath = path.join(__dirname, 'temp', `input_${fileName}`);
        const outputPath = path.join(__dirname, 'temp', fileName);
        await downloadMedia(`https://api.telegram.org/file/bot${config.botToken}/${file.file_path}`, `input_${fileName}`);
        await processVideo(inputPath, outputPath);
        await ctx.replyWithVideo({ source: outputPath });
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
        global.Meta.stats.mediaProcessed++;
    } catch (error) {
        ctx.reply('❌ Error processing video file');
        handleError('VideoProcessing', error);
    }
});

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

setInterval(cleanupTempFiles, 3600000);

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
