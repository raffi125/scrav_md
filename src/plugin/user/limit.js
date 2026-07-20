const db = require('../../lib/database');

module.exports = {
    name: 'limit',
    aliases: ['ceklimit', 'me'],
    description: 'Mengecek sisa limit harian dan status Premium',
    category: 'User',
    async execute(sock, msg, args) {
        const { from, sender, pushName } = msg;
        const jid = sender || from;
        const user = db.getUser(jid);

        let statusTxt = user.isPremium ? '🌟 *PREMIUM*' : '🆓 *GRATIS*';
        let limitTxt = user.isPremium ? '♾️ Unlimited' : `${user.limit} / ${db.FREE_LIMIT}`;
        
        let expTxt = '-';
        if (user.isPremium) {
            if (user.premiumExpired === 'LIFETIME') {
                expTxt = '♾️ LIFETIME (Seumur Hidup)';
            } else {
                expTxt = new Date(user.premiumExpired).toLocaleString('id-ID');
            }
        }

        const reply = `╭─「 *STATUS PENGGUNA* 」
│ 👤 *Nama:* ${pushName || 'User'}
│ 📱 *Nomor:* ${db.getPhone(jid)}
│ 💳 *Status:* ${statusTxt}
│ 📊 *Sisa Limit:* ${limitTxt}
│ ⏳ *Expired:* ${expTxt}
╰──────────────────

💡 _Limit akan direset setiap jam 00:00._
🛒 _Ingin tanpa batas? Ketik *!buypremium*_`;

        await sock.sendMessage(from, { text: reply }, { quoted: msg });
    }
};
