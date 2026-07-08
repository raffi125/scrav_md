module.exports = {
    name: 'hidetag',
    aliases: ['pengumuman', 'tagall'],
    description: 'Tag seluruh member grup secara sembunyi-sembunyi',
    category: 'Lainnya',
    async execute(sock, msg, args) {
        const { from, isGroup, sender } = msg;

        if (!isGroup) {
            await sock.sendMessage(from, { text: '❌ Perintah ini hanya bisa digunakan di dalam grup.' }, { quoted: msg });
            return;
        }

        const text = args.join(' ') || 'Ada pengumuman penting!';

        try {
            // Ambil data grup
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;

            // Cek apakah pengirim adalah admin (Opsional: aktifkan ini jika ingin membatasi)
            /*
            const isAdmin = participants.find(p => p.id === sender)?.admin !== null;
            if (!isAdmin) {
                await sock.sendMessage(from, { text: '❌ Anda bukan Admin.' }, { quoted: msg });
                return;
            }
            */

            const participantIds = participants.map(a => a.id);

            // Kirim pesan dengan me-mention semua id tapi tidak menampilkannya di teks
            await sock.sendMessage(from, { 
                text: text, 
                mentions: participantIds 
            }, { quoted: msg });

        } catch (error) {
            console.error('Hidetag Error:', error.message);
            await sock.sendMessage(from, { text: '❌ Gagal mengirim hidetag.' }, { quoted: msg });
        }
    }
};
