module.exports = {
    name: 'info',
    description: 'Menampilkan informasi bot SCRAVBOT',
    category: 'General',
    async execute(sock, msg, args) {
        const infoText = `🤖 *SCRAVBOT INFO*\n\n` +
                         `Status: Aktif\n` +
                         `Tipe Akun: Multi-Device\n` +
                         `Arsitektur: Plugin-Based\n` +
                         `Platform: Mendukung WA Regular & Business\n\n` +
                         `_Dibuat dengan Baileys_`;
                         
        await sock.sendMessage(msg.from, { text: infoText }, { quoted: msg });
    }
};
