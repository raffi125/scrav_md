const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = {
    name: 'toimg',
    aliases: ['toimage'],
    limit: true,
    description: 'Mengubah stiker statis menjadi gambar',
    category: 'Converter',
    async execute(sock, msg, args) {
        const { from } = msg;

        const contextInfo = msg.message[msg.type]?.contextInfo;
        let targetMsg = null;
        let targetType = null;

        if (contextInfo && contextInfo.quotedMessage) {
            targetMsg = contextInfo.quotedMessage;
            targetType = Object.keys(targetMsg)[0];
        }

        if (!targetMsg || targetType !== 'stickerMessage') {
            await msg.reply('❌ Balas/reply stiker dengan perintah *!toimg*');
            return;
        }

        if (targetMsg.stickerMessage.isAnimated) {
            await msg.reply('❌ Tidak bisa mengubah stiker animasi/bergerak menjadi gambar. Fitur tovideo sedang dalam pengembangan.');
            return;
        }

        await msg.react('⏳');

        const randID = Math.random().toString(36).substring(2, 10);
        const inputPath = path.join(__dirname, `../../../tmp/${randID}.webp`);
        const outputPath = path.join(__dirname, `../../../tmp/${randID}.png`);

        try {
            // Pastikan folder tmp ada
            const tmpDir = path.join(__dirname, '../../../tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

            // Unduh stiker
            const stream = await downloadContentFromMessage(targetMsg[targetType], 'sticker');
            let buffer = Buffer.from([]);
            for await(const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            fs.writeFileSync(inputPath, buffer);

            // Eksekusi ffmpeg
            exec(`ffmpeg -i "${inputPath}" "${outputPath}"`, async (error) => {
                if (error) {
                    console.error('toimg error:', error);
                    await msg.react('❌');
                    await msg.reply('❌ Gagal mengonversi stiker ke gambar.');
                } else {
                    const resultBuffer = fs.readFileSync(outputPath);
                    await sock.sendMessage(from, { image: resultBuffer, caption: '✅ Konversi berhasil!' }, { quoted: msg });
                    await msg.react('✅');
                }

                // Cleanup
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            });

        } catch (error) {
            console.error('toimg Error:', error);
            await msg.react('❌');
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        }
    }
};
