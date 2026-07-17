const { ScravBotApi } = require('../../lib/apimanager');

module.exports = {
    name: 'ytmp4',
    aliases: ['ytvideo'],
    limit: true,
    description: 'Mengunduh video YouTube',
    category: 'Downloader',
    async execute(sock, msg, args) {
        const { from } = msg;

        if (args.length === 0) {
            await sock.sendMessage(from, { text: '❌ Harap sertakan URL YouTube.\nContoh: !ytmp4 https://youtu.be/xxx' }, { quoted: msg });
            return;
        }

        const url = args[0];
        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

        try {
            let videoUrl = null;
            let title = 'YouTube Video';

            const fetchApi = async (apiCall, sourceName) => {
                try {
                    const res = await apiCall(url);
                    const data = res?.data || res?.result;
                    let mediaUrl = data?.video || data?.mp4 || data?.url;
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
                fetchApi(ScravBotApi.harz.ytdlV4, 'Harz YTDL V4'),
                fetchApi(ScravBotApi.harz.ytdlV3, 'Harz YTDL V3'),
                fetchApi(ScravBotApi.harz.ytdlV2, 'Harz YTDL V2'),
                fetchApi(ScravBotApi.tegarx.ytmp4v2, 'Tegarx YTMP4-2')
            ];

            try {
                const result = await Promise.any(promises);
                videoUrl = result.url;
                title = result.title || title;
                console.log(`✅ [YTMP4 Downloader] Berhasil menggunakan API: ${result.source}`);
            } catch (aggregateError) {
                throw new Error('Semua API Fallback (Harz & TegarX) gagal mengambil video YouTube.');
            }

            await sock.sendMessage(from, { 
                video: { url: videoUrl }, 
                caption: `🎥 *${title}*`
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (err) {
            console.error('YTMP4 Error:', err.message);
            throw new Error(`Gagal mengunduh Video YouTube. Detail: ${err.message}`);
        }
    }
};
