const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

try {
    const categories = {
        'Downloader': [
            { title: '!ytmp3', description: 'Download mp3', id: '!ytmp3' },
            { title: '!igdl Ⓛ', description: 'Download ig', id: '!igdl' } // 24 chars limit
        ]
    };

    const sections = [];
    for (const cat of Object.keys(categories).sort()) {
        sections.push({
            title: `⭐ ${cat.toUpperCase()}`,
            rows: categories[cat]
        });
    }

    const interactiveMessage = proto.Message.InteractiveMessage.create({
        body: proto.Message.InteractiveMessage.Body.create({ text: 'Hello' }),
        footer: proto.Message.InteractiveMessage.Footer.create({ text: 'Footer' }),
        header: proto.Message.InteractiveMessage.Header.create({ title: 'Title', subtitle: '', hasMediaAttachment: false }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            buttons: [
                {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "Pilih",
                        sections: sections
                    })
                }
            ]
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
