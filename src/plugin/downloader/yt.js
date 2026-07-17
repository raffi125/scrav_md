const youtubedl = require('youtube-dl-exec');

module.exports = {
    name: 'hhh', // Command utama
    aliases: ['hhh', 'h', 'kkk'],
    category: 'Downloader',
    limit: true,
    description: 'Download Video / Audio YouTube via yt-dlp',
    async execute(sock, msg, args) {
        const { from, body } = msg;
        if (!args[0]) return sock.sendMessage(from, { text: '❌ Harap masukkan URL YouTube.' }, { quoted: msg });

        const url = args[0];

        // Cek apakah user memanggil ytmp3 atau ytmp4
        const prefix = require('../../../config').prefix; // Mundur 3 folder ke root karena ini di src/plugin/downloader
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : 'ytmp4'; // Default auto-dl adalah ytmp4

        const isAudio = command === 'ytmp3';

        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

        try {
            // Untuk WhatsApp, kita butuh file tunggal. best[ext=mp4] paling aman.
            const safeFormat = isAudio ? 'bestaudio' : 'best[ext=mp4]/best';

            const info = await youtubedl(url, {
                dumpSingleJson: true,
                noWarnings: true,
                noCheckCertificates: true,
                format: safeFormat
            });

            const mediaUrl = info.url;
            const title = info.title || 'YouTube Media';

            if (!mediaUrl) throw new Error('URL tidak ditemukan');

            if (isAudio) {
                await sock.sendMessage(from, {
                    audio: { url: mediaUrl },
                    mimetype: 'audio/mp4',
                    ptt: false
                }, { quoted: msg });
            } else {
                await sock.sendMessage(from, {
                    video: { url: mediaUrl },
                    caption: `✅ *Berhasil diunduh!*\n\n📝 *Judul:* ${title}`
                }, { quoted: msg });
            }
            await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (err) {
            console.error('YouTube error:', err.message);
            await sock.sendMessage(from, { text: '❌ Gagal mengunduh media. Mungkin durasinya terlalu panjang atau dibatasi hak cipta.' }, { quoted: msg });
        }
    }
};
