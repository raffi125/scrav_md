module.exports = {
    menfess: {}, // Format: { "peserta1": "peserta2", "peserta2": "peserta1" }
    anonymous: {
        waiting: null, // JID orang yang sedang mencari pasangan
        chat: {}       // Format: { "peserta1": "peserta2", "peserta2": "peserta1" }
    },
    topdf: {},         // Format: { "jid": { images: [Buffer, Buffer], ... } }
    mergepdf: {}       // Format: { "jid": { pdfs: [Buffer, Buffer], ... } }
};
