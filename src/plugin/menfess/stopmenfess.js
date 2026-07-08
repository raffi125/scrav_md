const session = require('../../lib/session');

module.exports = {
    name: 'stopmenfess',
    aliases: ['stopcurhat'],
    category: 'Menfess',
    description: 'Mengakhiri sesi chat Menfess',
    async execute(sock, msg, args) {
        const { from, sender } = msg;
        const jid = sender || from;
        
        const partner = session.menfess[jid];

        if (!partner) {
            await sock.sendMessage(from, { text: '❌ Anda tidak sedang dalam sesi Menfess apapun.' }, { quoted: msg });
            return;
        }

        // Putus koneksi
        delete session.menfess[jid];
        delete session.menfess[partner];

        await sock.sendMessage(jid, { text: '🛑 Anda telah memutus jalur komunikasi Menfess.' });
        await sock.sendMessage(partner, { text: '🛑 Target Anda telah memutus jalur komunikasi Menfess.' });
    }
};
