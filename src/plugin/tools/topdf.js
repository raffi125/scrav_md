const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { PDFDocument } = require('pdf-lib');
const session = require('../../lib/session');

module.exports = {
    name: 'topdf',
    aliases: ['pdf'],
    limit: true,
    description: 'Mengubah satu atau banyak gambar menjadi file PDF',
    category: 'Converter',
    async execute(sock, msg, args) {
        const { from, sender } = msg;
        const jid = sender || from;
        const subCommand = args[0] ? args[0].toLowerCase() : '';

        // --- SISTEM SESI MULTI-IMAGE ---
        if (subCommand === 'start') {
            if (session.topdf[jid]) {
                await msg.reply('⚠️ Anda sedang dalam sesi topdf. Kirim gambar atau ketik *!topdf finish*');
                return;
            }
            session.topdf[jid] = { images: [], from: from };
            await msg.reply('✅ Sesi *topdf* dimulai.\nSilakan kirimkan gambar-gambar (foto) satu per satu tanpa command apapun.\nKetik *!topdf finish* jika semua gambar sudah dikirim.');
            return;
        }

        if (subCommand === 'finish') {
            if (!session.topdf[jid]) {
                await msg.reply('⚠️ Anda belum memulai sesi. Ketik *!topdf start* dulu.');
                return;
            }
            const data = session.topdf[jid];
            
            if (data.images.length === 0) {
                await msg.reply('⚠️ Anda belum mengirimkan gambar satupun. Sesi dibatalkan.');
                delete session.topdf[jid];
                return;
            }

            await msg.react('⏳');
            await msg.reply(`Tunggu sebentar, sedang memproses ${data.images.length} gambar menjadi PDF...`);

            try {
                const pdfDoc = await PDFDocument.create();
                
                for (const imgBuffer of data.images) {
                    try {
                        // Coba parse sebagai JPG dulu, kalau gagal coba PNG
                        let img;
                        try {
                            img = await pdfDoc.embedJpg(imgBuffer);
                        } catch (e) {
                            img = await pdfDoc.embedPng(imgBuffer);
                        }
                        
                        const { width, height } = img.scale(1);
                        const page = pdfDoc.addPage([width, height]);
                        page.drawImage(img, {
                            x: 0,
                            y: 0,
                            width: width,
                            height: height,
                        });
                    } catch (err) {
                        console.error('Gagal embed gambar ke PDF:', err);
                    }
                }

                const pdfBytes = await pdfDoc.save();
                const pdfBuffer = Buffer.from(pdfBytes);

                await sock.sendMessage(data.from, { 
                    document: pdfBuffer, 
                    mimetype: 'application/pdf', 
                    fileName: `ScravBot_${Date.now()}.pdf`
                }, { quoted: msg });

                await msg.react('✅');
            } catch (err) {
                console.error('Error generate multi-pdf:', err);
                await msg.reply('❌ Terjadi kesalahan saat membuat PDF.');
                await msg.react('❌');
            }

            // Hapus sesi
            delete session.topdf[jid];
            return;
        }

        // --- SINGLE IMAGE TO PDF ---
        let targetMsg = msg.message;
        let targetType = msg.type;

        const contextInfo = msg.message[msg.type]?.contextInfo;
        if (contextInfo && contextInfo.quotedMessage) {
            targetMsg = contextInfo.quotedMessage;
            targetType = Object.keys(targetMsg)[0];
        }

        if (targetType !== 'imageMessage') {
            await msg.reply('❌ Kirim/reply gambar dengan *!topdf* untuk 1 gambar.\nAtau ketik *!topdf start* untuk multi-gambar.');
            return;
        }

        await msg.react('⏳');
        try {
            const stream = await downloadContentFromMessage(targetMsg[targetType], 'image');
            let buffer = Buffer.from([]);
            for await(const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const pdfDoc = await PDFDocument.create();
            let img;
            try {
                img = await pdfDoc.embedJpg(buffer);
            } catch (e) {
                img = await pdfDoc.embedPng(buffer);
            }
            
            const { width, height } = img.scale(1);
            const page = pdfDoc.addPage([width, height]);
            page.drawImage(img, { x: 0, y: 0, width: width, height: height });

            const pdfBytes = await pdfDoc.save();
            
            await sock.sendMessage(from, { 
                document: Buffer.from(pdfBytes), 
                mimetype: 'application/pdf', 
                fileName: `Image_${Date.now()}.pdf`
            }, { quoted: msg });
            await msg.react('✅');

        } catch (error) {
            console.error('topdf Error:', error);
            await msg.reply('❌ Gagal mengonversi gambar ke PDF.');
            await msg.react('❌');
        }
    },

    // Fungsi khusus untuk menangkap pesan gambar saat sesi topdf aktif
    async handleSession(sock, msg, sessionData) {
        if (msg.type === 'imageMessage') {
            await msg.react('⏳');
            try {
                const stream = await downloadContentFromMessage(msg.message.imageMessage, 'image');
                let buffer = Buffer.from([]);
                for await(const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                
                sessionData.images.push(buffer);
                await msg.react('✅');
                
                // Beri notif silent atau kecil
                await sock.sendMessage(msg.from, { 
                    text: `📸 Gambar ke-${sessionData.images.length} diterima.\nKetik *!topdf finish* jika sudah selesai.` 
                }, { quoted: msg });
            } catch (err) {
                await msg.react('❌');
            }
        }
    }
};
