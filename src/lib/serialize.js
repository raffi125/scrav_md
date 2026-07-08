/**
 * Fungsi utilitas untuk mengekstrak dan menyederhanakan object pesan dari Baileys
 * Mendukung ekstraksi untuk WA Regular maupun Business
 */

function serialize(msg, sock) {
    if (!msg.message) return msg;

    // Ambil kunci pertama (tipe pesan)
    const type = Object.keys(msg.message)[0];
    if (!type) return msg;

    msg.type = type;
    msg.from = msg.key.remoteJid;
    msg.isGroup = msg.from.endsWith('@g.us');
    msg.sender = msg.isGroup ? msg.key.participant : msg.from;
    msg.isFromMe = msg.key.fromMe;

    let body = '';

    // Ekstraksi teks dari berbagai format
    if (type === 'conversation') {
        body = msg.message.conversation;
    } else if (type === 'extendedTextMessage') {
        body = msg.message.extendedTextMessage.text;
    } else if (type === 'imageMessage') {
        body = msg.message.imageMessage.caption || '';
    } else if (type === 'videoMessage') {
        body = msg.message.videoMessage.caption || '';
    } else if (type === 'templateButtonReplyMessage') {
        body = msg.message.templateButtonReplyMessage.selectedId;
    } else if (type === 'listResponseMessage') {
        body = msg.message.listResponseMessage.singleSelectReply.selectedRowId;
    } else if (type === 'buttonsResponseMessage') {
        body = msg.message.buttonsResponseMessage.selectedButtonId;
    } else if (type === 'messageContextInfo') {
        // Terkadang ada extra wrapper di WA terbaru
        const nextType = Object.keys(msg.message)[1];
        if (nextType && msg.message[nextType]) {
            if (nextType === 'extendedTextMessage') body = msg.message[nextType].text;
            if (nextType === 'imageMessage') body = msg.message[nextType].caption;
        }
    }

    msg.body = body;

    // Helper functions
    if (sock) {
        msg.reply = async (text) => {
            return await sock.sendMessage(msg.from, { text }, { quoted: msg });
        };
        msg.react = async (emoji) => {
            return await sock.sendMessage(msg.from, { react: { text: emoji, key: msg.key } });
        };
    }

    return msg;
}

module.exports = { serialize };
