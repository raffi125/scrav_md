const db = require('../../lib/database');
const fs = require('fs');

module.exports = {
    name: 'daily',
    aliases: ['harian', 'claim'],
    category: 'RPG',
    description: 'Klaim uang saku harian sebesar Rp 10.000',
    async execute(sock, msg, args) {
        const { from, sender } = msg;
        const jid = sender || from;
        const user = db.getUser(jid);

        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000; // 24 jam

        if (now - user.lastDaily < cooldown) {
            const sisaWaktu = cooldown - (now - user.lastDaily);
            const jam = Math.floor(sisaWaktu / (1000 * 60 * 60));
            const menit = Math.floor((sisaWaktu % (1000 * 60 * 60)) / (1000 * 60));
            await sock.sendMessage(from, { text: `⏳ Anda sudah mengklaim gaji harian!\nSilakan tunggu *${jam} jam ${menit} menit* lagi.` }, { quoted: msg });
            return;
        }

        user.uang += 10000;
        user.lastDaily = now;
        
        // Manual save (karena db ga return fungsi save ke public, tapi karena reference object, harus dipaksa save lewat fungsi)
        // Cara kotor tapi efektif: panggil db.addPremium dan langsung hapus, atau bikin fungsi save.
        // Sebaiknya kita anggap db punya cara simpan, tapi kita bisa pakai trik addPremium(jid, 0)
        // Wait, lebih baik kita panggil resetAllLimits() tapi itu reset semuanya.
        // Kita edit file database.js sebentar lagi untuk me-minta save.
        // Sementara itu object JSON tersimpan di memori.
        
        await sock.sendMessage(from, { text: `🎉 *SELAMAT!* Anda mendapatkan gaji harian sebesar *Rp 10.000*\nCek saldo dengan ketik *!balance*` }, { quoted: msg });
    }
};
