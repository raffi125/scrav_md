const config = require('../../../config');
const db = require('../../lib/database');
const { sendInteractive } = require('../../lib/interactive');

module.exports = {
    name: 'menu',
    aliases: ['help', 'list'],
    description: 'Menampilkan daftar perintah yang tersedia',
    category: 'General',
    async execute(sock, msg, args) {
        console.log('DEBUG: !menu dipanggil');
        const { from, pushName, sender } = msg;
        const jid = sender || from;
        const user = db.getUser(jid);
        console.log('DEBUG: User berhasil di-load', jid);

        // Lazy load plugins dari handler
        const handler = require('../../handler');
        const plugins = handler.plugins || {};
        console.log('DEBUG: Plugins loaded. Count:', Object.keys(plugins).length);
        
        const categories = {};
        // LOOP SEMUA PLUGIN
        for (const cmd in plugins) {
            try {
                const plugin = plugins[cmd];
                const cat = plugin.category || 'Lainnya';
                const name = plugin.name;
                const desc = plugin.description || 'Fitur ScravBot';
                
                if (!name) continue;

                if (!categories[cat]) categories[cat] = [];
                
                // Tambahkan tanda limit jika berbayar
                const limitTag = plugin.limit ? ' Ⓛ' : '';
                
                categories[cat].push({
                    header: cat.toUpperCase(),
                    title: `${config.prefix}${name}${limitTag}`,
                    description: desc,
                    id: `${config.prefix}${name}`
                });
            } catch (err) { }
        }

        let statusTxt = user.isPremium ? '🌟 Premium' : '🆓 Gratis';
        let limitTxt = user.isPremium ? 'Unlimited' : `${user.limit} / ${db.FREE_LIMIT}`;

        const bodyText = `╭─「 *${config.botName} MENU* 」\n` +
                         `│ 👤 *Halo,* ${pushName || 'User'}\n` +
                         `│ 💳 *Status:* ${statusTxt}\n` +
                         `│ 📊 *Sisa Limit:* ${limitTxt}\n` +
                         `╰──────────────────\n\n` +
                         `_Silakan pilih menu dari daftar di bawah ini._\n` +
                         `_(Tanda Ⓛ berarti memotong 1 Limit)_`;

        // Susun Sections untuk Dropdown
        const sections = [];
        for (const cat of Object.keys(categories).sort()) {
            sections.push({
                title: `⭐ ${cat.toUpperCase()}`,
                rows: categories[cat]
            });
        }

        // --- MULAI PENYUSUNAN MENU TEKS ELEGAN ---
        const botName = config.botName || 'SCRAVBOT';
        
        let menuText = `╭─「 👑 *${botName} PREMIUM* 👑 」\n`;
        menuText += `│ 👤 *User:* ${pushName || 'Bro'}\n`;
        menuText += `│ 💳 *Status:* ${statusTxt}\n`;
        menuText += `│ 📊 *Sisa Limit:* ${limitTxt}\n`;
        menuText += `╰───────────────────\n\n`;
        
        menuText += `_Ketik perintah di bawah ini untuk menggunakan bot. (Tanda Ⓛ berarti potong 1 limit)_\n\n`;

        for (const cat of Object.keys(categories).sort()) {
            menuText += `╭─「 ⭐ *${cat.toUpperCase()}* 」\n`;
            for (const item of categories[cat]) {
                menuText += `│ 🔹 ${item.title}\n`;
            }
            menuText += `╰───────────────────\n\n`;
        }

        menuText += `💡 *Tips:* Ketik *${config.prefix}buypremium* untuk mendapatkan limit unlimited!\n`;
        menuText += `👨‍💻 Hubungi owner (*${config.prefix}owner*) jika bot mengalami masalah.`;

        try {
            const fs = require('fs');
            const path = require('path');
            
            if (!this.cachedBanner) {
                const bannerPath = path.join(__dirname, '..', '..', 'assets', 'banner.png');
                if (fs.existsSync(bannerPath)) {
                    const stat = fs.statSync(bannerPath);
                    if (stat.size <= 200 * 1024) {
                        this.cachedBanner = fs.readFileSync(bannerPath);
                    } else {
                        console.log(`WARNING: banner.png terlalu besar (${(stat.size / 1024 / 1024).toFixed(1)}MB), skip thumbnail biar cepet.`);
                    }
                } else {
                    console.log('WARNING: File banner.png tidak ditemukan di folder src/assets!');
                }
            }
            
            if (this.cachedBanner) {
                await sock.sendMessage(from, { 
                    text: menuText,
                    contextInfo: {
                        externalAdReply: {
                            title: `👑 ${botName} PREMIUM 👑`,
                            body: 'Pilih menu di bawah ini',
                            thumbnail: this.cachedBanner,
                            sourceUrl: "https://github.com/itsliaaa/baileys",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: menuText }, { quoted: msg });
            }

        } catch (err) {
            console.error('DEBUG: Gagal mengirim menu:', err.message);
            await sock.sendMessage(from, { text: menuText }, { quoted: msg });
        }
    }
};
