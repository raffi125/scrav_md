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

            // 1. Tegarx IG Reels (Prioritas Utama)
            try {
                const res = await ScravBotApi.tegarx.igReels(url);
                const data = res?.data || res?.result;
                videoUrl = data?.url || data?.video || (Array.isArray(data) ? data[0]?.url : null);
                if (videoUrl) console.log('✅ [IG Downloader] Berhasil menggunakan API: Tegarx IG Reels');
            } catch (e) { console.log('Tegarx IG Reels gagal'); }

            // 2. Tegarx IG
            if (!videoUrl) {
                try {
                    const res = await ScravBotApi.tegarx.instagram(url);
                    const data = res?.data || res?.result;
                    videoUrl = data?.url || data?.video || (Array.isArray(data) ? data[0]?.url : null);
                    if (videoUrl) console.log('✅ [IG Downloader] Berhasil menggunakan API: Tegarx IG');
                } catch (e) { console.log('Tegarx IG gagal'); }
            }

            // 3. Harz IG V4
            if (!videoUrl) {
                try {
                    const res = await ScravBotApi.harz.igV4(url);
                    const data = res?.data || res?.result;
                    videoUrl = data?.url || data?.video || (Array.isArray(data) ? data[0]?.url : null);
                    if (videoUrl) console.log('✅ [IG Downloader] Berhasil menggunakan API: Harz IG V4');
                } catch (e) { console.log('Harz IG V4 gagal'); }
            }

            // 4. Harz IG V3
            if (!videoUrl) {
                try {
                    const res = await ScravBotApi.harz.igV3(url);
                    const data = res?.data || res?.result;
                    videoUrl = data?.url || data?.video || (Array.isArray(data) ? data[0]?.url : null);
                    if (videoUrl) console.log('✅ [IG Downloader] Berhasil menggunakan API: Harz IG V3');
                } catch (e) { console.log('Harz IG V3 gagal'); }
            }

            // 5. Harz IG V2
            if (!videoUrl) {
                try {
                    const res = await ScravBotApi.harz.igV2(url);
                    const data = res?.data || res?.result;
                    videoUrl = data?.url || data?.video || (Array.isArray(data) ? data[0]?.url : null);
                    if (videoUrl) console.log('✅ [IG Downloader] Berhasil menggunakan API: Harz IG V2');
                } catch (e) { console.log('Harz IG V2 gagal'); }
            }


            if (!videoUrl) throw new Error('Semua API Fallback (Harz & TegarX) gagal mengambil video Instagram.');

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
