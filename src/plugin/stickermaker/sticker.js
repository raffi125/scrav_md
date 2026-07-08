const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

module.exports = {
    name: 'sticker',
    aliases: ['s'],
    limit: true,
    description: 'Membuat stiker dari gambar atau video pendek',
    category: 'Sticker Maker',
    async execute(sock, msg, args) {
        const { from } = msg;

        // Mencari message yang mengandung media (baik dikirim langsung dengan caption, atau di-reply)
        let isImage = msg.type === 'imageMessage';
        let isVideo = msg.type === 'videoMessage';
        
        let targetMsg = msg.message;
        let targetType = msg.type;

        // Jika user me-reply pesan
        const contextInfo = msg.message[msg.type]?.contextInfo;
        if (contextInfo && contextInfo.quotedMessage) {
            targetMsg = contextInfo.quotedMessage;
            targetType = Object.keys(targetMsg)[0];
            isImage = targetType === 'imageMessage';
            isVideo = targetType === 'videoMessage';
        }

        if (!isImage && !isVideo) {
            await msg.react('❌');
            await msg.reply('❌ Kirim gambar/video dengan caption !sticker, atau reply gambar/video dengan perintah !sticker.');
            return;
        }

        await msg.react('⏳');

        try {
            // Unduh media
            const mediaType = isImage ? 'image' : 'video';
            const stream = await downloadContentFromMessage(targetMsg[targetType], mediaType);
            
            let buffer = Buffer.from([]);
            for await(const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Buat stiker
            const sticker = new Sticker(buffer, {
                pack: 'SCRAVBOT', // Nama pack
                author: 'Bot Terkece', // Nama pembuat
                type: StickerTypes.FULL, 
                quality: 50, // Kualitas
                background: 'transparent'
            });

            const stikerBuffer = await sticker.toBuffer();

            // Kirim stiker
            await sock.sendMessage(from, { sticker: stikerBuffer  }, { quoted: msg });
            await msg.react('✅');

        } catch (error) {
            console.error('Sticker Error:', error);
            await msg.react('❌');
        }
    }
};
