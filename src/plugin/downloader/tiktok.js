const { ScravBotApi } = require('../../lib/apimanager');

module.exports = {
    name: 'tiktok',
    aliases: ['tt', 'ttdl'],
    limit: true,
    description: 'Mengunduh video TikTok tanpa watermark',
    category: 'Downloader',
    async execute(sock, msg, args) {
        const { from } = msg;

        if (args.length === 0) {
            await sock.sendMessage(from, { text: '❌ Harap sertakan URL TikTok.\nContoh: !tiktok https://vt.tiktok.com/xxx' }, { quoted: msg });
            return;
        }

        const url = args[0];
        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

        try {
            let videoUrl = null;
            let title = 'TikTok Video';

            const fetchApi = async (apiCall, sourceName) => {
                try {
                    const res = await apiCall(url);
                    const data = res?.data || res?.result;
                    let mediaUrl = data?.no_watermark || data?.video || data?.url;
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
                fetchApi(ScravBotApi.harz.tiktokV4, 'Harz TikTok V4'),
                fetchApi(ScravBotApi.harz.tiktokV3, 'Harz TikTok V3'),
                fetchApi(ScravBotApi.harz.tiktokV2, 'Harz TikTok V2'),
                fetchApi(ScravBotApi.harz.tiktok, 'Harz TikTok'),
                fetchApi(ScravBotApi.tegarx.tiktok, 'TegarX TikTok')
            ];

            try {
                const result = await Promise.any(promises);
                videoUrl = result.url;
                title = result.title || title;
                console.log(`✅ [TikTok Downloader] Berhasil menggunakan API: ${result.source}`);
            } catch (aggregateError) {
                throw new Error('Semua API Fallback (Harz & TegarX) gagal mengambil video TikTok.');
            }

            await sock.sendMessage(from, {
                video: { url: videoUrl },
                caption: `✅ *Berhasil diunduh!*`
            }, { quoted: msg });
            
            await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (err) {
            console.error('TikTok Downloader Error:', err.message);
            throw new Error(`Gagal mengunduh TikTok. Detail: ${err.message}`);
        }
    }
};
