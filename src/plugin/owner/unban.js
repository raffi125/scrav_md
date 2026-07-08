const db = require('../../lib/database');
const config = require('../../../config');

module.exports = {
    name: 'unban',
    aliases: ['maaf', 'unblock'],
    description: 'Membuka blokir Banned dari user (Khusus Owner)',
    category: 'Lainnya',
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
            await sock.sendMessage(from, { text: '❌ Format salah.\nContoh: !unban 628xxx' }, { quoted: msg });
            return;
        }

        const targetNumber = args[0].replace(/[^0-9]/g, '');
        const targetJid = targetNumber + '@s.whatsapp.net';

        db.unbanUser(targetJid);

        await sock.sendMessage(from, { text: `✅ Berhasil membebaskan @${targetNumber} dari daftar BANNED.` }, { mentions: [targetJid], quoted: msg });
        
        // Kirim notifikasi ke user tersebut
        await sock.sendMessage(targetJid, { text: `🎉 *KABAR BAIK!* Status BANNED Anda telah dicabut oleh Owner. Anda bisa menggunakan bot kembali.\n_Tolong jangan SPAM lagi ya!_` });
    }
};
