const db = require('../../lib/database');

module.exports = {
    name: 'limit',
    aliases: ['ceklimit', 'me'],
    description: 'Mengecek sisa limit harian dan status Premium',
    category: 'User',
    async execute(sock, msg, args) {
        const { from, sender, pushName } = msg;
        const jid = sender || from;
        console.log('[DEBUG-LIMIT] JID:', jid, '| ownerNumber:', require('../../../config').ownerNumber, '| getPhone(jid):', db.getPhone(jid), '| getPhone(owner):', db.getPhone(require('../../../config').ownerNumber));
        const isOwner = db.isOwnerJid(jid);
        console.log('[DEBUG-LIMIT] isOwnerJid result:', isOwner);
        const user = db.getUser(jid);

        let statusTxt;
        let limitTxt;
        if (isOwner) {
            statusTxt = '👑 *OWNER*';
            limitTxt = '♾️ Unlimited';
        } else if (user.isPremium) {
            statusTxt = '🌟 *PREMIUM*';
            limitTxt = '♾️ Unlimited';
        } else {
            statusTxt = '🆓 *GRATIS*';
            limitTxt = `${user.limit} / ${db.FREE_LIMIT}`;
        }

        let expTxt = '-';
        if (user.isPremium) {
            if (user.premiumExpired === 'LIFETIME') {
                expTxt = '♾️ LIFETIME (Seumur Hidup)';
            } else {
                expTxt = new Date(user.premiumExpired).toLocaleString('id-ID');
            }
        }

        const reply = `╭─「 *STATUS PENGGUNA* 」
│ 👤 *Nama:* ${pushName || 'User'}s
│ 📱 *Nomor:* ${jid.split('@')[0]}
│ 💳 *Status:* ${statusTxt}
│ 📊 *Sisa Limit:* ${limitTxt}
│ ⏳ *Expired:* ${expTxt}
╰──────────────────

💡 _Limit akan direset setiap jam 00:00._
🛒 _Ingin tanpa batas? Ketik *!buypremium*_`;

        await sock.sendMessage(from, { text: reply }, { quoted: msg });
    }
};
