const { ScravBotApi } = require('../../lib/apimanager');

module.exports = {
    name: 'ig',
    aliases: ['igdl', 'instagram'],
    limit: true,
    description: 'Mengunduh video/reels/postingan dari Instagram',
    category: 'Downloader',
    async execute(sock, msg, args) {
        const { from } = msg;

        if (args.length === 0) {
            await sock.sendMessage(from, { text: '❌ Harap sertakan URL Instagram.\nContoh: !igdl https://www.instagram.com/reel/xxx' }, { quoted: msg });
            return;
        }

        const url = args[0];
        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

        try {
            let videoUrl = null;
            let title = 'Instagram Video';

            const fetchApi = async (apiCall, sourceName) => {
                try {
                    const res = await apiCall(url);
                    const data = res?.data || res?.result;
                    let mediaUrl = data?.url || data?.video || (Array.isArray(data) ? data[0]?.url : null);
                    if (typeof mediaUrl === 'object' && mediaUrl !== null) {
                        mediaUrl = mediaUrl.url || mediaUrl.link || mediaUrl.download || mediaUrl;
                    }
                    if (!mediaUrl || typeof mediaUrl !== 'string') throw new Error('No valid URL found');
                    return { url: mediaUrl, source: sourceName };
                } catch (e) {
                    console.log(`${sourceName} gagal:`, e.message || e);
                    throw e;
                }
            };

            const promises = [
                fetchApi(ScravBotApi.tegarx.igReels, 'Tegarx IG Reels'),
                fetchApi(ScravBotApi.tegarx.instagram, 'Tegarx IG'),
                fetchApi(ScravBotApi.harz.igV4, 'Harz IG V4'),
                fetchApi(ScravBotApi.harz.igV3, 'Harz IG V3'),
                fetchApi(ScravBotApi.harz.igV2, 'Harz IG V2')
            ];

            try {
                const result = await Promise.any(promises);
                videoUrl = result.url;
                console.log(`✅ [IG Downloader] Berhasil menggunakan API: ${result.source}`);
            } catch (aggregateError) {
                throw new Error('Semua API Fallback (Harz & TegarX) gagal mengambil video Instagram.');
            }

            await sock.sendMessage(from, {
                video: { url: videoUrl },
                caption: `✅ *Berhasil diunduh!*`
            }, { quoted: msg });
            
            await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (err) {
            console.error('IG Downloader Error:', err.message);
            // Melempar error agar tertangkap handler.js dan dikirim ke Owner
            throw new Error(`Gagal mengunduh Instagram. Detail: ${err.message}`);
        }
    }
};
