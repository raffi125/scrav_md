const db = require('../../lib/database');

module.exports = {
    name: 'balance',
    aliases: ['bal', 'dompet', 'uang', 'inv'],
    category: 'RPG',
    description: 'Mengecek saldo uang dan inventory',
    async execute(sock, msg, args) {
        const { from, sender, pushName } = msg;
        const jid = sender || from;
        const user = db.getUser(jid);

        let limitTxt = user.isPremium ? 'Unlimited' : `${user.limit} / ${db.FREE_LIMIT}`;

        // Fallback properti inventory jika user lama belum punya (penting agar tidak undefined)
        const uang = user.uang || 0;
        const xp = user.xp || 0;
        const level = user.level || 1;
        const inv = user.inventory || { ikan: 0, sampah: 0, box: 0 };

        const teks = `💳 *DOMPET ${pushName || 'Player'}*\n` +
                     `├ 💰 Uang: Rp ${uang.toLocaleString('id-ID')}\n` +
                     `├ ⚡ Limit: ${limitTxt}\n` +
                     `├ 🌟 Level: ${level} (XP: ${xp})\n` +
                     `╰────────────────\n\n` +
                     `🎒 *INVENTORY*\n` +
                     `├ 🐟 Ikan: ${inv.ikan || 0}\n` +
                     `├ 🗑️ Sampah: ${inv.sampah || 0}\n` +
                     `╰ 🎁 Box: ${inv.box || 0}\n\n` +
                     `_Tips: Ketik !mancing untuk mencari ikan lalu jual ke teman!_`;

        await sock.sendMessage(from, { text: teks }, { quoted: msg });
    }
};
