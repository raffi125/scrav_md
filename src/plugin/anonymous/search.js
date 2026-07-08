const session = require('../../lib/session');

module.exports = {
    name: 'search',
    aliases: ['cari', 'start'],
    category: 'Anonymous',
    description: 'Mencari teman ngobrol secara anonim (WAJIB di Grup)',
    async execute(sock, msg, args) {
        const { from, sender, pushName } = msg;
        const isGroup = from.endsWith('@g.us');
        const jid = sender || from;
        
        // Strategi Viral: Paksa add ke grup
        if (!isGroup) {
            await sock.sendMessage(from, { text: `❌ *AKSES DITOLAK*\n\nFitur pencarian teman anonim tidak bisa dimulai dari Private Chat!\n\n💡 *Trik:* Buatlah Grup WhatsApp baru, tambahkan bot ini ke dalam grup Anda, lalu ketik *!search* di dalam grup tersebut. Obrolan nantinya akan tetap dialihkan ke Private Chat Anda secara rahasia.` }, { quoted: msg });
            return;
        }

        if (session.anonymous.chat[jid]) {
            await sock.sendMessage(from, { text: '❌ Anda masih terhubung dengan seseorang! Ketik *!leave* di chat pribadi bot untuk keluar.' }, { quoted: msg });
            return;
        }

        if (session.anonymous.waiting === jid) {
            await sock.sendMessage(from, { text: '⏳ Anda masih dalam antrean pencarian...' }, { quoted: msg });
            return;
        }

        // Jika ada yang sedang menunggu
        if (session.anonymous.waiting) {
            const partner = session.anonymous.waiting;
            session.anonymous.waiting = null;

            // Hubungkan
            session.anonymous.chat[jid] = partner;
            session.anonymous.chat[partner] = jid;

            await sock.sendMessage(from, { text: `@${jid.split('@')[0]} ✅ Silakan cek Private Chat (Japri) bot ini, Anda sudah menemukan pasangan!`, mentions: [jid] }, { quoted: msg });

            // Kirim notif ke PC masing-masing
            await sock.sendMessage(jid, { text: `✅ *TERHUBUNG!*\nAnda telah terhubung dengan seseorang secara acak. Semua chat yang Anda kirim ke sini akan diteruskan.\n\nKetik *!leave* untuk berhenti.` });
            await sock.sendMessage(partner, { text: `✅ *TERHUBUNG!*\nSeseorang telah terhubung dengan Anda secara acak. Semua chat yang Anda kirim ke sini akan diteruskan.\n\nKetik *!leave* untuk berhenti.` });
        } else {
            // Masukkan ke antrean
            session.anonymous.waiting = jid;
            await sock.sendMessage(from, { text: `@${jid.split('@')[0]} ⏳ Mencari pasangan...\nMohon tunggu, kami akan mengirimkan notifikasi ke Private Chat Anda jika ada yang terhubung.`, mentions: [jid] }, { quoted: msg });
            await sock.sendMessage(jid, { text: `⏳ Anda sedang dalam antrean pencarian. Mohon tunggu...` });
        }
    }
};
