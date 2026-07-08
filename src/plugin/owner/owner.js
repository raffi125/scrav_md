const config = require('../../../config');

module.exports = {
    name: 'owner',
    aliases: ['creator'],
    description: 'Mengirimkan kontak Owner',
    category: 'General',
    async execute(sock, msg, args) {
        const vcard = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${config.ownerName} (Owner ${config.botName})\n` +
                      `ORG:${config.botName} Inc;\n` +
                      `TEL;type=CELL;type=VOICE;waid=${config.ownerNumber}:+${config.ownerNumber}\n` + 
                      'END:VCARD';

        await sock.sendMessage(msg.from, {
            contacts: {
                displayName: `${config.ownerName} (Owner)`,
                contacts: [{ vcard }]
            }
        }, { quoted: msg });
    }
};
