const axios = require('axios');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

module.exports = {
    name: 'brat',
    limit: true,
    description: 'Membuat stiker teks bergaya Brat putih',
    category: 'Sticker Maker',
    async execute(sock, msg, args) {
        const { from } = msg;
        const text = args.join(' ');
        if (!text) {
            await msg.react('❌');
            await msg.reply('❌ Harap sertakan teks.\nContoh: .brat Halo Semua');
            return;
        }
        await msg.react('⏳');
        try {
            const url = `https://api.nexray.eu.cc/maker/brat?text=${encodeURIComponent(text)}`;
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            
            const sticker = new Sticker(response.data, { pack: 'SCRAVBOT', author: 'Bot Terkece', type: StickerTypes.FULL, quality: 50, background: 'transparent' });
            await sock.sendMessage(from, { sticker: await sticker.toBuffer()  }, { quoted: msg });
            await msg.react('✅');
        } catch (error) {
            console.error('Brat Error:', error.message);
            await msg.react('❌');
        }
    }
};
