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
            const { bratGen } = require('brat-canvas');
            const buffer = await bratGen(text, { C_BG: '#8ACE00', BLUR: 6, FS_MAX: 400, BOX_PAD: 60, LINE_H: 1.0 });
            
            const sticker = new Sticker(buffer, { pack: 'SCRAVBOT', author: 'Bot Terkece', type: StickerTypes.FULL, quality: 50, background: 'transparent' });
            await sock.sendMessage(from, { sticker: await sticker.toBuffer()  }, { quoted: msg });
            await msg.react('✅');
        } catch (error) {
            console.error('Brat Error:', error.message);
            await msg.react('❌');
        }
    }
};
