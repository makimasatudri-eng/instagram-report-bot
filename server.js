// server.js - Final Combined Version
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const TOKEN = process.env.TELEGRAM_TOKEN;
const ADMIN_ID = 7145835109;

if (!TOKEN) {
    console.error("❌ TELEGRAM_TOKEN environment variable is required!");
    process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// User management
const USERS_FILE = path.join(__dirname, 'user.json');
let allowedUsers = ["7968968395"];

if (fs.existsSync(USERS_FILE)) {
    try {
        const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        allowedUsers = data.allowedUsers || allowedUsers;
    } catch (e) {
        console.log("Error loading users:", e.message);
    }
}

function saveUsers() {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ allowedUsers }, null, 2));
}

// ===================== TELEGRAM BOT =====================
console.log("🤖 Telegram Bot + Mini App Started...");

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from.id);
    const text = msg.text || '';

    if (text === '/start') {
        const isAllowed = allowedUsers.includes(userId);
        const webAppUrl = process.env.WEB_APP_URL;

        if (!webAppUrl) {
            return bot.sendMessage(chatId, "❌ WEB_APP_URL not configured on Railway!");
        }

        const buttonText = isAllowed ? "🚀 Open Report Tool" : "🔒 Request Access";
        const statusText = isAllowed ? "✅ Authorized" : "❌ Not Authorized";

        const opts = {
            reply_markup: {
                inline_keyboard: [[{
                    text: buttonText,
                    web_app: { url: webAppUrl }
                }]]
            }
        };

        bot.sendMessage(chatId,
            `👋 Welcome to *PAID ASSASSIN*\n\n` +
            `Status: ${statusText}\n\n` +
            `Your ID: \`${userId}\`\n\n` +
            `${isAllowed ? 'Report Tool khol sakte ho ✅' : 'Access ke liye Admin se contact karo!'}`,
            { parse_mode: "Markdown", ...opts }
        );
    }

    // Admin Commands
    if (String(msg.from.id) === String(ADMIN_ID)) {
        if (text.startsWith('/add ')) {
            const target = text.split(' ')[1];
            if (!target) return bot.sendMessage(chatId, "Usage: /add <userid>");
           
            const upper = target.trim().toUpperCase();
            if (!allowedUsers.includes(upper)) {
                allowedUsers.push(upper);
                saveUsers();
                bot.sendMessage(chatId, `✅ User ${upper} added!`);
            } else {
                bot.sendMessage(chatId, `⚠️ User already exists!`);
            }
        }
        
        if (text.startsWith('/remove ')) {
            const target = text.split(' ')[1];
            if (!target) return bot.sendMessage(chatId, "Usage: /remove <userid>");
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

// ===================== EXPRESS ROUTES =====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/check-username', async (req, res) => {
    let { username } = req.body;
    if (!username) return res.json({ exists: false });
    
    username = username.trim().toLowerCase().replace('@', '');
    console.log(`Checking: ${username}`);

    try {
        const device = uuidv4();
        const family = uuidv4();
        const android = "android-" + Math.random().toString(36).substring(2, 12);
        
        const payload = {
            params: `{"client_input_params":{"aac":"{\\"aac_init_timestamp\\":${Math.floor(Date.now()/1000)},\\"aacjid\\":\\"${uuidv4()}\\",\\"aaccs\\":\\"${Math.random().toString(36).substring(2,40)}\\"}","search_query":"${username}","search_screen_type":"email_or_username","ig_android_qe_device_id":"${device}"},"server_params":{"event_request_id":"${uuidv4()}","device_id":"${android}","family_device_id":"${family}","qe_device_id":"${device}"}}`,
            bk_client_context: '{"bloks_version":"5e47baf35c5a270b44c8906c8b99063564b30ef69779f3dee0b828bee2e4ef5b","styles_id":"instagram"}',
            bloks_versioning_id: "5e47baf35c5a270b44c8906c8b99063564b30ef69779f3dee0b828bee2e4ef5b"
        };

        const headers = {
            'User-Agent': "Instagram 370.1.0.43.96 Android (34/14; 450dpi;1080x2207;samsung;SM-A235F;a23;qcom;en_IN;704872281)",
            'accept-language': 'en-IN,en-US',
            'x-ig-app-id': '567067343352427',
            'x-ig-device-id': device,
            'x-ig-family-device-id': family,
            'x-ig-android-id': android,
            'x-mid': Buffer.from(Math.random().toString(36).substring(2,20)).toString('base64').replace(/=/g,'')
        };

        const response = await axios.post(
            "https://i.instagram.com/api/v1/bloks/async_action/com.bloks.www.caa.ar.search.async/",
            payload, { headers, timeout: 15000 }
        );

        const text = response.data.toString().toLowerCase();
        if (text.includes(`"${username}"`) && !text.includes('"not_found"') && !text.includes('no_results')) {
            return res.json({ exists: true, username });
        }
    } catch (error) {
        console.log("Error:", error.message);
    }

    // Fallback
    try {
        const { data } = await axios.get(`https://www.instagram.com/${username}/`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000
        });
        if (data.includes(`"username":"${username}"`)) {
            return res.json({ exists: true, username });
        }
    } catch (e) {}

    res.json({ exists: false });
});

app.post('/api/login', (req, res) => {
    const { userId } = req.body;
    const success = allowedUsers.includes(String(userId).toUpperCase());
    res.json({ success });
});

app.get('/api/users', (req, res) => res.json({ allowedUsers }));
app.get('/api/allowed-users', (req, res) => res.json({ allowedUsers }));

app.post('/api/add-user', (req, res) => {
    const { userId, adminId } = req.body;
    if (adminId !== "7968968395") return res.json({ success: false });
    const upperId = String(userId).trim().toUpperCase();
    if (!allowedUsers.includes(upperId)) {
        allowedUsers.push(upperId);
        saveUsers();
    }
    res.json({ success: true, allowedUsers });
});

app.post('/api/remove-user', (req, res) => {
    const { userId, adminId } = req.body;
    if (adminId !== "7968968395" || userId === "7968968395") return res.json({ success: false });
    allowedUsers = allowedUsers.filter(id => id !== userId);
    saveUsers();
    res.json({ success: true, allowedUsers });
});

// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
