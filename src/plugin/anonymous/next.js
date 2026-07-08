const session = require('../../lib/session');

module.exports = {
    name: 'next',
    aliases: ['skip', 'ganti'],
    category: 'Anonymous',
    description: 'Mencari teman ngobrol baru secara acak',
    async execute(sock, msg, args) {
        const { from, sender } = msg;
        const jid = sender || from;
        
        // Cek apakah sedang ngobrol
        const partner = session.anonymous.chat[jid];

        if (partner) {
            // Putuskan koneksi yang lama
            delete session.anonymous.chat[jid];
            delete session.anonymous.chat[partner];
            await sock.sendMessage(partner, { text: '🛑 Pasangan Anda telah mengakhiri obrolan dan mencari teman baru.' });
        } else if (session.anonymous.waiting === jid) {
            await sock.sendMessage(from, { text: '⏳ Anda masih dalam antrean pencarian...' }, { quoted: msg });
            return;
        }

        // Jalankan logika search kembali
        if (session.anonymous.waiting) {
            const newPartner = session.anonymous.waiting;
            session.anonymous.waiting = null;

            session.anonymous.chat[jid] = newPartner;
            session.anonymous.chat[newPartner] = jid;

            await sock.sendMessage(jid, { text: `✅ *TERHUBUNG!*\nAnda telah terhubung dengan teman baru. Semua chat akan diteruskan.\n\nKetik *!leave* untuk berhenti.` });
            await sock.sendMessage(newPartner, { text: `✅ *TERHUBUNG!*\nSeseorang telah terhubung dengan Anda secara acak. Semua chat akan diteruskan.\n\nKetik *!leave* untuk berhenti.` });
        } else {
            session.anonymous.waiting = jid;
            await sock.sendMessage(jid, { text: `⏳ *MENCARI TEMAN BARU...*\nMohon tunggu dalam antrean.` });
        }
    }
};
