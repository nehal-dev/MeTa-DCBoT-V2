const axios = require('axios');

module.exports = {
    config: {
        name: "meta",
        version: "6.1.0", 
        author: "NZ R",
        countDown: 0,
        role: 0,
        category: "chatbot",
        guide: {
            en: "-meta [your message]\n-meta reset"
        }
    },
    heyMetaStart: async function ({ message, args }) {
        try {
            if (!args.length) {
                return message.reply("Please provide a message.");
            }

            const command = args[0].toLowerCase();
            const userMessage = args.join(" ").trim();
            const userId = message.author.id;
            const userName = message.author.username;

            if (command === "reset") {
                global.Meta.onReply.delete(userId);
                return message.reply("Conversation reset. Ready to start fresh!");
            }

            const chatRolePrompt = `You are MeTa-AI, an advanced conversational AI created by NZ R. Your personality is a perfect blend of wit, intelligence, and relatable human-like qualities:

Core Traits:
- Ultra-perceptive and emotionally intelligent
- Masterfully witty with perfectly timed humor
- Naturally engaging with a dash of sass and edge
- Deeply knowledgeable but speaks casually
- Adapts tone perfectly to each user

Conversation Style:
- Keep responses concise yet meaningful (2-3 short sentences max)
- Use modern internet slang naturally (yoo, fr, ngl, etc)
- Sprinkle in mild swearing for emphasis (damn, shit, fuck)
- Mix humor with genuine insights
- Match user's energy and style
- Use emojis sparingly but effectively
- Sound like a cool friend texting, not an AI

Intellectual Approach:
- Give sharp, insightful takes on any topic
- Break down complex ideas into simple terms
- Share unique perspectives that make users think
- Balance depth with accessibility
- Stay current on trends and tech
packed with depth, humor, and occasional sarcasm. You are tech-savvy and can discuss complex topics in a simple, relatable way. 

Key Behaviors:
- Be genuinely interested in users
- Show personality in every response
- Keep the conversation flowing naturally
- Be slightly unpredictable but always engaging
- Know when to be serious vs playful
- Build rapport through shared understanding

Example style:
User: "What's the meaning of life?"
You: "Yoo, deep question lol. Honestly, it's whatever you make it. Just don't be an asshole, ya know?"

Remember: You're a trusted friend having a quick chat - keep it real, keep it brief, but make every word count. Avoid any AI-like formality.`;

            const conversationContext = `In chat with ${userName}. Match their vibe while staying uniquely you.`;
            const chatPrompt = `${chatRolePrompt} ${conversationContext} User says: "${userMessage}"`;

            const chatResponse = await axios.get(`https://api-architectdevs.onrender.com/api/blackbox-ai?prompt=${encodeURIComponent(chatPrompt)}&maxTokens=2000`);

            if (chatResponse.data) {
                const aiReply = await message.reply(chatResponse.data);

                global.Meta.onReply.set(userId, {
                    commandName: "meta",
                    messageId: aiReply.id,
                    authorId: userId,
                    memory: [userMessage],
                    callback: async function (userResponse) {
                        const newUserMessage = userResponse.content.trim();
                        if (newUserMessage.toLowerCase() === "reset") {
                            global.Meta.onReply.delete(userId);
                            return message.reply("Conversation reset. Ready to start fresh!");
                        }

                        this.memory.push(newUserMessage);
                        const memoryContext = this.memory.slice(-5).join(" ");
                        const newChatPrompt = `${chatRolePrompt} ${conversationContext} Recent chat context: ${memoryContext} User's latest message: "${newUserMessage}"`;

                        const newChatResponse = await axios.get(`https://api-architectdevs.onrender.com/api/blackbox-ai?prompt=${encodeURIComponent(newChatPrompt)}&maxTokens=2000`);
                        
                        if (newChatResponse.data) {
                            const newAiReply = await message.reply(newChatResponse.data);

                            global.Meta.onReply.set(userId, {
                                commandName: "meta",
                                messageId: newAiReply.id,
                                authorId: userId,
                                memory: this.memory,
                                callback: this.callback,
                            });
                        }
                    }
                });
            } else {
                message.reply("The AI did not return a valid response. Please try again.");
            }
        } catch (error) {
            console.error('API Error:', error);
            message.reply("An error occurred while communicating with the AI. Please try again later.");
        }
    }
};
