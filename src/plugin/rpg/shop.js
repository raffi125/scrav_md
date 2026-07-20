const db = require('../../lib/database');

const items = {
    'potion': { name: '🧪 Potion', cost: 30, desc: 'Memulihkan HP ke 100%' },
    'sword': { name: '🗡️ Sword', cost: 150, desc: 'Meningkatkan Attack +5' },
    'armor': { name: '🛡️ Armor', cost: 200, desc: 'Meningkatkan Defense +3' }
};

module.exports = {
    name: 'shop',
    aliases: ['toko', 'buy'],
    description: 'Membeli perlengkapan RPG',
    category: 'RPG',
    async execute(sock, msg, args) {
        const { from, sender } = msg;
        const jid = sender || from;
        const user = db.getUser(jid);
        const itemToBuy = args[0] ? args[0].toLowerCase() : '';
        let amount = parseInt(args[1]) || 1;

        if (amount < 1) amount = 1;

        // Jika tidak ada argumen, tampilkan list barang
        if (!itemToBuy || !items[itemToBuy]) {
            let shopText = `🏪 *TOKO RPG* 🏪\n\nUangmu: 💰 ${user.uang}\n\n*Barang Tersedia:*\n`;
            for (const key in items) {
                shopText += `*${key}* - 💰 ${items[key].cost}\n└ ${items[key].name} (${items[key].desc})\n\n`;
            }
            shopText += `*Cara Beli:*\nKetik *!shop <namabarang> <jumlah>*\nContoh: *!shop potion 2*`;
            
            await msg.reply(shopText);
            return;
        }

        const selectedItem = items[itemToBuy];
        const totalCost = selectedItem.cost * amount;

        if (user.uang < totalCost) {
            await msg.reply(`❌ Uangmu tidak cukup untuk membeli ${amount}x ${selectedItem.name}.\nHarga total: 💰 ${totalCost}\nUangmu: 💰 ${user.uang}`);
            return;
        }

        // Proses pembelian
        user.uang -= totalCost;
        if (!user.inventory[itemToBuy]) user.inventory[itemToBuy] = 0;
        user.inventory[itemToBuy] += amount;
        
        db.saveUser(jid, user);
        
        await msg.reply(`✅ *PEMBELIAN BERHASIL*\n\nKamu membeli ${amount}x ${selectedItem.name} seharga 💰 ${totalCost}.\nSisa uangmu: 💰 ${user.uang}\n\nKetik *!profile* untuk melihat inventory.`);
    }
};
