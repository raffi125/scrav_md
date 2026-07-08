module.exports = {
    name: 'promote',
    aliases: ['jadiadmin'],
    description: 'Menjadikan anggota sebagai Admin grup',
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
                await sock.sendMessage(from, { text: '❌ Reply atau tag orang yang mau di-promote.' }, { quoted: msg });
                return;
            }

            await sock.groupParticipantsUpdate(from, [target], 'promote');
            await sock.sendMessage(from, { text: `✅ Berhasil menaikkan jabatan target menjadi Admin.` });

        } catch (error) {
            console.error('Promote Error:', error.message);
            await sock.sendMessage(from, { text: '❌ Gagal.' }, { quoted: msg });
        }
    }
};
