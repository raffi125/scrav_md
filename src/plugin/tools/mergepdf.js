const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { PDFDocument } = require('pdf-lib');
const session = require('../../lib/session');

module.exports = {
    name: 'mergepdf',
    aliases: ['pdfmerge'],
    limit: true,
    description: 'Menggabungkan beberapa file PDF menjadi satu',
    category: 'Converter',
    async execute(sock, msg, args) {
        const { from, sender } = msg;
        const jid = sender || from;
        const subCommand = args[0] ? args[0].toLowerCase() : '';

        // --- SISTEM SESI MULTI-PDF ---
        if (subCommand === 'start') {
            if (session.mergepdf[jid]) {
                await msg.reply('⚠️ Anda sedang dalam sesi mergepdf. Kirim file PDF atau ketik *!mergepdf finish*');
                return;
            }
            session.mergepdf[jid] = { pdfs: [], from: from };
            await msg.reply('✅ Sesi *mergepdf* dimulai.\nSilakan kirimkan dokumen PDF satu per satu tanpa command apapun.\nKetik *!mergepdf finish* jika semua file sudah dikirim.');
            return;
        }

        if (subCommand === 'finish') {
            if (!session.mergepdf[jid]) {
                await msg.reply('⚠️ Anda belum memulai sesi. Ketik *!mergepdf start* dulu.');
                return;
            }
            const data = session.mergepdf[jid];
            
            if (data.pdfs.length < 2) {
                await msg.reply('⚠️ Anda harus mengirim minimal 2 file PDF untuk digabung. Sesi dibatalkan.');
                delete session.mergepdf[jid];
                return;
            }

            await msg.react('⏳');
            await msg.reply(`Tunggu sebentar, sedang menggabungkan ${data.pdfs.length} file PDF...`);

            try {
                const mergedPdf = await PDFDocument.create();

                for (const pdfBuffer of data.pdfs) {
                    try {
                        const pdfToMerge = await PDFDocument.load(pdfBuffer);
                        const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
                        
                        for (const page of copiedPages) {
                            mergedPdf.addPage(page);
                        }
                    } catch (err) {
                        console.error('Gagal meload/copy page PDF:', err);
                    }
                }

                const pdfBytes = await mergedPdf.save();
                const resultBuffer = Buffer.from(pdfBytes);

                await sock.sendMessage(data.from, { 
                    document: resultBuffer, 
                    mimetype: 'application/pdf', 
                    fileName: `Merged_${Date.now()}.pdf`
                }, { quoted: msg });

                await msg.react('✅');
            } catch (err) {
                console.error('Error generate merged-pdf:', err);
                await msg.reply('❌ Terjadi kesalahan saat menggabungkan PDF.');
                await msg.react('❌');
            }

            // Hapus sesi
            delete session.mergepdf[jid];
            return;
        }

        await msg.reply('ℹ️ *Cara Menggunakan Merge PDF:*\n1. Ketik *!mergepdf start*\n2. Kirim 2 atau lebih file PDF\n3. Ketik *!mergepdf finish*');
    },

    // Fungsi khusus untuk menangkap pesan dokumen PDF saat sesi mergepdf aktif
    async handleSession(sock, msg, sessionData) {
        if (msg.type === 'documentMessage') {
            const doc = msg.message.documentMessage;
            if (doc.mimetype !== 'application/pdf') {
                await msg.reply('⚠️ Mohon kirimkan file dengan format PDF.');
                return;
            }

            await msg.react('⏳');
            try {
                const stream = await downloadContentFromMessage(doc, 'document');
                let buffer = Buffer.from([]);
                for await(const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                
                sessionData.pdfs.push(buffer);
                await msg.react('✅');
                
                // Beri notif
                await sock.sendMessage(msg.from, { 
                    text: `📑 PDF ke-${sessionData.pdfs.length} diterima.\nKetik *!mergepdf finish* jika sudah selesai.` 
                }, { quoted: msg });
            } catch (err) {
                await msg.react('❌');
            }
        }
    }
};
