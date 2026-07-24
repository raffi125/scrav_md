const { ScravBotApi } = require('../../lib/apimanager');
const youtubedl = require('youtube-dl-exec');

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
        const startTime = Date.now();
        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

        try {
            let audioUrl = null;
            let title = 'YouTube Audio';
            let sourceName = '';

            try {
                // 1. UTAMAKAN yt-dlp → ffmpeg → MP3 buffer
                const info = await youtubedl(url, { dumpSingleJson: true, noWarnings: true, noCheckCertificates: true, format: 'bestaudio' });
                if (!info || !info.url) throw new Error('Local yt-dlp failed to get URL');

                const buffer = await new Promise((resolve, reject) => {
                    const { spawn } = require('child_process');
                    const ffmpeg = spawn('ffmpeg', ['-i', info.url, '-vn', '-acodec', 'libmp3lame', '-b:a', '128k', '-f', 'mp3', 'pipe:1']);
                    const chunks = [];
                    ffmpeg.stdout.on('data', chunk => chunks.push(chunk));
                    ffmpeg.on('close', code => {
                        if (code === 0) resolve(Buffer.concat(chunks));
                        else reject(new Error('FFMPEG exited with code ' + code));
                    });
                    ffmpeg.on('error', err => reject(err));
                });

                audioUrl = buffer;
                title = info.title || title;
                sourceName = 'Local yt-dlp (FFMPEG)';
                console.log(`✅ [YTMP3 Downloader] Berhasil menggunakan metode utama: ${sourceName}`);
            } catch (localError) {
                console.log(`⚠️ Local yt-dlp gagal: ${localError.message}. Mengalihkan ke API Fallback...`);
                
                // 2. JIKA GAGAL, Berlomba menggunakan API Fallback
                const fetchApi = async (apiCall, source) => {
                    try {
                        const res = await apiCall();
                        const data = res?.data || res?.result;
                        let mediaUrl = data?.audio || data?.mp3 || data?.url || data?.audio_url || data?.audioUrl;
                        if (typeof mediaUrl === 'object' && mediaUrl !== null) {
                            mediaUrl = mediaUrl.url || mediaUrl.link || mediaUrl.download || mediaUrl;
                        }
                        if (!mediaUrl || typeof mediaUrl !== 'string') throw new Error('No valid URL found');
                        return { url: mediaUrl, title: data?.title, source: source };
                    } catch (e) {
                        console.log(`${source} gagal:`, e.message || e);
                        throw e;
                    }
                };

                const promises = [
                    fetchApi(() => ScravBotApi.harz.ytmp3(url), 'Harz YTMP3'),
                    fetchApi(() => ScravBotApi.harz.ytdlV4(url), 'Harz YTDL V4'),
                    fetchApi(() => ScravBotApi.harz.ytdlV3(url), 'Harz YTDL V3'),
                    fetchApi(() => ScravBotApi.tegarx.ytmp3(url), 'Tegarx YTMP3'),
                    fetchApi(() => ScravBotApi.tegarx.ytmp3v2(url), 'Tegarx YTMP3-2')
                ];

                try {
                    const result = await Promise.any(promises);
                    audioUrl = result.url;
                    title = result.title || title;
                    sourceName = result.source;
                    console.log(`✅ [YTMP3 Downloader] Berhasil menggunakan API Fallback: ${sourceName}`);
                } catch (aggregateError) {
                    throw new Error('Semua API Fallback (Harz & TegarX) gagal mengambil audio YouTube.');
                }
            }

            const audioPayload = Buffer.isBuffer(audioUrl) ? audioUrl : { url: audioUrl };

            await sock.sendMessage(from, { 
                audio: audioPayload, 
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: msg });
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            await sock.sendMessage(from, { text: `🎵 *${title}*\n⏱️ _Diproses dalam ${duration} detik menggunakan ${sourceName}_` }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (err) {
            console.error('YTMP3 Error:', err.message);
            throw new Error(`Gagal mengunduh Audio YouTube. Detail: ${err.message}`);
        }
    }
};
