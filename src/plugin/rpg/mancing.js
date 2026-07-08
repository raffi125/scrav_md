const db = require('../../lib/database');

module.exports = {
    name: 'mancing',
    aliases: ['fishing', 'pancing'],
    category: 'RPG',
    limit: true,
    description: 'Pergi memancing (Bisa dapat ikan, sampah, atau harta karun)',
    async execute(sock, msg, args) {
        const { from, sender } = msg;
        const jid = sender || from;
        const user = db.getUser(jid);

        const now = Date.now();
        const cooldown = 3 * 60 * 1000; // 3 menit cooldown

        if (now - (user.lastMancing || 0) < cooldown) {
            const sisaWaktu = cooldown - (now - user.lastMancing);
            const menit = Math.floor((sisaWaktu % (1000 * 60 * 60)) / (1000 * 60));
            const detik = Math.floor((sisaWaktu % (1000 * 60)) / 1000);
            await sock.sendMessage(from, { text: `🎣 Pancingan Anda masih basah!\nTunggu *${menit} menit ${detik} detik* lagi untuk memancing.` }, { quoted: msg });
            return;
        }

        user.lastMancing = now;
        if (!user.inventory) user.inventory = { ikan: 0, sampah: 0, box: 0 };

        const random = Math.random();
        let hadiah = '';
        
        if (random < 0.1) {
            // 10% Harta Karun (Box)
            user.inventory.box = (user.inventory.box || 0) + 1;
            user.uang = (user.uang || 0) + 50000;
            user.xp = (user.xp || 0) + 50;
            hadiah = `🎁 *HARTA KARUN!*\nAnda menemukan Harta Karun bawah laut!\n+ 1 Box\n+ Rp 50.000\n+ 50 XP`;
        } else if (random < 0.7) {
            // 60% Ikan
            const jumlahIkan = Math.floor(Math.random() * 5) + 1;
            user.inventory.ikan = (user.inventory.ikan || 0) + jumlahIkan;
            user.xp = (user.xp || 0) + 10;
            hadiah = `🐟 *STRIKE!*\nAnda berhasil memancing!\n+ ${jumlahIkan} Ikan\n+ 10 XP`;
        } else {
            // 30% Sampah
            const jumlahSampah = Math.floor(Math.random() * 3) + 1;
            user.inventory.sampah = (user.inventory.sampah || 0) + jumlahSampah;
            hadiah = `🗑️ *YAAH...*\nAnda mendapatkan sampah, buanglah pada tempatnya.\n+ ${jumlahSampah} Sampah`;
        }

        // Cek level up
        if (user.xp >= (user.level || 1) * 100) {
            user.level = (user.level || 1) + 1;
            user.xp = 0;
            hadiah += `\n\n🎉 *LEVEL UP!* Anda sekarang Level ${user.level}`;
        }

        await sock.sendMessage(from, { text: hadiah }, { quoted: msg });
    }
};
