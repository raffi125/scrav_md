const db = require('../../lib/database');
const config = require('../../../config');

module.exports = {
    name: 'addprem',
    aliases: ['addpremium'],
    description: 'Menambahkan status Premium ke user (Khusus Owner)',
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

        if (args.length < 2) {
            await sock.sendMessage(from, { text: '❌ Format salah.\nContoh: !addprem 628xxx 30\nContoh Lifetime: !addprem 628xxx lifetime' }, { quoted: msg });
            return;
        }

        const targetNumber = args[0].replace(/[^0-9]/g, '');
        const targetJid = targetNumber + '@s.whatsapp.net';
        const duration = args[1].toLowerCase();

        db.addPremium(targetJid, duration);

        const durationTxt = (duration === 'lifetime') ? 'LIFETIME (Seumur Hidup)' : `${duration} Hari`;
        await sock.sendMessage(from, { text: `✅ Berhasil menambahkan Premium ke @${targetNumber} selama ${durationTxt}.` }, { mentions: [targetJid], quoted: msg });
        
        // Kirim notifikasi ke user tersebut
        await sock.sendMessage(targetJid, { text: `🎉 *SELAMAT!* Anda telah menjadi pengguna *Premium* selama ${durationTxt}.\nSilakan ketik *!limit* untuk mengecek status Anda.` });
    }
};
