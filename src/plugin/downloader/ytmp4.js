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

            // 1. Harz YTDL V4
            try {
                const res = await ScravBotApi.harz.ytdlV4(url);
                const data = res?.data || res?.result;
                videoUrl = data?.video || data?.mp4 || data?.url;
                title = data?.title || title;
            } catch (e) { console.log('Harz YTDL V4 gagal:', e.message || e); }

            // 2. Harz YTDL V3
            if (!videoUrl) {
                try {
                    const res = await ScravBotApi.harz.ytdlV3(url);
                    const data = res?.data || res?.result;
                    videoUrl = data?.video || data?.mp4 || data?.url;
                } catch (e) { console.log('Harz YTDL V3 gagal:', e.message || e); }
            }
            
            // 3. Harz YTDL V2
            if (!videoUrl) {
                try {
                    const res = await ScravBotApi.harz.ytdlV2(url);
                    const data = res?.data || res?.result;
                    videoUrl = data?.video || data?.mp4 || data?.url;
                } catch (e) { console.log('Harz YTDL V2 gagal:', e.message || e); }
            }

            // 4. TegarX YTMP4-2
            if (!videoUrl) {
                try {
                    const res = await ScravBotApi.tegarx.ytmp4v2(url);
                    const data = res?.data || res?.result;
                    videoUrl = data?.video || data?.mp4 || data?.url;
                } catch (e) { console.log('Tegarx YTMP4-2 gagal:', e.message || e); }
            }

            if (typeof videoUrl === 'object' && videoUrl !== null) {
                videoUrl = videoUrl.url || videoUrl.link || videoUrl.download || videoUrl;
            }

            if (!videoUrl || typeof videoUrl !== 'string') throw new Error('Semua API Fallback (Harz & TegarX) gagal mengambil video YouTube.');

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
