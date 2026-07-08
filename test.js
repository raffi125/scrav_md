const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

try {
    const interactiveMessage = proto.Message.InteractiveMessage.create({
        body: proto.Message.InteractiveMessage.Body.create({ text: 'Hello' }),
        footer: proto.Message.InteractiveMessage.Footer.create({ text: 'Footer' }),
        header: proto.Message.InteractiveMessage.Header.create({ title: 'Title', subtitle: '', hasMediaAttachment: false }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            buttons: [{ name: "quick_reply", buttonParamsJson: '{"display_text":"Test","id":"test"}' }]
        })
    });

    const msgContent = {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage
            }
        }
    };

    const waMsg = generateWAMessageFromContent('123@s.whatsapp.net', msgContent, { userJid: '456@s.whatsapp.net' });
    console.log("Success:", !!waMsg.message);
} catch (e) {
    console.error("Error:", e);
}
