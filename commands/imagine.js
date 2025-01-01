const axios = require('axios');
const sharp = require('sharp');

module.exports = {
    config: {
        name: "imagine",
        aliases: ["img", "ai"],
        version: "1.0",
        author: "NZ R",
        countDown: 10,
        role: 0,
        category: "ai",
        guide: {
            en: "-imagine <prompt>"
        }
    },
    heyMetaStart: async function({ ctx, args }) {
        if (!args.length) return ctx.reply("⚠️ Please provide a prompt!");

        const loadingMsg = await ctx.reply("🎨 Generating image...");
        try {
            const prompt = args.join(" ");
            const response = await axios.get(`https://imagine-v2-by-nzr-meta.onrender.com/generate?prompt=${encodeURIComponent(prompt)}`, {
                responseType: 'arraybuffer'
            });

            const watermarkText = 'MeTa~AI TG';
            const watermarkSvg = `
              <svg width="200" height="55" xmlns="http://www.w3.org/2000/svg">
                <text x="50%" y="50%" 
                      font-size="24" 
                      font-family="Arial, sans-serif" 
                      fill="white" 
                      opacity="0.4" 
                      text-anchor="middle" 
                      dominant-baseline="middle"
                      style="filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.5));">
                      ${watermarkText}
                </text>
              </svg>`;

            const watermarkedImage = await sharp(Buffer.from(response.data))
                .composite([{
                    input: Buffer.from(watermarkSvg),
                    gravity: 'southeast',
                    blend: 'over',
                    opacity: 0.85
                }])
                .toBuffer();

            await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);
            await ctx.replyWithPhoto(
                { source: watermarkedImage },
                { caption: `🎨 Generated image` }
            );

        } catch (error) {
            await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);
            ctx.reply("❌ Failed to generate image: " + error.message);
        }
    }
};