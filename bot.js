// bot.js
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const TOKEN = "8478383950:AAHRk0cBoVd3rFSB6om9etikuVe1GkJD-Ps";   // ← Yahan token daalo
const ADMIN_ID = 7968968395;                    // ← Tumhara ID

const bot = new TelegramBot(TOKEN, { polling: true });

console.log("🤖 Telegram Bot + Mini App Started...");

// Load allowed users
const USERS_FILE = path.join(__dirname, 'user.json');
let allowedUsers = ["7968968395"];

if (fs.existsSync(USERS_FILE)) {
    try {
        const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        allowedUsers = data.allowedUsers || allowedUsers;
    } catch (e) {}
}

function saveUsers() {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ allowedUsers }, null, 2));
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text || '';

    if (text === '/start') {
        const isAllowed = allowedUsers.includes(String(userId));

        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: isAllowed ? "🚀 Open Report Tool" : "🔒 Request Access",
                        web_app: { url: "" } // ← Yahan apna domain daal dena
                    }]
                ]
            }
        };

        bot.sendMessage(chatId, 
            `👋 Welcome to *PAID ASSASSIN*\n\n` +
            `Status: ${isAllowed ? '✅ Authorized' : '❌ Not Authorized'}\n\n` +
            `Admin se contact karo access ke liye.`, 
            { parse_mode: "Markdown", ...opts }
        );
    }

    // Admin Commands
    if (userId === ADMIN_ID) {
        if (text.startsWith('/add ')) {
            const target = text.split(' ')[1];
            if (!target) return bot.sendMessage(chatId, "Usage: /add <userid>");
            
            const upper = target.trim().toUpperCase();
            if (!allowedUsers.includes(upper)) {
                allowedUsers.push(upper);
                saveUsers();
                bot.sendMessage(chatId, `✅ User ${upper} added!`);
            }
        }

        if (text.startsWith('/remove ')) {
            const target = text.split(' ')[1];
            if (target == ADMIN_ID) return bot.sendMessage(chatId, "Cannot remove admin!");
            allowedUsers = allowedUsers.filter(id => id !== target.toUpperCase());
            saveUsers();
            bot.sendMessage(chatId, `✅ User ${target} removed.`);
        }

        if (text === '/users') {
            bot.sendMessage(chatId, `📋 Allowed Users:\n${allowedUsers.join('\n')}`);
        }
    }
});

module.exports = bot;
