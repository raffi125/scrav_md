const db = require('../../lib/database');

module.exports = {
    name: 'profile',
    aliases: ['stats', 'rpg'],
    description: 'Melihat status RPG dan inventory kamu',
    category: 'RPG',
    async execute(sock, msg, args) {
        const { from, sender, pushName } = msg;
        const jid = sender || from;
        const user = db.getUser(jid);
        const name = pushName || 'Player';

        // Kalkulasi XP ke level berikutnya
        const requiredXp = Math.floor(100 * Math.pow(user.level, 1.5));
        
        let profileText = `👑 *PROFILE RPG: ${name}* 👑\n\n`;
        
        profileText += `📊 *STATUS*\n`;
        profileText += `Level   : ${user.level}\n`;
        profileText += `XP      : ${user.xp} / ${requiredXp}\n`;
        profileText += `HP      : ${user.hp} / ${user.maxHp}\n`;
        profileText += `Attack  : ${user.atk}\n`;
        profileText += `Defense : ${user.def}\n`;
        profileText += `Uang    : 💰 ${user.uang}\n\n`;
        
        profileText += `🎒 *INVENTORY*\n`;
        profileText += `🧪 Potion : ${user.inventory.potion || 0}\n`;
        profileText += `🗡️ Sword  : ${user.inventory.sword || 0}\n`;
        profileText += `🛡️ Armor  : ${user.inventory.armor || 0}\n`;
        profileText += `🐟 Ikan   : ${user.inventory.ikan || 0}\n`;
        profileText += `🗑️ Sampah : ${user.inventory.sampah || 0}\n`;
        profileText += `📦 Box    : ${user.inventory.box || 0}\n\n`;
        
        profileText += `*Tips:* Ketik *!hunt* untuk berburu monster, *!heal* untuk memulihkan HP, dan *!shop* untuk membeli item.`;

        await sock.sendMessage(from, { text: profileText }, { quoted: msg });
    }
};
