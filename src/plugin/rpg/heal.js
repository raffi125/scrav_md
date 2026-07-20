const db = require('../../lib/database');

module.exports = {
    name: 'heal',
    aliases: ['hp'],
    description: 'Memulihkan HP kamu menggunakan Potion atau Uang',
    category: 'RPG',
    async execute(sock, msg, args) {
        const { from, sender } = msg;
        const jid = sender || from;
        const user = db.getUser(jid);

        if (user.hp >= user.maxHp) {
            await msg.reply('❤️ HP kamu sudah penuh!');
            return;
        }

        const healAmount = user.maxHp;

        // Cek apakah punya potion
        if (user.inventory.potion > 0) {
            user.inventory.potion -= 1;
            user.hp = user.maxHp;
            db.saveUser(jid, user);
            await msg.reply(`✨ Kamu meminum 1x 🧪 Potion.\n❤️ HP kamu kembali penuh (${user.hp}/${user.maxHp})!`);
            return;
        }

        // Kalau tidak punya potion, bayar pakai Uang
        const cost = 50; // Harga heal di hospital
        if (user.uang >= cost) {
            user.uang -= cost;
            user.hp = user.maxHp;
            db.saveUser(jid, user);
            await msg.reply(`🏥 Kamu membayar 💰 ${cost} Uang untuk berobat ke Rumah Sakit.\n❤️ HP kamu kembali penuh (${user.hp}/${user.maxHp})!`);
            return;
        }

        // Gagal
        await msg.reply(`❌ Kamu tidak memiliki 🧪 Potion dan uangmu (💰 ${user.uang}) tidak cukup untuk berobat (Biaya: 💰 ${cost}).\nKetik *!daily* untuk mendapat uang atau *!shop* untuk membeli potion.`);
    }
};
