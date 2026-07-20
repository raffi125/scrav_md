module.exports = {
    name: 'idlix',
    aliases: ['searchfilm', 'film', 'carifilm', 'idlixsearch'],
    limit: true,
    description: 'Mencari film di Idlix',
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
            // Sesuai request: Menggunakan cloudscraper (bypass) dan cheerio
            const cloudscraper = require('cloudscraper');
            const cheerio = require('cheerio');

            // Format URL search (ubah spasi jadi %20)
            let formattedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
            const urlQuery = formattedQuery.split(' ').join('%20');
            const searchUrl = `https://z2.idlixku.com/search?q=${urlQuery}`;

            const html = await cloudscraper.get(searchUrl);
            const $ = cheerio.load(html);

            const results = [];

            // Selector disesuaikan dengan struktur umum web streaming (bisa disesuaikan jika idlix ganti tema)
            $('.result-item, .item, article').each((i, el) => {
                const title = $(el).find('.title, .post-title, h2, h3').text().trim();
                const year = $(el).find('.year, .release-year, .date').text().trim() || 'N/A';
                const rating = $(el).find('.rating, .score').text().trim() || 'N/A';
                const genre = $(el).find('.genre, .genres, .term').text().trim() || 'N/A';
                
                // Ambil link menuju postingan tersebut
                const linkHref = $(el).find('a').attr('href');
                let link = searchUrl; // Fallback ke search URL jika link href tidak ditemukan
                if (linkHref) {
                     link = linkHref.startsWith('http') ? linkHref : `https://z2.idlixku.com${linkHref}`;
                }

                if (title) {
                    results.push({ title, year, rating, genre, link });
                }
            });

            if (results.length === 0) {
                // Pesan sesuai ketentuan jika tidak ada film
                await sock.sendMessage(from, { text: `❌ Maaf, tidak ada film yang cocok dengan pencarian '${query}' di Idlix. Coba periksa kembali ejaannya!` }, { quoted: msg });
                return;
            }

            let responseText = `🔍 *Hasil Pencarian untuk:* "${query}"\n\n`;

            results.forEach((item, index) => {
                // Link khusus sesuai dengan format yang diminta user (langsung ke halaman pencariannya lagi)
                // Jika ingin diarahkan langsung ke filmnya, gunakan item.link.
                // Tapi sesuai prompt sebelumnya: 🔗 Link: https://z2.idlixku.com/search?q=[judul+film+1+format+url]
                let itemFormattedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
                let itemUrlQuery = itemFormattedTitle.split(' ').join('%20');
                const exactSearchLink = `https://z2.idlixku.com/search?q=${itemUrlQuery}`;

                responseText += `${index + 1}. 🎬 *${item.title}* (${item.year})\n`;
                responseText += `   ⭐ Rating: ${item.rating} | 🎭 ${item.genre}\n`;
                responseText += `   🔗 Link: ${exactSearchLink}\n\n`;
            });

            responseText += `💡 *Tip:* Silakan klik salah satu link di atas untuk langsung menuju halaman pencarian film tersebut!`;

            await sock.sendMessage(from, { text: responseText.trim() }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (err) {
            console.error('Idlix Search Error:', err.message);
            await sock.sendMessage(from, { text: `❌ Maaf, terjadi kesalahan saat mencari film '${query}'. Pastikan modul cloudscraper & cheerio terinstal.` }, { quoted: msg });
        }
    }
};
