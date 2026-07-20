const db = require('../../lib/database');
const rpg = require('../../lib/rpg');

const monsters = [
    { name: '🟢 Slime', hp: 30, atk: 5, def: 2, xp: 15, uang: 10 },
    { name: '🦇 Bat', hp: 45, atk: 8, def: 3, xp: 25, uang: 20 },
    { name: '🐺 Wolf', hp: 70, atk: 12, def: 5, xp: 40, uang: 35 },
    { name: '🧟 Zombie', hp: 100, atk: 15, def: 8, xp: 60, uang: 50 },
    { name: '👹 Orc', hp: 150, atk: 25, def: 12, xp: 100, uang: 80 },
    { name: '🐉 Dragon', hp: 500, atk: 50, def: 30, xp: 300, uang: 250 }
];

module.exports = {
    name: 'hunt',
    aliases: ['adventure', 'berburu'],
    description: 'Berburu monster untuk mendapatkan XP dan Uang',
    category: 'RPG',
    limit: true,
    async execute(sock, msg, args) {
        const { from, sender } = msg;
        const jid = sender || from;
        const user = db.getUser(jid);

        // Cooldown 3 Menit
        const cooldown = 3 * 60 * 1000;
        const now = Date.now();
        if (now - (user.lastHunt || 0) < cooldown) {
            const sisa = Math.ceil((cooldown - (now - user.lastHunt)) / 1000);
            await msg.reply(`⏳ Kamu masih kelelahan. Tunggu ${sisa} detik lagi untuk berburu.`);
            return;
        }

        if (user.hp <= 0) {
            await msg.reply(`💀 HP kamu 0! Kamu tidak bisa berburu. Ketik *!heal* untuk memulihkan HP.`);
            return;
        }

        // Pilih monster acak berdasarkan level user (semakin tinggi level, musuh lebih sulit)
        let availableMonsters = monsters.filter(m => m.hp <= (user.level * 40 + 50));
        if (availableMonsters.length === 0) availableMonsters = [monsters[0]];
        const monster = availableMonsters[Math.floor(Math.random() * availableMonsters.length)];

        await msg.reply(`🔍 Mencari monster...\nKamu bertemu dengan *${monster.name}*!\n\n⚔️ Memulai pertarungan...`);
        await new Promise(r => setTimeout(r, 2000));

        // Total Attack pengguna (base + sword)
        const userTotalAtk = user.atk + (user.inventory.sword * 5);
        // Total Def pengguna (base + armor)
        const userTotalDef = user.def + (user.inventory.armor * 3);

        const combatResult = rpg.calculateCombat(userTotalAtk, userTotalDef, monster.atk, monster.def);
        let monsterHpLeft = monster.hp - combatResult.damageToMonster;
        let userHpLeft = user.hp - combatResult.damageToUser;

        let resultText = `⚔️ *PERTARUNGAN SELESAI* ⚔️\n\n`;
        resultText += `Kamu menyerang *${monster.name}* dan memberikan ${combatResult.damageToMonster} DMG.\n`;
        resultText += `*${monster.name}* menyerang balik dan memberikan ${combatResult.damageToUser} DMG!\n\n`;

        user.lastHunt = now;

        if (userHpLeft <= 0) {
            user.hp = 0;
            // Penalti kematian
            const xpLost = Math.floor(user.xp * 0.1);
            const uangLost = Math.floor(user.uang * 0.1);
            user.xp -= xpLost;
            if (user.xp < 0) user.xp = 0;
            user.uang -= uangLost;
            if (user.uang < 0) user.uang = 0;

            resultText += `💀 *KAMU MATI!* 💀\nSisa HP Monster: ${monsterHpLeft > 0 ? monsterHpLeft : 0}\n\n`;
            resultText += `Kamu kehilangan ${xpLost} XP dan 💰 ${uangLost} Uang saat melarikan diri.\n`;
            resultText += `Gunakan *!heal* untuk memulihkan dirimu.`;
            
            db.saveUser(jid, user);
            await sock.sendMessage(from, { text: resultText }, { quoted: msg });
            return;
        }

        if (monsterHpLeft <= 0) {
            user.hp = userHpLeft;
            user.xp += monster.xp;
            user.uang += monster.uang;

            resultText += `🎉 *KAMU MENANG!* 🎉\n`;
            resultText += `Sisa HP kamu: ❤️ ${user.hp} / ${user.maxHp}\n\n`;
            resultText += `🎁 *Loot:*\n+ ${monster.xp} XP\n+ 💰 ${monster.uang} Uang`;

            // Kesempatan 20% dapat Potion
            if (Math.random() < 0.2) {
                user.inventory.potion = (user.inventory.potion || 0) + 1;
                resultText += `\n+ 🧪 1x Potion`;
            }

            db.saveUser(jid, user);
            await sock.sendMessage(from, { text: resultText }, { quoted: msg });
            
            // Cek level up
            await rpg.checkLevelUp(jid, sock, msg);
            return;
        }

        // Draw (Keduanya masih hidup)
        user.hp = userHpLeft;
        resultText += `⚖️ *SERI!* Keduanya melarikan diri.\n`;
        resultText += `Sisa HP kamu: ❤️ ${user.hp} / ${user.maxHp}\n`;
        resultText += `Sisa HP Monster: ${monsterHpLeft}\n\n`;
        resultText += `Kamu hanya mendapat sedikit hadiah...\n+ ${Math.floor(monster.xp/3)} XP`;
        
        user.xp += Math.floor(monster.xp/3);
        db.saveUser(jid, user);
        
        await sock.sendMessage(from, { text: resultText }, { quoted: msg });
        await rpg.checkLevelUp(jid, sock, msg);
    }
};
