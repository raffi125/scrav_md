const { ScravBotApi } = require('../../lib/apimanager');

module.exports = {
    name: 'ytmp3',
    aliases: ['ytaudio', 'play'],
    limit: true,
    description: 'Mengunduh audio YouTube',
    category: 'Downloader',
    async execute(sock, msg, args) {
        const { from } = msg;

        if (args.length === 0) {
            await sock.sendMessage(from, { text: '❌ Harap sertakan URL YouTube.\nContoh: !ytmp3 https://youtu.be/xxx' }, { quoted: msg });
            return;
        }

        const url = args[0];
        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

        try {
            let audioUrl = null;
            let title = 'YouTube Audio';

            const fetchApi = async (apiCall, sourceName) => {
                try {
                    const res = await apiCall(url);
                    const data = res?.data || res?.result;
                    let mediaUrl = data?.audio || data?.mp3 || data?.url;
                    if (typeof mediaUrl === 'object' && mediaUrl !== null) {
                        mediaUrl = mediaUrl.url || mediaUrl.link || mediaUrl.download || mediaUrl;
                    }
                    if (!mediaUrl || typeof mediaUrl !== 'string') throw new Error('No valid URL found');
                    return { url: mediaUrl, title: data?.title, source: sourceName };
                } catch (e) {
                    console.log(`${sourceName} gagal:`, e.message || e);
                    throw e;
                }
            };

            const promises = [
                fetchApi(ScravBotApi.harz.ytmp3, 'Harz YTMP3'),
                fetchApi(ScravBotApi.harz.ytdlV4, 'Harz YTDL V4'),
                fetchApi(ScravBotApi.harz.ytdlV3, 'Harz YTDL V3'),
                fetchApi(ScravBotApi.tegarx.ytmp3, 'Tegarx YTMP3'),
                fetchApi(ScravBotApi.tegarx.ytmp3v2, 'Tegarx YTMP3-2')
            ];

            try {
                const result = await Promise.any(promises);
                audioUrl = result.url;
                title = result.title || title;
                console.log(`✅ [YTMP3 Downloader] Berhasil menggunakan API: ${result.source}`);
            } catch (aggregateError) {
                throw new Error('Semua API Fallback (Harz & TegarX) gagal mengambil audio YouTube.');
            }

            await sock.sendMessage(from, { 
                audio: { url: audioUrl }, 
                mimetype: 'audio/mp4',
                ptt: false
            }, { quoted: msg });
            await sock.sendMessage(from, { text: `🎵 *${title}*` }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (err) {
            console.error('YTMP3 Error:', err.message);
            throw new Error(`Gagal mengunduh Audio YouTube. Detail: ${err.message}`);
        }
    }
};
