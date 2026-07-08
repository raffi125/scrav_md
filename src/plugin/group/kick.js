module.exports = {
    name: 'kick',
    aliases: ['tendang'],
    description: 'Mengeluarkan anggota dari grup',
    category: 'Lainnya',
    async execute(sock, msg, args) {
        const { from, isGroup, sender } = msg;

        if (!isGroup) {
            await sock.sendMessage(from, { text: '❌ Perintah ini hanya bisa digunakan di grup.' }, { quoted: msg });
            return;
        }

        try {
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;

            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const isBotAdmin = participants.find(p => p.id === botId)?.admin !== null;
            
            if (!isBotAdmin) {
                await sock.sendMessage(from, { text: '❌ Bot harus menjadi Admin terlebih dahulu!' }, { quoted: msg });
                return;
            }

            // Mendapatkan target dari reply atau tag
            let target = '';
            const contextInfo = msg.message[msg.type]?.contextInfo;
            
            if (contextInfo && contextInfo.participant) {
                target = contextInfo.participant;
            } else if (contextInfo && contextInfo.mentionedJid && contextInfo.mentionedJid.length > 0) {
                target = contextInfo.mentionedJid[0];
            } else {
                await sock.sendMessage(from, { text: '❌ Reply pesan orangnya atau tag orangnya yang mau di-kick.' }, { quoted: msg });
                return;
            }

            await sock.groupParticipantsUpdate(from, [target], 'remove');
            await sock.sendMessage(from, { text: `✅ Berhasil mengeluarkan target.` });

        } catch (error) {
            console.error('Kick Error:', error.message);
            await sock.sendMessage(from, { text: '❌ Gagal mengeluarkan member.' }, { quoted: msg });
        }
    }
};
