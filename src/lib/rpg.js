const db = require('./database');

/**
 * Cek dan tangani proses level up
 * @param {string} jid ID pengguna
 * @param {object} sock WhatsApp socket (untuk kirim notifikasi)
 * @param {object} msg Message object
 * @returns {boolean} true jika level up, false jika tidak
 */
async function checkLevelUp(jid, sock, msg) {
    let user = db.getUser(jid);
    
    // Formula XP ke Level: dibutuhkan 100 * (level ^ 1.5)
    let requiredXp = Math.floor(100 * Math.pow(user.level, 1.5));
    let leveledUp = false;
    let oldLevel = user.level;

    while (user.xp >= requiredXp) {
        user.xp -= requiredXp;
        user.level += 1;
        
        // Naikkan stats
        user.maxHp += 20;
        user.hp = user.maxHp; // Full heal saat naik level
        user.atk += 3;
        user.def += 2;
        
        leveledUp = true;
        requiredXp = Math.floor(100 * Math.pow(user.level, 1.5));
    }

    if (leveledUp) {
        db.saveUser(jid, user);
        try {
            await sock.sendMessage(msg.from, { 
                text: `🎉 *LEVEL UP!* 🎉\n\nSelamat, kamu naik dari level ${oldLevel} ke level ${user.level}!\n\n📈 *Stats Meningkat:*\n❤️ Max HP: ${user.maxHp}\n⚔️ Attack: ${user.atk}\n🛡️ Defense: ${user.def}`
            }, { quoted: msg });
        } catch (e) {}
    }
    
    return leveledUp;
}

/**
 * Kalkulasi damage yang diterima monster dan user
 * @param {number} userAtk 
 * @param {number} userDef 
 * @param {number} monsterAtk 
 * @param {number} monsterDef 
 * @returns {object} { damageToMonster, damageToUser }
 */
function calculateCombat(userAtk, userDef, monsterAtk, monsterDef) {
    // Damage = Atk - Def (Minimal 1)
    let damageToMonster = userAtk - monsterDef;
    if (damageToMonster < 1) damageToMonster = 1;
    
    // Variasi acak +- 20%
    damageToMonster = Math.floor(damageToMonster * (0.8 + Math.random() * 0.4));
    
    let damageToUser = monsterAtk - userDef;
    if (damageToUser < 1) damageToUser = 1;
    damageToUser = Math.floor(damageToUser * (0.8 + Math.random() * 0.4));
    
    return { damageToMonster, damageToUser };
}

module.exports = {
    checkLevelUp,
    calculateCombat
};
