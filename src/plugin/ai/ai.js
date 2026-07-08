const { ScravBotApi } = require('../../lib/apimanager');

module.exports = {
    name: 'ai',
    aliases: ['chatgpt', 'bot'],
    limit: true,
    description: 'Ngobrol dengan AI (ChatGPT)',
    category: 'Artificial Intelligence',
    async execute(sock, msg, args) {
        const { from } = msg;
        const text = args.join(' ');

        if (!text) {
            await sock.sendMessage(from, { text: '❌ Apa yang ingin Anda tanyakan? Contoh: !ai Siapa penemu lampu?' }, { quoted: msg });
            return;
        }

        await sock.sendMessage(from, { text: '⏳ Berpikir...' }, { quoted: msg });

        try {
            // Menggunakan API dari Ourin API Manager (Ninerouter GPT-4o)
            const response = await ScravBotApi.ninerouter.chat('gpt-4o', text);
            const result = response?.choices?.[0]?.message?.content || response?.result || response?.data || 'Maaf, AI sedang pusing.';

            await sock.sendMessage(from, { text: result }, { quoted: msg });
        } catch (error) {
            console.error('AI Error:', error.message);
            await sock.sendMessage(from, { text: '❌ Terjadi kesalahan pada server AI.' }, { quoted: msg });
        }
    }
};
