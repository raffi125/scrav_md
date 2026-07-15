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

            // 1. Harz YTMP3
            try {
                const res = await ScravBotApi.harz.ytmp3(url);
                const data = res?.data || res?.result;
                audioUrl = data?.audio || data?.mp3 || data?.url;
                title = data?.title || title;
            } catch (e) { console.log('Harz YTMP3 gagal'); }

            // 2. Harz YTDL V4
            if (!audioUrl) {
                try {
                    const res = await ScravBotApi.harz.ytdlV4(url);
                    const data = res?.data || res?.result;
                    audioUrl = data?.audio || data?.mp3 || data?.url;
                } catch (e) { console.log('Harz YTDL V4 gagal'); }
            }
            
            // 3. Harz YTDL V3
            if (!audioUrl) {
                try {
                    const res = await ScravBotApi.harz.ytdlV3(url);
                    const data = res?.data || res?.result;
                    audioUrl = data?.audio || data?.mp3 || data?.url;
                } catch (e) { console.log('Harz YTDL V3 gagal'); }
            }

            // 4. TegarX YTMP3
            if (!audioUrl) {
                try {
                    const res = await ScravBotApi.tegarx.ytmp3(url);
                    const data = res?.data || res?.result;
                    audioUrl = data?.audio || data?.mp3 || data?.url;
                } catch (e) { console.log('Tegarx YTMP3 gagal'); }
            }
            
            // 5. TegarX YTMP3-2
            if (!audioUrl) {
                try {
                    const res = await ScravBotApi.tegarx.ytmp3v2(url);
                    const data = res?.data || res?.result;
                    audioUrl = data?.audio || data?.mp3 || data?.url;
                } catch (e) { console.log('Tegarx YTMP3-2 gagal'); }
            }

            if (typeof audioUrl === 'object' && audioUrl !== null) {
                audioUrl = audioUrl.url || audioUrl.link || audioUrl.download || audioUrl;
            }

            if (!audioUrl || typeof audioUrl !== 'string') throw new Error('Semua API Fallback (Harz & TegarX) gagal mengambil audio YouTube.');

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
