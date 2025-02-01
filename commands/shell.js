const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    config: {
        name: "shell",
        aliases: ["sh", "exec"],
        version: "1.0.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        category: "ADMIN",
        guide: {
            en: "-shell [command]"
        }
    },
    heyMetaStart: async function({ message, args, client }) {
        const adminUID = "1306646391325589529";

        if (message.author.id !== adminUID) {
            return message.reply("⚠️ Only admin can use this command!");
        }

        const command = args.join(" ");
        if (!command) {
            return message.reply("⚠️ Please provide a command to execute.");
        }

        exec(command, (error, stdout, stderr) => {
            if (error) {
                return message.reply(`❌ Error: ${error.message}`);
            }

            const output = stderr || stdout.trim();
            const maxLength = 2000;

            if (output.length === 0) {
                return message.reply("✅ Command executed successfully with no output.");
            }

            if (output.length > maxLength) {
                const filePath = path.join(__dirname, `output_${Date.now()}.txt`);
                fs.writeFileSync(filePath, output, 'utf8');
                message.reply({
                    content: "⚠️ Output is too long to display. Here is the output file:",
                    files: [filePath]
                }).then(() => {
                    fs.unlink(filePath, () => {});
                });
            } else {
                message.reply(`📝 Output:\n\`\`\`\n${output}\n\`\`\``);
            }
        });
    }
};