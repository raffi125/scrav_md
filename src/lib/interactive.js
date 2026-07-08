const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

/**
 * Membangun dan mengirim pesan Interaktif NativeFlowMessage murni dengan Baileys v7
 * @param {Object} sock Instance bot
 * @param {String} jid Tujuan (msg.from)
 * @param {Object} content Konten { title, body, footer }
 * @param {Array} buttons Array tombol [{ type, text, id, title, sections, url, copy_code }]
 * @param {Object} msg Pesan untuk di-quote
 */
async function sendInteractive(sock, jid, content, buttons, msg = null) {
    const nativeFlowButtons = buttons.map(btn => {
        if (btn.type === 'reply') {
            return {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: btn.text,
                    id: btn.id || "btn"
                })
            };
        } else if (btn.type === 'list') {
            return {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: btn.text || "Pilih Menu",
                    sections: btn.sections
                })
            };
        } else if (btn.type === 'url') {
            return {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: btn.text,
                    url: btn.url,
                    merchant_url: btn.url
                })
            };
        } else if (btn.type === 'copy') {
            return {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                    display_text: btn.text,
                    id: "copy_code",
                    copy_code: btn.copy_code
                })
            };
        }
    }).filter(Boolean);

    const interactiveMessage = proto.Message.InteractiveMessage.create({
        body: proto.Message.InteractiveMessage.Body.create({
            text: content.body || ''
        }),
        footer: proto.Message.InteractiveMessage.Footer.create({
            text: content.footer || 'ScravBot MD'
        }),
        header: proto.Message.InteractiveMessage.Header.create({
            title: content.title || '',
            subtitle: '',
            hasMediaAttachment: false
        }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            buttons: nativeFlowButtons
        })
    });

    const msgContent = {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage
            }
        }
    };

    // Pastikan JID adalah remoteJid asli
    const targetJid = msg ? msg.key.remoteJid : jid;

    const waMsg = generateWAMessageFromContent(targetJid, msgContent, { quoted: msg, userJid: sock.user.id });

    // Inject tag khusus 'biz' secara manual di relayMessage agar tidak ditolak WA
    // Disertakan berbagai kombinasi agar tidak miss
    await sock.relayMessage(targetJid, waMsg.message, { 
        messageId: waMsg.key.id,
        additionalNodes: [
            {
                tag: "biz",
                attrs: {},
                content: [
                    {
                        tag: "interactive",
                        attrs: {
                            type: "native_flow",
                            v: "1"
                        },
                        content: [
                            { tag: "native_flow", attrs: { name: "quick_reply" } },
                            { tag: "native_flow", attrs: { name: "single_select" } },
                            { tag: "native_flow", attrs: { name: "cta_url" } },
                            { tag: "native_flow", attrs: { name: "cta_copy" } }
                        ]
                    }
                ]
            }
        ]
    });
}

module.exports = { sendInteractive };
