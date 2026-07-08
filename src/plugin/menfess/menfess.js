const session = require('../../lib/session');

module.exports = {
    name: 'menfess',
    aliases: ['confess', 'curhat'],
    category: 'Menfess',
    description: 'Mengirim pesan rahasia secara anonim',
    async execute(sock, msg, args) {
        const { from, sender } = msg;
        const isGroup = from.endsWith('@g.us');
        const jid = sender || from;
        
        if (isGroup) {
            await sock.sendMessage(from, { text: `❌ Fitur Menfess (Pesan Rahasia) hanya boleh dilakukan lewat Private Chat agar identitas Anda aman!` }, { quoted: msg });
            return;
        }

        if (args.length < 2) {
            await sock.sendMessage(from, { text: `❌ Format salah.\nContoh: *!menfess 628xxx Halo, ini dari pengagum rahasiamu.*` }, { quoted: msg });
            return;
        }

        const targetNumber = args[0].replace(/[^0-9]/g, '');
        const pesan = args.slice(1).join(' ');

        if (!targetNumber) {
            await sock.sendMessage(from, { text: '❌ Nomor tujuan tidak valid.' }, { quoted: msg });
            return;
        }

        const targetJid = targetNumber + '@s.whatsapp.net';

        if (targetJid === jid) {
            await sock.sendMessage(from, { text: '❌ Tidak bisa mengirim pesan rahasia ke diri sendiri.' }, { quoted: msg });
            return;
        }

        if (session.menfess[targetJid]) {
            await sock.sendMessage(from, { text: '⏳ Target sedang dalam sesi Menfess dengan orang lain. Coba lagi nanti.' }, { quoted: msg });
            return;
        }

        // Buka sesi Menfess
        session.menfess[targetJid] = jid;
        session.menfess[jid] = targetJid;

        const teksTarget = `💌 *ADA PESAN RAHASIA UNTUKMU!*\n\n` +
                           `" ${pesan} "\n\n` +
                           `_Balas pesan ini (ketik langsung tanpa awalan ! ) untuk membalas ke pengirim aslinya secara rahasia._\n` +
                           `_Atau ketik *!stopmenfess* untuk menutup jalur ini._`;

        try {
            await sock.sendMessage(targetJid, { text: teksTarget });
            await sock.sendMessage(from, { text: `✅ *PESAN TERKIRIM!* Pesan rahasia Anda telah sampai ke target.\n\n_Jika target membalas, pesan balasan akan dikirim ke sini._\n_Ketik *!stopmenfess* untuk berhenti._` });
        } catch (err) {
            await sock.sendMessage(from, { text: `❌ Gagal mengirim pesan. Pastikan target memiliki WhatsApp dan pernah dichat oleh bot ini.` });
            delete session.menfess[targetJid];
            delete session.menfess[jid];
        }
    }
};
