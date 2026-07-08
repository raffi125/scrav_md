const session = require('../../lib/session');

module.exports = {
    name: 'leave',
    aliases: ['stop', 'berhenti'],
    category: 'Anonymous',
    description: 'Berhenti ngobrol dengan pasangan anonim',
    async execute(sock, msg, args) {
        const { from, sender } = msg;
        const jid = sender || from;
        
        // Hapus antrean jika sedang mencari
        if (session.anonymous.waiting === jid) {
            session.anonymous.waiting = null;
            await sock.sendMessage(from, { text: '✅ Pencarian dibatalkan.' }, { quoted: msg });
            return;
        }

        const partner = session.anonymous.chat[jid];

        if (!partner) {
            await sock.sendMessage(from, { text: '❌ Anda sedang tidak ngobrol dengan siapapun.' }, { quoted: msg });
            return;
        }

        // Putus koneksi
        delete session.anonymous.chat[jid];
        delete session.anonymous.chat[partner];

        await sock.sendMessage(jid, { text: '🛑 Anda telah mengakhiri obrolan.' });
        await sock.sendMessage(partner, { text: '🛑 Pasangan Anda telah mengakhiri obrolan.' });
    }
};
