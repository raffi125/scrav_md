const fs = require('fs');
const path = require('path');
const config = require('../../config');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

// Struktur default database
let db = {
    users: {}
};

// Limit gratis harian
const FREE_LIMIT = 20;

/**
 * Muat database dari file JSON.
 */
function loadDatabase() {
    if (fs.existsSync(dbPath)) {
        try {
            const data = fs.readFileSync(dbPath, 'utf8');
            db = JSON.parse(data);
            if (!db.users) db.users = {};
        } catch (err) {
            console.error('Gagal memuat database:', err);
        }
    } else {
        saveDatabase();
    }
}

/**
 * Simpan database ke file JSON.
 */
function saveDatabase() {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    } catch (err) {
        console.error('Gagal menyimpan database:', err);
    }
}

/**
 * Ambil data user, jika belum ada, buat baru.
 * @param {string} jid ID pengguna (misal 628xxx@s.whatsapp.net)
 */
function getUser(jid) {
    if (!db.users[jid]) {
        db.users[jid] = {
            limit: FREE_LIMIT,
            isPremium: false,
            premiumExpired: null, // timestamp atau 'LIFETIME'
            isBanned: false,
            spamCount: 0,
            lastMessage: 0,
            uang: 0,
            xp: 0,
            level: 1,
            lastDaily: 0,
            lastMancing: 0,
            inventory: {
                ikan: 0,
                sampah: 0,
                box: 0
            }
        };
        saveDatabase();
    }
    
    // Cek apakah premium sudah kadaluarsa
    const user = db.users[jid];
    if (user.isPremium && user.premiumExpired !== 'LIFETIME') {
        if (Date.now() > user.premiumExpired) {
            user.isPremium = false;
            user.premiumExpired = null;
            user.limit = FREE_LIMIT; // kembalikan ke limit gratis
            saveDatabase();
        }
    }

    return user;
}

/**
 * Kurangi limit user jika tidak premium
 * @param {string} jid
 * @returns {boolean} true jika sukses dipotong, false jika limit habis
 */
function deductLimit(jid) {
    // Owner kebal dari pemotongan limit (Unlimited)
    if (jid.includes(config.ownerNumber)) return true;

    const user = getUser(jid);
    if (user.isPremium) return true; // Premium tidak dipotong
    
    if (user.limit > 0) {
        user.limit -= 1;
        saveDatabase();
        return true;
    }
    return false; // Limit habis
}

/**
 * Tambahkan user sebagai premium
 * @param {string} jid 
 * @param {number|string} days jumlah hari, atau 'lifetime'
 */
function addPremium(jid, days) {
    const user = getUser(jid);
    user.isPremium = true;
    if (days === 'lifetime' || days === 'LIFETIME') {
        user.premiumExpired = 'LIFETIME';
    } else {
        // Jika sudah premium dan bukan lifetime, tambah harinya
        const now = Date.now();
        const currentExp = (user.premiumExpired && user.premiumExpired !== 'LIFETIME' && user.premiumExpired > now) 
                            ? user.premiumExpired 
                            : now;
        user.premiumExpired = currentExp + (parseInt(days) * 24 * 60 * 60 * 1000);
    }
    // Jika premium, limitnya bisa di-set ke Infinity atau biarkan saja karena dicek `isPremium`
    saveDatabase();
}

/**
 * Cabut status premium user
 * @param {string} jid 
 */
function delPremium(jid) {
    const user = getUser(jid);
    user.isPremium = false;
    user.premiumExpired = null;
    user.limit = FREE_LIMIT;
    saveDatabase();
}

/**
 * Reset limit semua user gratis setiap hari jam 00:00 (bisa dipanggil via cron)
 */
function resetAllLimits() {
    for (const jid in db.users) {
        const user = db.users[jid];
        if (!user.isPremium) {
            user.limit = FREE_LIMIT;
        }
    }
    saveDatabase();
}

// Muat database di awal
loadDatabase();

/**
 * Tangani Anti-Spam (Mencatat Waktu dan Banned Otomatis)
 * @param {string} jid 
 * @returns {boolean} true jika Banned, false jika Aman
 */
function handleAntiSpam(jid) {
    // Owner kebal dari sistem Anti-Spam (Banned Otomatis)
    if (jid.includes(config.ownerNumber)) return false;

    const user = getUser(jid);
    if (user.isBanned) return true;

    const now = Date.now();
    const timeDiff = now - user.lastMessage;

    if (timeDiff < 2000) {
        // Jika nge-chat command lagi dalam kurang dari 2 detik
        user.spamCount += 1;
        
        // Jika nyepam 4 kali berturut-turut, ban.
        if (user.spamCount >= 4) {
            user.isBanned = true;
            saveDatabase();
            return true;
        }
    } else {
        // Aman, reset spam count
        user.spamCount = 0;
    }

    user.lastMessage = now;
    saveDatabase();
    return false;
}

/**
 * Bebaskan user dari Banned
 * @param {string} jid 
 */
function unbanUser(jid) {
    const user = getUser(jid);
    user.isBanned = false;
    user.spamCount = 0;
    saveDatabase();
}

module.exports = {
    getUser,
    deductLimit,
    addPremium,
    delPremium,
    resetAllLimits,
    handleAntiSpam,
    unbanUser,
    FREE_LIMIT
};
