const db = require('../../lib/database');

module.exports = {
    name: 'transfer',
    aliases: ['tf', 'pay'],
    category: 'RPG',
    description: 'Mentransfer uang ke pengguna lain',
    async execute(sock, msg, args) {
        const { from, sender } = msg;
        const jid = sender || from;
        const user = db.getUser(jid);

        if (args.length < 2) {
            await sock.sendMessage(from, { text: `❌ Format salah.\nContoh: *!transfer @user 50000*` }, { quoted: msg });
            return;
        }

        const targetMention = msg.message?.extendedTextMessage?.contextInfo?.participant || (args[0].includes('@') ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
        
        if (!targetMention) {
            await sock.sendMessage(from, { text: '❌ Harap tag (mention) target yang ingin ditransfer.' }, { quoted: msg });
            return;
        }

        const nominal = parseInt(args[1].replace(/[^0-9]/g, ''));

        if (isNaN(nominal) || nominal <= 0) {
            await sock.sendMessage(from, { text: '❌ Nominal harus berupa angka positif.' }, { quoted: msg });
            return;
        }

        if ((user.uang || 0) < nominal) {
            await sock.sendMessage(from, { text: `❌ Uang Anda tidak cukup. Saldo Anda: Rp ${(user.uang || 0).toLocaleString('id-ID')}` }, { quoted: msg });
            return;
        }

        const targetUser = db.getUser(targetMention);
        
        // Proses transfer
        user.uang -= nominal;
        targetUser.uang = (targetUser.uang || 0) + nominal;

        await sock.sendMessage(from, { text: `✅ Berhasil mentransfer uang sebesar *Rp ${nominal.toLocaleString('id-ID')}* ke @${targetMention.split('@')[0]}` }, { mentions: [targetMention], quoted: msg });
    }
};
