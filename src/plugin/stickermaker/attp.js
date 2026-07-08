const { ScravBotApi } = require('../../lib/apimanager');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const axios = require('axios');

module.exports = {
    name: 'attp',
    aliases: ['ttp'],
    limit: true,
    description: 'Membuat stiker animasi teks berkedip',
    category: 'Sticker Maker',
    async execute(sock, msg, args) {
        const { from } = msg;
        const text = args.join(' ');

        if (!text) {
            await msg.react('❌');
            await msg.reply('❌ Harap sertakan teks.\nContoh: !attp Halo');
            return;
        }

        await msg.react('⏳');

        try {
            let buffer;

            try {
                // Seringkali Neoxr API mengembalikan buffer gif secara langsung jika diakses dengan responseType: arraybuffer
                buffer = await ScravBotApi.neoxr.attp3({ text: text }, { responseType: 'arraybuffer' });
            } catch (err) {
                console.log('[ATTP] Neoxr fallback:', err.message);
            }

            // Fallback API gratis jika Neoxr gagal atau limit
            if (!buffer || buffer.length < 1000) {
                const url = `https://aemt.me/attp?text=${encodeURIComponent(text)}`;
                const res = await axios.get(url, { responseType: 'arraybuffer' });
                buffer = res.data;
            }

            if (!buffer) throw new Error('Gagal mendapatkan gambar dari API');

            // Buat stiker
            const sticker = new Sticker(buffer, {
                pack: 'SCRAVBOT', 
                author: 'Bot Terkece', 
                type: StickerTypes.FULL, 
                quality: 50,
                background: 'transparent'
            });

            const stikerBuffer = await sticker.toBuffer();

            // Kirim stiker
            await sock.sendMessage(from, { sticker: stikerBuffer  }, { quoted: msg });
            await msg.react('✅');

        } catch (error) {
            console.error('ATTP Error:', error.message);
            await msg.react('❌');
        }
    }
};
