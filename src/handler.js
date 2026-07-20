const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { serialize } = require('./lib/serialize');
const { customLogger } = require('./lib/logger');
const config = require('../config');
const db = require('./lib/database');

// ============================================================
// 🚨 SISTEM LAPORAN ERROR TERPUSAT
// ============================================================

/**
 * Mendeteksi tipe error berdasarkan message, code, dan name.
 * @returns {{ emoji: string, label: string, severity: string }}
 */
function detectErrorType(err) {
    const msg = (err.message || '').toLowerCase();
    const code = err.code || '';
    const name = err.name || '';

    // --- NETWORK & KONEKSI ---
    if (code === 'ECONNRESET' || msg.includes('econnreset')) return { emoji: '🔌', label: 'Koneksi Terputus (ECONNRESET)', severity: '🔴 KRITIS' };
    if (code === 'ENOTFOUND' || msg.includes('enotfound')) return { emoji: '🌐', label: 'DNS / Host Tidak Ditemukan', severity: '🔴 KRITIS' };
    if (code === 'ETIMEDOUT' || msg.includes('etimedout')) return { emoji: '⏱️', label: 'Koneksi Timeout (ETIMEDOUT)', severity: '🟠 TINGGI' };
    if (code === 'ECONNREFUSED' || msg.includes('econnrefused')) return { emoji: '🚫', label: 'Koneksi Ditolak (ECONNREFUSED)', severity: '🟠 TINGGI' };
    if (msg.includes('timeout') || msg.includes('timed out')) return { emoji: '⏰', label: 'Request Timeout', severity: '🟠 TINGGI' };
    if (msg.includes('fetch') || msg.includes('network')) return { emoji: '📡', label: 'Gagal Fetch / Network Error', severity: '🟠 TINGGI' };
    if (msg.includes('socket hang up') || msg.includes('socket')) return { emoji: '🔗', label: 'Socket Hang Up', severity: '🟠 TINGGI' };

    // --- API EKSTERNAL ---
    if (msg.includes('rate limit') || msg.includes('too many request')) return { emoji: '🚦', label: 'Rate Limit API (429)', severity: '🟡 SEDANG' };
    if (msg.includes('api') && (msg.includes('invalid') || msg.includes('key') || msg.includes('token'))) return { emoji: '🔑', label: 'API Key Tidak Valid', severity: '🔴 KRITIS' };
    if (msg.includes('api') || msg.includes('status 5') || msg.includes('500') || msg.includes('502') || msg.includes('503')) return { emoji: '🌩️', label: 'Server API Error (5xx)', severity: '🟠 TINGGI' };
    if (msg.includes('401') || msg.includes('403') || msg.includes('unauthorized') || msg.includes('forbidden')) return { emoji: '🔒', label: 'Akses Ditolak (401/403)', severity: '🔴 KRITIS' };
    if (msg.includes('404') || msg.includes('not found')) return { emoji: '🔍', label: 'Resource Tidak Ditemukan (404)', severity: '🟡 SEDANG' };

    // --- FILE & SISTEM ---
    if (code === 'ENOENT' || msg.includes('no such file')) return { emoji: '📁', label: 'File Tidak Ditemukan (ENOENT)', severity: '🟡 SEDANG' };
    if (code === 'EACCES' || msg.includes('permission denied')) return { emoji: '🚷', label: 'Izin Akses Ditolak (EACCES)', severity: '🔴 KRITIS' };
    if (code === 'ENOSPC' || msg.includes('no space')) return { emoji: '💾', label: 'Disk Penuh (ENOSPC)', severity: '🔴 KRITIS' };
    if (msg.includes('out of memory') || msg.includes('heap')) return { emoji: '🧠', label: 'Kehabisan Memori (OOM)', severity: '🔴 KRITIS' };

    // --- JAVASCRIPT & RUNTIME ---
    if (name === 'SyntaxError' || msg.includes('syntax')) return { emoji: '📝', label: 'Syntax Error', severity: '🔴 KRITIS' };
    if (name === 'TypeError' || msg.includes('is not a function') || msg.includes('cannot read') || msg.includes('undefined')) return { emoji: '🔧', label: 'Type Error (TypeError)', severity: '🟠 TINGGI' };
    if (name === 'RangeError' || msg.includes('maximum call') || msg.includes('invalid array length')) return { emoji: '📏', label: 'Range Error', severity: '🟠 TINGGI' };
    if (name === 'ReferenceError' || msg.includes('is not defined')) return { emoji: '❓', label: 'Reference Error', severity: '🟠 TINGGI' };

    // --- DOWNLOADER ---
    if (msg.includes('tiktok') || msg.includes('tt')) return { emoji: '🎵', label: 'Gagal Download TikTok', severity: '🟡 SEDANG' };
    if (msg.includes('instagram') || msg.includes('ig')) return { emoji: '📸', label: 'Gagal Download Instagram', severity: '🟡 SEDANG' };
    if (msg.includes('youtube') || msg.includes('yt')) return { emoji: '▶️', label: 'Gagal Download YouTube', severity: '🟡 SEDANG' };

    // --- WHATSAPP / BAILEYS ---
    if (msg.includes('not-authorized') || msg.includes('logged out')) return { emoji: '📵', label: 'Sesi WA Expired / Logout', severity: '🔴 KRITIS' };
    if (msg.includes('stanza') || msg.includes('stream') || msg.includes('connection')) return { emoji: '📲', label: 'Error Koneksi WhatsApp', severity: '🔴 KRITIS' };
    if (msg.includes('broadcast') || msg.includes('group')) return { emoji: '👥', label: 'Error Operasi Grup', severity: '🟡 SEDANG' };

    // --- DEFAULT ---
    return { emoji: '⚠️', label: 'Error Tidak Diketahui', severity: '🟡 SEDANG' };
}

/**
 * Membangun teks laporan error lengkap untuk dikirim ke owner.
 */
function buildErrorReport({ err, command, args, prefix, jid, pushName, isGroup, from, context = 'PLUGIN' }) {
    const { emoji, label, severity } = detectErrorType(err);
    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false });

    // Potong stack trace menjadi 3 baris teratas saja
    const stackLines = (err.stack || '').split('\n').slice(0, 4).join('\n');

    return (
        `🚨 *[${context}] ERROR TERTANGKAP* 🚨\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${emoji} *Tipe Error:* ${label}\n` +
        `📊 *Severity:* ${severity}\n` +
        `🕐 *Waktu:* ${timestamp}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *User:* ${pushName || 'Unknown'}\n` +
        `📱 *Nomor:* ${db.getPhone(jid || '')}\n` +
        `👥 *Grup:* ${isGroup ? 'Ya' : 'Tidak'}\n` +
        `⌨️ *Command:* ${prefix}${command}${args && args.length ? ' ' + args.join(' ') : ''}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💬 *Pesan Error:*\n${err.message || '-'}\n\n` +
        `🗂️ *Stack Trace (3 baris):*\n\`\`\`\n${stackLines || 'Tidak tersedia'}\n\`\`\`\n\n` +
        `_Laporan otomatis oleh ${config.botName}. Periksa log server untuk detail lengkap._`
    );
}

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
        const jid = sender || from;

        // --- ALBUM / MEDIA CACHE SYSTEM ---
        if (!global.mediaCache) global.mediaCache = {};
        const now = Date.now();
        // Bersihkan cache yang usianya lebih dari 15 detik
        global.mediaCache[jid] = (global.mediaCache[jid] || []).filter(x => now - x.time < 15000);

        // Simpan setiap pesan gambar/dokumen ke array cache (untuk deteksi Album otomatis)
        if (msg.type === 'imageMessage' || msg.type === 'documentMessage') {
            global.mediaCache[jid].push({ msg: msg, type: msg.type, time: now });
        }

        // Log pesan masuk di console
        if (body) {
            const phone = db.getPhone(sender || from);
            const userStr = chalk.greenBright(pushName || 'Unknown');
            const phoneStr = chalk.yellow(`[${phone}]`);
            const msgStr = chalk.cyanBright(body);
            console.log(`💬 ${phoneStr} ${userStr} : ${msgStr}`);
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
        // Khusus: jika user hanya mengetik titik tunggal "." (sama persis dengan prefix),
        // jangan anggap sebagai command — langsung balas sebagai auto-respon.
        if (body && body.trim() === prefix) {
            console.log(`[DEBUG] Titik terdeteksi dari ${sender || from}, mengirim auto-respon...`);
            setTimeout(async () => {
                try {
                    await sock.sendMessage(from, { text: 'Titik adalah awal dari segalanya. Ketik *.menu* untuk memulai keajaiban! \u2728\ud83d\ude0e' }, { quoted: msg });
                    console.log(`[DEBUG] Auto-respon titik berhasil dikirim ke ${from}`);
                } catch (err) {
                    console.error(`[DEBUG] GAGAL kirim auto-respon titik: ${err.message}`);
                }
            }, 1000);
            return;
        }
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);

        //const jid = sender || from;
        const session = require('./lib/session');

        // --- INTERCEPT PESAN BIASA UNTUK CHAT RAHASIA & SESI ---
        if (!isCmd) {
            // Jika dalam sesi topdf
            if (session.topdf && session.topdf[jid]) {
                if (plugins['topdf'] && typeof plugins['topdf'].handleSession === 'function') {
                    await plugins['topdf'].handleSession(sock, msg, session.topdf[jid]);
                    return;
                }
            }

            // Jika dalam sesi mergepdf
            if (session.mergepdf && session.mergepdf[jid]) {
                if (plugins['mergepdf'] && typeof plugins['mergepdf'].handleSession === 'function') {
                    await plugins['mergepdf'].handleSession(sock, msg, session.mergepdf[jid]);
                    return;
                }
            }

            if (body) {
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
                            } catch (err) { }
                        }, 1000);

                        if (textLower === '.') return; // Hentikan proses routing command jika hanya ngetik titik
                    }
                }
            } // Penutup if (body)
        } // Penutup if (!isCmd)

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

        // --- CEK OWNER ---
        const isOwner = msg.isFromMe || await db.isOwnerAsync(jid, sock);

        if (activePlugin) {
            // Cek apakah plugin ini membutuhkan limit
            if (activePlugin.limit && !isOwner) {
                // Sender format: 628xxx@s.whatsapp.net
                const canExecute = db.deductLimit(jid);

                if (!canExecute) {
                    console.log(`[DEBUG-LIMIT] User gagal limit. JID asli: ${jid} | Di config.ownerNumber: ${config.ownerNumber}`);
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

                // 1. Beri tahu user
                const { label } = detectErrorType(pluginError);
                await sock.sendMessage(from, {
                    text: `❌ *Terjadi Kesalahan!*\n\n` +
                        `Jenis: *${label}*\n` +
                        `Perintah: *${prefix}${command}*\n\n` +
                        `Laporan otomatis telah dikirim ke owner. Mohon tunggu perbaikan. 🙏`
                }, { quoted: msg });

                // 2. Kirim laporan lengkap ke Owner
                try {
                    const ownerJid = config.ownerNumber + '@s.whatsapp.net';
                    const report = buildErrorReport({
                        err: pluginError,
                        command,
                        args,
                        prefix,
                        jid,
                        pushName,
                        isGroup,
                        from,
                        context: 'PLUGIN'
                    });
                    await sock.sendMessage(ownerJid, { text: report });
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
        // Laporkan error handler-level ke owner juga
        try {
            const ownerJid = config.ownerNumber + '@s.whatsapp.net';
            const report = buildErrorReport({
                err: error,
                command: '(handler-level)',
                args: [],
                prefix: config.prefix,
                jid: '',
                pushName: 'System',
                isGroup: false,
                from: '',
                context: 'HANDLER'
            });
            await sock.sendMessage(ownerJid, { text: report });
        } catch (_) { /* silent */ }
    }
}

module.exports = { messageHandler, loadPlugins, plugins };
