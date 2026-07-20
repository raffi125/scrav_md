const { ScravBotApi } = require('../../lib/apimanager');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

module.exports = {
    name: 'bratvid',
    limit: true,
    description: 'Membuat stiker animasi/video bergaya Brat',
    category: 'Sticker Maker',
    async execute(sock, msg, args) {
        const { from } = msg;
        const text = args.join(' ');
        if (!text) {
            await msg.react('❌');
            await msg.reply('❌ Harap sertakan teks.\nContoh: .bratvid Halo Semua');
            return;
        }
        await msg.react('⏳');
        try {
            const opt = { responseType: 'arraybuffer' };
            const buffer = await ScravBotApi.apiFaa.bratvid(text, opt);
            if (!buffer || buffer.length < 100) throw new Error('Gagal merender video');
            const sticker = new Sticker(buffer, { 
                pack: 'SCRAVBOT', 
                author: 'Bot Terkece', 
                type: StickerTypes.FULL, 
                quality: 30,
                background: 'transparent' 
            });
            const stikerBuffer = await sticker.toBuffer();
            await sock.sendMessage(from, { sticker: stikerBuffer }, { quoted: msg });
            await msg.react('✅');
        } catch (error) {
            console.error('BratVid Error:', error.message);
            await msg.react('❌');
        }
    }
};
