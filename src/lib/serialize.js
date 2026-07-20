/**
 * Fungsi utilitas untuk mengekstrak dan menyederhanakan object pesan dari Baileys
 * Mendukung ekstraksi untuk WA Regular maupun Business
 */

function serialize(msg, sock) {
    if (!msg.message) return msg;

    // Normalisasi: unwrap ephemeral / viewOnce / document dengan context
    let msgContent = msg.message;
    if (msgContent.ephemeralMessage?.message) {
        msgContent = msgContent.ephemeralMessage.message;
    } else if (msgContent.viewOnceMessage?.message) {
        msgContent = msgContent.viewOnceMessage.message;
    } else if (msgContent.documentWithCaptionMessage?.message) {
        msgContent = msgContent.documentWithCaptionMessage.message;
    }

    // Ambil kunci pertama yang bukan 'messageContextInfo' jika ada
    const allKeys = Object.keys(msgContent);
    let type = allKeys[0];

    // Jika key pertama adalah messageContextInfo, cari key konten yang sesungguhnya
    if (type === 'messageContextInfo') {
        const contentKey = allKeys.find(k => k !== 'messageContextInfo');
        if (contentKey) type = contentKey;
    }

    if (!type) return msg;

    msg.type = type;
    msg.from = msg.key.remoteJid;
    msg.isGroup = msg.from.endsWith('@g.us');
    
    // Logika standar Baileys untuk mendapatkan sender yang benar (terutama untuk pesan fromMe)
    const botId = sock?.user?.id ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : '';
    msg.sender = msg.key.fromMe ? (botId || msg.from) : (msg.isGroup ? msg.key.participant : msg.from);
    msg.isFromMe = msg.key.fromMe;

    let body = '';

    // Ekstraksi teks dari berbagai format
    if (type === 'conversation') {
        body = msgContent.conversation || '';
    } else if (type === 'extendedTextMessage') {
        body = msgContent.extendedTextMessage?.text || '';
    } else if (type === 'imageMessage') {
        body = msgContent.imageMessage?.caption || '';
    } else if (type === 'videoMessage') {
        body = msgContent.videoMessage?.caption || '';
    } else if (type === 'documentMessage') {
        body = msgContent.documentMessage?.caption || '';
    } else if (type === 'templateButtonReplyMessage') {
        body = msgContent.templateButtonReplyMessage?.selectedId || '';
    } else if (type === 'listResponseMessage') {
        body = msgContent.listResponseMessage?.singleSelectReply?.selectedRowId || '';
    } else if (type === 'buttonsResponseMessage') {
        body = msgContent.buttonsResponseMessage?.selectedButtonId || '';
    } else if (type === 'interactiveResponseMessage') {
        body = msgContent.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson || '';
    }

    msg.body = body || '';

    // Helper functions
    if (sock) {
        msg.reply = async (text) => {
            return await sock.sendMessage(msg.from, { text }, { quoted: msg });
        };
        msg.react = (emoji) => {
            sock.sendMessage(msg.from, { react: { text: emoji, key: msg.key } }).catch(() => {});
        };
    }

    return msg;
}

module.exports = { serialize };
