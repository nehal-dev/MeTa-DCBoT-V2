const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "sing",
        aliases: ["song", "music"],
        version: "1.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        category: "media",
        guide: {
            en: "-sing <song name>"
        }
    },
    heyMetaStart: async function({ ctx, args }) {
        if (!args.length) return ctx.reply("⚠️ Please provide a song name!");

        try {
            const query = args.join(" ");
            const loadingMsg = await ctx.reply("🔍 Searching songs...");

            const searchResponse = await axios.get(`https://ytdl-v3-by-nzr.onrender.com/search?name=${encodeURIComponent(query)}`);
            const videos = searchResponse.data.results.slice(0, 6);

            if (videos.length === 0) {
                await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);
                return ctx.reply("❌ No results found. Please try a different query.");
            }

            let msg = "🎵 Here are your song suggestions:\n\n";
            videos.forEach((video, index) => {
                msg += `${index + 1}. ${video.title}\n`;
                msg += `Duration: ${video.timestamp}\n\n`;
            });
            msg += "Reply with the number to download your choice. 🎧";

            await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);
            const listMsg = await ctx.reply(msg);

            Meta.onReply.set(listMsg.message_id, async (replyCtx) => {
                const choice = parseInt(replyCtx.message.text);

                if (isNaN(choice) || choice < 1 || choice > videos.length) {
                    return replyCtx.reply("⚠️ Invalid choice. Please choose a number between 1 and 6.");
                }

                const loadingDownload = await replyCtx.reply("⏳ Downloading your song...");

                try {
                    const video = videos[choice - 1];
                    const apiUrl = `https://ytdl-v3-by-nzr.onrender.com/mp3?url=${video.url}`;
                    const response = await axios.get(apiUrl);
                    const { link, title } = response.data.data;

                    const audioPath = path.join(__dirname, `../temp/${title}.mp3`);
                    await downloadFile(link, audioPath);

                    await replyCtx.telegram.deleteMessage(replyCtx.chat.id, loadingDownload.message_id);
                    await replyCtx.replyWithAudio(
                        { source: fs.createReadStream(audioPath) },
                        { 
                            caption: `🎶 Here is your song:\nTitle: ${title}\nDuration: ${video.timestamp}`,
                            title: title,
                            performer: "MeTa-AI"
                        }
                    );

                    Meta.onReply.delete(listMsg.message_id);
                    fs.unlinkSync(audioPath);

                } catch (error) {
                    await replyCtx.telegram.deleteMessage(replyCtx.chat.id, loadingDownload.message_id);
                    replyCtx.reply("❌ Failed to download the song. Please try again.");
                }
            });

            setTimeout(() => Meta.onReply.delete(listMsg.message_id), 300000);

        } catch (error) {
            ctx.reply("🚫 An error occurred. Please try again.");
        }
    }
};

async function downloadFile(url, filepath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer'
    });
    await fs.ensureDir(path.dirname(filepath));
    await fs.writeFile(filepath, Buffer.from(response.data));
    return filepath;
}
