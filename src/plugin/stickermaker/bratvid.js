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
            const { bratVid } = require('brat-canvas/video');
            const buffer = await bratVid(text, {
                outputFormat: 'mp4',
                fast_progress: true
            });
            
            if (!buffer || buffer.length < 100) throw new Error('Gagal merender video');
            
            // Konversi MP4/GIF buffer menjadi Animated Sticker WebP
            const sticker = new Sticker(buffer, { 
                pack: 'SCRAVBOT', 
                author: 'Bot Terkece', 
                type: StickerTypes.FULL, 
                quality: 30, // Turunkan sedikit quality agar sizenya tidak terlalu besar untuk stiker WA
                background: 'transparent' 
            });
            
            const stikerBuffer = await sticker.toBuffer();
            await sock.sendMessage(from, { sticker: stikerBuffer  }, { quoted: msg });
            await msg.react('✅');
        } catch (error) {
            console.error('BratVid Error:', error.message);
            await msg.react('❌');
        }
    }
};
