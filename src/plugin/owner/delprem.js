const db = require('../../lib/database');
const config = require('../../../config');

module.exports = {
    name: 'delprem',
    aliases: ['delpremium', 'cabutprem'],
    description: 'Mencabut status Premium user (Khusus Owner)',
    category: 'Owner',
    async execute(sock, msg, args) {
        const { from, sender } = msg;
        const jid = sender || from;

        // Cek apakah yang menjalankan adalah Owner
        const ownerJid = config.ownerNumber + '@s.whatsapp.net';
        if (jid !== ownerJid) {
            await sock.sendMessage(from, { text: '❌ Perintah ini hanya bisa digunakan oleh Owner Bot.' }, { quoted: msg });
            return;
        }

        if (args.length < 1) {
            await sock.sendMessage(from, { text: '❌ Format salah.\nContoh: !delprem 628xxx' }, { quoted: msg });
            return;
        }

        const targetNumber = args[0].replace(/[^0-9]/g, '');
        const targetJid = targetNumber + '@s.whatsapp.net';

        db.delPremium(targetJid);

        await sock.sendMessage(from, { text: `✅ Berhasil mencabut status Premium dari @${targetNumber}.` }, { mentions: [targetJid], quoted: msg });
        
        // Kirim notifikasi ke user tersebut
        await sock.sendMessage(targetJid, { text: `⚠️ *INFORMASI:* Lisensi/Status Premium Anda telah dicabut oleh Owner.` });
    }
};
