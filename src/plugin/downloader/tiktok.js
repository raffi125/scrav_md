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

            // 1. Harz TikTok V4
            try {
                const res = await ScravBotApi.harz.tiktokV4(url);
                const data = res?.data || res?.result;
                videoUrl = data?.no_watermark || data?.video || data?.url;
                title = data?.title || title;
            } catch (e) { console.log('Harz TikTok V4 gagal'); }

            // 2. Harz TikTok V3
            if (!videoUrl) {
                try {
                    const res = await ScravBotApi.harz.tiktokV3(url);
                    const data = res?.data || res?.result;
                    videoUrl = data?.no_watermark || data?.video || data?.url;
                } catch (e) { console.log('Harz TikTok V3 gagal'); }
            }

            // 3. Harz TikTok V2
            if (!videoUrl) {
                try {
                    const res = await ScravBotApi.harz.tiktokV2(url);
                    const data = res?.data || res?.result;
                    videoUrl = data?.no_watermark || data?.video || data?.url;
                } catch (e) { console.log('Harz TikTok V2 gagal'); }
            }

            // 4. Harz TikTok
            if (!videoUrl) {
                try {
                    const res = await ScravBotApi.harz.tiktok(url);
                    const data = res?.data || res?.result;
                    videoUrl = data?.no_watermark || data?.video || data?.url;
                } catch (e) { console.log('Harz TikTok gagal'); }
            }

            // 5. TegarX TikTok
            if (!videoUrl) {
                try {
                    const res = await ScravBotApi.tegarx.tiktok(url);
                    const data = res?.data || res?.result;
                    videoUrl = data?.no_watermark || data?.video || data?.url;
                } catch (e) { console.log('Tegarx TikTok gagal'); }
            }

            if (!videoUrl) throw new Error('Semua API Fallback (Harz & TegarX) gagal mengambil video TikTok.');

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
