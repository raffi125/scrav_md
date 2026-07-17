const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = {
    name: 'tomp3',
    aliases: ['toaudio'],
    limit: true,
    description: 'Mengubah video atau voice note menjadi audio mp3',
    category: 'Converter',
    async execute(sock, msg, args) {
        const { from } = msg;

        let targetMsg = msg.message;
        let targetType = msg.type;

        // Cek apakah me-reply
        const contextInfo = msg.message[msg.type]?.contextInfo;
        if (contextInfo && contextInfo.quotedMessage) {
            targetMsg = contextInfo.quotedMessage;
            targetType = Object.keys(targetMsg)[0];
        }

        if (targetType !== 'videoMessage' && targetType !== 'audioMessage') {
            await msg.reply('❌ Kirim atau balas video/audio dengan perintah *!tomp3*');
            return;
        }

        await msg.react('⏳');

        const randID = Math.random().toString(36).substring(2, 10);
        const ext = targetType === 'videoMessage' ? 'mp4' : 'ogg';
        const inputPath = path.join(__dirname, `../../../tmp/${randID}.${ext}`);
        const outputPath = path.join(__dirname, `../../../tmp/${randID}.mp3`);

        try {
            const tmpDir = path.join(__dirname, '../../../tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

            const mediaType = targetType === 'videoMessage' ? 'video' : 'audio';
            const stream = await downloadContentFromMessage(targetMsg[targetType], mediaType);
            let buffer = Buffer.from([]);
            for await(const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            fs.writeFileSync(inputPath, buffer);

            // Eksekusi ffmpeg untuk ekstrak audio dan convert ke mp3
            exec(`ffmpeg -i "${inputPath}" -q:a 0 -map a "${outputPath}"`, async (error) => {
                if (error) {
                    console.error('tomp3 error:', error);
                    await msg.react('❌');
                    await msg.reply('❌ Gagal mengonversi ke MP3.');
                } else {
                    const resultBuffer = fs.readFileSync(outputPath);
                    await sock.sendMessage(from, { 
                        audio: resultBuffer, 
                        mimetype: 'audio/mp4' 
                    }, { quoted: msg });
                    await msg.react('✅');
                }

                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            });

        } catch (error) {
            console.error('tomp3 Error:', error);
            await msg.react('❌');
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        }
    }
};
