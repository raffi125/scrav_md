const axios = require('axios');

module.exports = {
    name: 'idlix',
    aliases: ['searchfilm', 'film', 'carifilm', 'idlixsearch'],
    limit: true,
    description: 'Mencari film luar negeri di Idlix (film Indonesia ditolak)',
    category: 'Tools',
    async execute(sock, msg, args) {
        const { from } = msg;

        if (args.length === 0) {
            await sock.sendMessage(from, { text: '❌ Harap masukkan judul film yang ingin dicari.\nContoh: !idlix spiderman' }, { quoted: msg });
            return;
        }

        const query = args.join(' ');
        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

        try {
            // Cek OMDb untuk deteksi film Indonesia (cache via global)
            if (!global.omdbCache) global.omdbCache = {};
            let isIndo = false;
            const cacheKey = query.toLowerCase().trim();

            if (cacheKey in global.omdbCache) {
                isIndo = global.omdbCache[cacheKey];
            } else {
                try {
                    const omdbRes = await axios.get(`https://www.omdbapi.com/?apikey=trilogy&t=${encodeURIComponent(query)}`, { timeout: 6000 });
                    const omdb = omdbRes.data;
                    if (omdb && omdb.Country) {
                        isIndo = omdb.Country.toLowerCase().includes('indonesia');
                    }
                } catch (e) {
                    // OMDb gagal, skip filter
                }
                global.omdbCache[cacheKey] = isIndo;
            }

            if (isIndo) {
                await sock.sendMessage(from, { text: `❌ *Ditolak!*\n\n"${query}" terdeteksi sebagai film *Indonesia*.\nIdlix hanya menyediakan film *luar negeri* (Hollywood, Asia, Eropa).\n\nSilakan cari judul film internasional!` }, { quoted: msg });
                return;
            }

            const cloudscraper = require('cloudscraper');

            let formattedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
            const urlQuery = formattedQuery.split(' ').join('%20');
            
            const searchUrl = `https://z2.idlixku.com/api/search?q=${urlQuery}`;

            const response = await cloudscraper.get(searchUrl);
            const data = JSON.parse(response);

            if (!data || !data.results || data.results.length === 0) {
                await sock.sendMessage(from, { text: `❌ Tidak ada hasil untuk "${query}".\n\n⚠️ Idlix hanya menyediakan film *luar negeri* (Hollywood, Asia, Eropa).\nFilm Indonesia tidak tersedia di Idlix.\n\nCoba cari judul film internasional!` }, { quoted: msg });
                return;
            }

            const results = data.results;

            let responseText = `🔍 *Hasil Pencarian untuk:* "${query}"\n\n`;

            results.forEach((item, index) => {
                const type = item.contentType === 'tv_series' ? 'series' : item.contentType;
                const exactSearchLink = `https://z2.idlixku.com/${type}/${item.slug}`;

                const title = item.title || 'N/A';
                const year = item.releaseDate ? item.releaseDate.substring(0, 4) : (item.firstAirDate ? item.firstAirDate.substring(0, 4) : 'N/A');
                const rating = item.voteAverage || 'N/A';
                const genre = item.genres ? item.genres.join(', ') : 'N/A';

                responseText += `${index + 1}. 🎬 *${title}* (${year})\n`;
                responseText += `   ⭐ Rating: ${rating} | 🎭 ${genre}\n`;
                responseText += `   🔗 Link: ${exactSearchLink}\n\n`;
            });

            responseText += `💡 *Tip:* Silakan klik salah satu link di atas untuk langsung menuju halaman film tersebut!`;

            await sock.sendMessage(from, { text: responseText.trim() }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (err) {
            console.error('Idlix Search Error:', err.message);
            await sock.sendMessage(from, { text: `❌ Maaf, terjadi kesalahan saat mencari film "${query}". Coba lagi nanti!` }, { quoted: msg });
        }
    }
};