module.exports = {
    name: 'demote',
    aliases: ['berhentiadadmin'],
    description: 'Mencopot anggota dari Admin grup',
    category: 'Lainnya',
    async execute(sock, msg, args) {
        const { from, isGroup } = msg;

        if (!isGroup) return;

        try {
            const groupMetadata = await sock.groupMetadata(from);
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const isBotAdmin = groupMetadata.participants.find(p => p.id === botId)?.admin !== null;
            
            if (!isBotAdmin) {
                await sock.sendMessage(from, { text: '❌ Bot harus menjadi Admin!' }, { quoted: msg });
                return;
            }

            let target = '';
            const contextInfo = msg.message[msg.type]?.contextInfo;
            
            if (contextInfo && contextInfo.participant) {
                target = contextInfo.participant;
            } else if (contextInfo && contextInfo.mentionedJid && contextInfo.mentionedJid.length > 0) {
                target = contextInfo.mentionedJid[0];
            } else {
                await sock.sendMessage(from, { text: '❌ Reply atau tag orang yang mau di-demote.' }, { quoted: msg });
                return;
            }

            await sock.groupParticipantsUpdate(from, [target], 'demote');
            await sock.sendMessage(from, { text: `✅ Berhasil mencopot jabatan Admin target.` });

        } catch (error) {
            console.error('Demote Error:', error.message);
            await sock.sendMessage(from, { text: '❌ Gagal.' }, { quoted: msg });
        }
    }
};
