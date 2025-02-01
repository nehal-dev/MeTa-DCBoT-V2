const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

module.exports = {
    config: {
        name: "eval",
        aliases: ["e"],
        version: "2.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        shortDescription: {
            en: "Evaluate JavaScript code"
        },
        longDescription: {
            en: "Allows the specified administrator to evaluate JavaScript code and test API calls"
        },
        category: "ADMIN",
        guide: {
            en: "-eval <code>"
        },
    },

    heyMetaStart: async function({ message, args }) {
        const adminUID = "1306646391325589529";
        if (message.author.id !== adminUID) return message.reply("⚠️ Only admin can use this command!");

        if (!args.length) return message.reply("⚠️ Please provide code to evaluate!");

        try {
            const output = async (msg) => {
                let result = msg;

                if (typeof msg === "object" || Array.isArray(msg)) {
                    result = JSON.stringify(msg, null, 2);
                }

                if (typeof result !== "string") result = String(result);

                if (result.length > 2000) {
                    const filePath = `./output_${Date.now()}.txt`;
                    fs.writeFileSync(filePath, result);
                    await message.reply({
                        content: "⚡ Output is too large, sending as a file!",
                        files: [{ attachment: filePath, name: "output.txt" }]
                    });
                    fs.unlinkSync(filePath);
                } else {
                    await message.reply(result);
                }
            };

            const handleAPI = async (url) => {
                try {
                    const response = await axios.get(url);
                    return response.data;
                } catch (err) {
                    return `⚠️ API error: ${err.message}`;
                }
            };

            const cmd = `
            (async () => {
                try {
                    let result;
                    const code = \`${args.join(" ")}\`;
                    if (code.startsWith('fetch(')) {
                        result = await handleAPI(code.slice(6, -1));
                    } else {
                        result = eval(code);
                    }
                    output(result);
                } catch(err) {
                    console.error("eval command", err);
                    message.reply(
                        "⚠️ An error occurred: \\n" +
                        (err.stack ? err.stack : JSON.stringify(err, null, 2) || "")
                    );
                }
            })()`;

            await eval(cmd);
        } catch (error) {
            message.reply('⚠️ An error occurred while evaluating the code.');
        }
    }
};