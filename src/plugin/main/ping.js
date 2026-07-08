module.exports = {
    name: 'ping',
    description: 'Mengecek apakah bot aktif',
    category: 'General',
    async execute(sock, msg, args) {
        await sock.sendMessage(msg.from, { 
            text: 'Pong! 🏓\nSCRAVBOT is online and running.' 
        }, { quoted: msg });
    }
};
