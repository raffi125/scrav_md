const fs = require('fs');
const path = require('path');
const config = require('../../config');

const dbFolder = path.join(__dirname, '..', '..', 'database', 'users');
const legacyDbPath = path.join(__dirname, '..', '..', 'database.json');
const legacyBackupPath = path.join(__dirname, '..', '..', 'database.json.bak');

const FREE_LIMIT = 999999; // Dibuat unlimited sementara agar tidak stress

// Buat folder jika belum ada
if (!fs.existsSync(path.join(__dirname, '..', '..', 'database'))) {
    fs.mkdirSync(path.join(__dirname, '..', '..', 'database'), { recursive: true });
}
if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

/**
 * Ekstrak nomor asli dari JID (misal: 628123456789@s.whatsapp.net -> 628123456789)
 */
function getPhone(jid) {
    if (!jid) return 'unknown';
    // Hapus device string seperti :12 dan domain @s.whatsapp.net
    let number = jid.split('@')[0].split(':')[0];
    if (number.startsWith('62')) {
        number = '0' + number.slice(2);
    }
    return number;
}

/**
 * Ambil file path untuk user tertentu
 */
function getUserFilePath(jid) {
    const phoneNumber = getPhone(jid);
    return path.join(dbFolder, `${phoneNumber}.json`);
}

/**
 * Migrasi dari database.json lama ke sistem per-file
 */
function migrateDatabase() {
    if (fs.existsSync(legacyDbPath)) {
        try {
            console.log('🔄 Memulai migrasi database lama...');
            const data = fs.readFileSync(legacyDbPath, 'utf8');
            const db = JSON.parse(data);
            
            if (db.users) {
                let count = 0;
                for (const jid in db.users) {
                    const filePath = getUserFilePath(jid);
                    // Jangan overwrite jika user sudah punya file baru
                    if (!fs.existsSync(filePath)) {
                        fs.writeFileSync(filePath, JSON.stringify(db.users[jid], null, 2));
                        count++;
                    }
                }
                console.log(`✅ Migrasi selesai: ${count} user dipindahkan.`);
            }
            
            // Rename file lama sebagai backup
            fs.renameSync(legacyDbPath, legacyBackupPath);
            console.log('💾 File database.json lama telah di-backup menjadi database.json.bak');
        } catch (err) {
            console.error('❌ Gagal melakukan migrasi database:', err);
        }
    }
}

// Jalankan migrasi saat startup
migrateDatabase();

/**
 * Muat data user dari file. Jika belum ada, kembalikan format default.
 */
function loadUser(jid) {
    const filePath = getUserFilePath(jid);
    if (fs.existsSync(filePath)) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.error(`Gagal memuat data user ${jid}:`, err);
        }
    }
    
    // Default user data
    return {
        limit: FREE_LIMIT,
        isPremium: false,
        premiumExpired: null,
        isBanned: false,
        spamCount: 0,
        lastMessage: 0,
        uang: 0,
        xp: 0,
        level: 1,
        hp: 100,
        maxHp: 100,
        atk: 10,
        def: 5,
        lastDaily: 0,
        lastMancing: 0,
        lastHunt: 0,
        inventory: {
            ikan: 0,
            sampah: 0,
            box: 0,
            potion: 0,
            sword: 0,
            armor: 0
        }
    };
}

/**
 * Simpan data user ke file
 */
function saveUser(jid, userData) {
    const filePath = getUserFilePath(jid);
    try {
        fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
    } catch (err) {
        console.error(`Gagal menyimpan data user ${jid}:`, err);
    }
}

/**
 * Ambil data user, evaluasi premium.
 */
function getUser(jid) {
    const user = loadUser(jid);
    
    // Cek apakah premium sudah kadaluarsa
    if (user.isPremium && user.premiumExpired !== 'LIFETIME') {
        if (Date.now() > user.premiumExpired) {
            user.isPremium = false;
            user.premiumExpired = null;
            user.limit = FREE_LIMIT; // kembalikan ke limit gratis
            saveUser(jid, user);
        }
    }

    // Untuk memastikan file dibuat jika ini user baru
    if (!fs.existsSync(getUserFilePath(jid))) {
        saveUser(jid, user);
    }

    return user;
}

/**
 * Kurangi limit user jika tidak premium
 */
function deductLimit(jid) {
    return true; // SEMENTARA SEMUA ORANG UNLIMITED BIAR GA STRESS
    
    if (!jid) return false;
    
    const phone = getPhone(jid);
    if (phone === getPhone(config.ownerNumber)) return true;
    if (config.botNumber && phone === getPhone(config.botNumber)) return true;
    
    // Fallback original includes check just in case
    if (jid.includes(config.ownerNumber) || jid.includes(config.botNumber)) return true;

    const user = getUser(jid);
    if (user.isPremium) return true;
    
    if (user.limit > 0) {
        user.limit -= 1;
        saveUser(jid, user);
        return true;
    }
    return false; // Limit habis
}

/**
 * Tambahkan user sebagai premium
 */
function addPremium(jid, days) {
    const user = getUser(jid);
    user.isPremium = true;
    if (days === 'lifetime' || days === 'LIFETIME') {
        user.premiumExpired = 'LIFETIME';
    } else {
        const now = Date.now();
        const currentExp = (user.premiumExpired && user.premiumExpired !== 'LIFETIME' && user.premiumExpired > now) 
                            ? user.premiumExpired 
                            : now;
        user.premiumExpired = currentExp + (parseInt(days) * 24 * 60 * 60 * 1000);
    }
    saveUser(jid, user);
}

/**
 * Cabut status premium user
 */
function delPremium(jid) {
    const user = getUser(jid);
    user.isPremium = false;
    user.premiumExpired = null;
    user.limit = FREE_LIMIT;
    saveUser(jid, user);
}

/**
 * Reset limit semua user gratis setiap hari
 */
function resetAllLimits() {
    if (!fs.existsSync(dbFolder)) return;
    
    const files = fs.readdirSync(dbFolder);
    for (const file of files) {
        if (file.endsWith('.json')) {
            const jid = file.replace('.json', '') + '@s.whatsapp.net';
            const user = loadUser(jid);
            if (!user.isPremium) {
                user.limit = FREE_LIMIT;
                saveUser(jid, user);
            }
        }
    }
}

/**
 * Tangani Anti-Spam
 */
function handleAntiSpam(jid) {
    if (!jid) return false;
    
    const phone = getPhone(jid);
    if (phone === getPhone(config.ownerNumber)) return false;
    if (config.botNumber && phone === getPhone(config.botNumber)) return false;
    
    // Fallback original includes check just in case
    if (jid.includes(config.ownerNumber) || jid.includes(config.botNumber)) return false;

    const user = getUser(jid);
    if (user.isBanned) return true;

    const now = Date.now();
    const timeDiff = now - user.lastMessage;

    if (timeDiff < 2000) {
        user.spamCount += 1;
        if (user.spamCount >= 4) {
            user.isBanned = true;
            saveUser(jid, user);
            return true;
        }
    } else {
        user.spamCount = 0;
    }

    user.lastMessage = now;
    saveUser(jid, user);
    return false;
}

/**
 * Bebaskan user dari Banned
 */
function unbanUser(jid) {
    const user = getUser(jid);
    user.isBanned = false;
    user.spamCount = 0;
    saveUser(jid, user);
}

module.exports = {
    getUser,
    deductLimit,
    addPremium,
    delPremium,
    resetAllLimits,
    handleAntiSpam,
    unbanUser,
    FREE_LIMIT,
    getPhone
};
