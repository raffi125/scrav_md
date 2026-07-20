const { ScravBotApi } = require('../../lib/apimanager');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

module.exports = {
    name: 'bratgreen',
    limit: true,
    description: 'Membuat stiker teks Brat Hijau',
    category: 'Sticker Maker',
    async execute(sock, msg, args) {
        const { from } = msg;
        const text = args.join(' ');
        if (!text) {
            await msg.react('❌');
            await msg.reply('❌ Harap sertakan teks.\nContoh: .bratgreen Halo');
            return;
        }
        await msg.react('⏳');
        try {
            const opt = { responseType: 'arraybuffer' };
            const buffer = await ScravBotApi.ScravBot.bratGreen(text, opt);
            if (!buffer || buffer.length < 100) throw new Error('Gagal mendapatkan gambar dari API');
            const sticker = new Sticker(buffer, { pack: 'SCRAVBOT', author: 'Bot Terkece', type: StickerTypes.FULL, quality: 50, background: 'transparent' });
            await sock.sendMessage(from, { sticker: await sticker.toBuffer() }, { quoted: msg });
            await msg.react('✅');
        } catch (error) {
            console.error('Brat Error:', error.message);
            await msg.react('❌');
        }
    }
};
