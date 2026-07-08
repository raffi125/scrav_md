const axios = require('axios');

module.exports = {
    name: 'translate',
    aliases: ['tr'],
    description: 'Menerjemahkan teks (Google Translate)',
    category: 'Lainnya',
    async execute(sock, msg, args) {
        const { from } = msg;
        
        if (args.length < 2) {
            await sock.sendMessage(from, { text: '❌ Format salah. Contoh: !tr id good morning' }, { quoted: msg });
            return;
        }

        const lang = args[0];
        const text = args.slice(1).join(' ');

        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await axios.get(url);
            
            const result = response.data[0].map(x => x[0]).join('');
            
            await sock.sendMessage(from, { text: `*Terjemahan (${lang}):*\n${result}` }, { quoted: msg });
        } catch (error) {
            console.error('Translate Error:', error.message);
            await sock.sendMessage(from, { text: '❌ Gagal menerjemahkan teks.' }, { quoted: msg });
        }
    }
};
