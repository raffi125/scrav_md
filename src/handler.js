const fs = require('fs');
const path = require('path');
const { serialize } = require('./lib/serialize');
const { customLogger } = require('./lib/logger');
const config = require('../config');
const db = require('./lib/database');

// Memuat semua plugin dari folder src/plugin
const pluginDir = path.join(__dirname, 'plugin');
const plugins = {};

function loadPlugins() {
    if (!fs.existsSync(pluginDir)) return;

    // Fungsi rekursif untuk mencari file .js
    function getFiles(dir) {
        let results = [];
        const list = fs.readdirSync(dir);
        for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(getFiles(filePath));
            } else if (file.endsWith('.js')) {
                results.push(filePath);
            }
        }
        return results;
    }

    const files = getFiles(pluginDir);
    
    let loadedCount = 0;
    for (const file of files) {
        const commandName = path.basename(file, '.js');
        try {
            // Hapus cache agar bisa live reload plugin
            delete require.cache[require.resolve(file)];
            plugins[commandName] = require(file);
            loadedCount++;
        } catch (error) {
            customLogger.error(`Gagal memuat plugin ${path.basename(file)}: ${error.message}`);
        }
    }
    
    if (loadedCount > 0) {
        customLogger.plugin(`Berhasil memuat total ${loadedCount} plugin`);
    }
}

// Muat plugin saat pertama kali start
loadPlugins();

/**
 * Handler utama untuk memproses pesan masuk dari WhatsApp.
 */
async function messageHandler(sock, rawMsg) {
    try {
        // Serialisasi pesan agar lebih mudah diakses dan ditambahkan helper
        const msg = serialize(rawMsg, sock);
        if (!msg.type) return; // Abaikan jika tidak valid

        const { from, body, sender, pushName } = msg;

        // Log pesan masuk di console dengan format JSON
        if (body) {
            const logData = {
                user: pushName || 'Unknown',
                telepon: (sender || from).split('@')[0],
                message: body
            };
            console.log(JSON.stringify(logData));
        }

        // --- SATPAM GRUP (ANTI-VIRTEX & ANTI-LINK) ---
        const isGroup = from.endsWith('@g.us');
        let isAdmins = false;
        
        if (isGroup) {
            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants;
                const adminList = participants.filter(p => p.admin !== null).map(p => p.id);
                isAdmins = adminList.includes(sender || from);
            } catch (err) {
                // Abaikan error jika metadata gagal diambil
            }
            
            // ANTI-VIRTEX
            if (body && body.length > 5000 && !isAdmins) {
                console.log(`[SATPAM] Menendang pengirim VIRTEX: ${sender}`);
                await sock.sendMessage(from, { delete: msg.key }); // Hapus pesan
                await sock.groupParticipantsUpdate(from, [sender], 'remove'); // Kick
                return;
            }

            // ANTI-LINK GRUP WA
            if (body && body.match(/chat\.whatsapp\.com/i) && !isAdmins) {
                console.log(`[SATPAM] Menendang penyebar Link WA: ${sender}`);
                await sock.sendMessage(from, { delete: msg.key }); // Hapus pesan
                await sock.groupParticipantsUpdate(from, [sender], 'remove'); // Kick
                return;
            }
        }

        // --- COMMAND ROUTING ---
        const prefix = config.prefix;
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);
        
        const jid = sender || from;
        const session = require('./lib/session');

        // --- INTERCEPT PESAN BIASA UNTUK CHAT RAHASIA ---
        if (!isCmd && body) {
            // Jika dalam sesi Menfess
            if (session.menfess[jid]) {
                const partner = session.menfess[jid];
                await sock.sendMessage(partner, { text: `💌 *Pesan Masuk:*\n\n${body}` });
                return; // Berhenti agar tidak diproses sebagai command
            }
            
            // Jika dalam sesi Anonymous Chat
            if (session.anonymous.chat[jid]) {
                const partner = session.anonymous.chat[jid];
                await sock.sendMessage(partner, { text: `👤 *Stranger:*\n${body}` });
                return; // Berhenti
            }

            // --- AUTO-DOWNLOADER (TIKTOK, IG, YOUTUBE) ---
            const tiktokRegex = /https?:\/\/(?:www\.|vt\.|vm\.)?tiktok\.com\/[^\s]+/i;
            const igRegex = /https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[^\s]+/i;
            const ytRegex = /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[^\s]+/i;

            let dlUrl = null;
            let dlPluginName = null;

            if (tiktokRegex.test(body)) {
                dlUrl = body.match(tiktokRegex)[0];
                dlPluginName = 'tiktok';
            } else if (igRegex.test(body)) {
                dlUrl = body.match(igRegex)[0];
                dlPluginName = 'ig';
            } else if (ytRegex.test(body)) {
                dlUrl = body.match(ytRegex)[0];
                dlPluginName = 'yt';
            }

            if (dlUrl && plugins[dlPluginName]) {
                // Potong limit secara silent (tanpa ngomel kalau habis)
                const canExecute = db.deductLimit(jid);
                if (canExecute) {
                    console.log(`[AUTO-DL] Mendownload ${dlPluginName} dari link: ${dlUrl}`);
                    // Kita bisa menandakan pesan sedang di-react agar user tahu bot sedang bekerja
                    await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });
                    // Eksekusi plugin aslinya dengan menyisipkan URL ke dalam args
                    try {
                        await plugins[dlPluginName].execute(sock, msg, [dlUrl]);
                    } catch (err) {
                        console.error(`[AUTO-DL] Error: ${err.message}`);
                    }
                } else {
                    console.log(`[AUTO-DL] Batal mendownload karena Limit JID ${jid} habis.`);
                }
            }

            // --- AUTO-RESPON TEKS SEDERHANA (TANPA AI) ---
            const textLower = body.toLowerCase().trim();
            
            // Izinkan auto-respon memproses titik (.) meskipun diawali dengan prefix command
            if ((!isCmd || textLower === '.') && !dlUrl) {
                
                // Kumpulan kata kunci dan balasannya
                const autoResponses = {
                    '.': 'Titik adalah awal dari segalanya. Ketik *!menu* untuk memulai keajaiban! ✨😎',
                    'p': 'Uy, kenapa tuh? Ketik *!menu* untuk lihat fitur bot ya.',
                    'halo': 'Halo juga kak! Ketik *!menu* untuk mulai.',
                    'bot': 'Dalem kak, ada yang bisa dibantu? Ketik *!menu* ya.',
                    'assalamualaikum': 'Waalaikumsalam wr. wb. 🙏',
                    'pagi': 'Pagi juga kak! Semangat jalani hari ini! 🔥',
                    'siang': 'Siang kak! Jangan lupa makan ya. 🍽️',
                    'sore': 'Sore kak! Waktunya santai sebentar. ☕',
                    'malam': 'Malam juga! Jangan lupa istirahat ya. 😴',
                    'test': 'Bot aktif kak! Ketik *!menu* untuk menggunakan fitur.',
                    'tes': 'Bot aktif kak! Ketik *!menu* untuk menggunakan fitur.'
                };

                // Jika pesan cocok persis dengan kata kunci
                if (autoResponses[textLower]) {
                    // Balas dengan jeda 1 detik agar natural
                    setTimeout(async () => {
                        try {
                            await sock.sendMessage(from, { text: autoResponses[textLower] }, { quoted: msg });
                        } catch (err) {}
                    }, 1000);
                    
                    if (textLower === '.') return; // Hentikan proses routing command jika hanya ngetik titik
                }
            }
        }

        if (!isCmd) return; // Hanya merespons command ber-prefix

        // --- ANTI-SPAM & BANNED SYSTEM ---
        const isBanned = db.handleAntiSpam(jid);
        if (isBanned) {
            // Abaikan total pengguna yang dibanned
            return;
        }

        // Cek apakah plugin/command tersebut ada, atau merupakan alias
        let activePlugin = plugins[command];
        
        if (!activePlugin) {
            // Cari dari daftar alias
            for (const key in plugins) {
                if (plugins[key].aliases && plugins[key].aliases.includes(command)) {
                    activePlugin = plugins[key];
                    break;
                }
            }
        }

        if (activePlugin) {
            // Cek apakah plugin ini membutuhkan limit
            if (activePlugin.limit) {
                // Sender format: 628xxx@s.whatsapp.net
                const jid = sender || from;
                const canExecute = db.deductLimit(jid);
                
                if (!canExecute) {
                    await sock.sendMessage(from, { 
                        text: '❌ *LIMIT HABIS*\n\nLimit harian Anda sudah habis. Silakan tunggu reset besok jam 00:00, atau ketik *!buypremium* untuk membeli akses tanpa batas (LIFETIME tersedia)!'
                    }, { quoted: msg });
                    return;
                }
            }
            
            try {
                await activePlugin.execute(sock, msg, args);
            } catch (pluginError) {
                console.error(`[PLUGIN ERROR] ${command}:`, pluginError);
                
                // 1. Beri tahu user yang mengalami error
                await sock.sendMessage(from, { text: '❌ Terjadi kesalahan internal pada fitur ini. Laporan sistem telah dikirimkan ke Owner/Developer agar segera diperbaiki.' }, { quoted: msg });
                
                // 2. Kirim laporan detail (Panic Button) ke Owner
                try {
                    const ownerJid = config.ownerNumber + "@s.whatsapp.net";
                    const errorReport = `🚨 *SISTEM ERROR TERTANGKAP* 🚨\n\n` +
                                        `*User:* ${pushName || 'Unknown'} (${jid.split('@')[0]})\n` +
                                        `*Grup:* ${isGroup ? 'Ya' : 'Tidak'}\n` +
                                        `*Command:* ${prefix}${command} ${args.join(' ')}\n\n` +
                                        `*Pesan Error:*\n${pluginError.message}\n\n` +
                                        `_Laporan dikirim otomatis oleh ScravBot. Mohon segera periksa log server._`;
                    
                    await sock.sendMessage(ownerJid, { text: errorReport });
                } catch (reportErr) {
                    console.error('[REPORT ERROR] Gagal mengirim laporan ke owner:', reportErr.message);
                }
            }
        } else {
            // Command tidak dikenali
            // await sock.sendMessage(from, { text: 'Perintah tidak dikenali. Ketik !menu untuk bantuan.' }, { quoted: msg });
        }

    } catch (error) {
        customLogger.error(`Terjadi kesalahan pada handler: ${error.message}`);
    }
}

module.exports = { messageHandler, loadPlugins, plugins };
