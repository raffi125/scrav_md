const fs = require('fs');
const path = require('path');
const config = require('../../config');

const dbFolderUsers = path.join(__dirname, '..', '..', 'database', 'users');
const dbFolderPremium = path.join(__dirname, '..', '..', 'database', 'premium');
const dbFolderOwner = path.join(__dirname, '..', '..', 'database', 'owner');
const legacyDbPath = path.join(__dirname, '..', '..', 'database.json');
const legacyBackupPath = path.join(__dirname, '..', '..', 'database.json.bak');

const FREE_LIMIT = 20;

// Buat folder jika belum ada
const folders = [
    path.join(__dirname, '..', '..', 'database'),
    dbFolderUsers,
    dbFolderPremium,
    dbFolderOwner
];
for (const dir of folders) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Ekstrak nomor asli dari JID (misal: 628123456789@s.whatsapp.net -> 628123456789)
 */
function getPhone(jid) {
    if (!jid) return 'unknown';
    let number = jid.split('@')[0].split(':')[0];
    if (number.startsWith('62')) {
        number = '0' + number.slice(2);
    }
    return number;
}

/**
 * Cek apakah JID adalah Owner atau Bot
 */
function isOwnerJid(jid) {
    if (!jid) return false;
    const phone = getPhone(jid);
    if (phone === getPhone(config.ownerNumber)) return true;
    if (config.botNumber && phone === getPhone(config.botNumber)) return true;
    if (jid.includes(config.ownerNumber) || (config.botNumber && jid.includes(config.botNumber))) return true;
    return false;
}

/**
 * Cari file user di ketiga folder (Owner -> Premium -> Users)
 * Mengembalikan letak file saat ini, atau default (Users) jika tidak ditemukan
 */
function findUserFilePath(jid) {
    const phoneNumber = getPhone(jid);
    
    // Jika dia owner, maka path default-nya di folder owner
    if (isOwnerJid(jid)) return path.join(dbFolderOwner, `${phoneNumber}.json`);

    const ownerPath = path.join(dbFolderOwner, `${phoneNumber}.json`);
    const premiumPath = path.join(dbFolderPremium, `${phoneNumber}.json`);
    const usersPath = path.join(dbFolderUsers, `${phoneNumber}.json`);

    if (fs.existsSync(ownerPath)) return ownerPath;
    if (fs.existsSync(premiumPath)) return premiumPath;
    return usersPath; // Default fallback jika belum ada file
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
                    const filePath = findUserFilePath(jid);
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
    const filePath = findUserFilePath(jid);
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
 * Dapatkan target folder seharusnya berdasarkan status user
 */
function getTargetFolder(jid, userData) {
    if (isOwnerJid(jid)) return dbFolderOwner;
    if (userData.isPremium) return dbFolderPremium;
    return dbFolderUsers;
}

/**
 * Simpan data user ke file & Pindahkan file jika status tier (Owner/Premium/User) berubah
 */
function saveUser(jid, userData) {
    const currentPath = findUserFilePath(jid);
    const phoneNumber = getPhone(jid);
    const targetFolder = getTargetFolder(jid, userData);
    const targetPath = path.join(targetFolder, `${phoneNumber}.json`);

    try {
        // Jika file sudah ada tapi di folder yang salah (misal: user biasa baru beli premium)
        if (fs.existsSync(currentPath) && currentPath !== targetPath) {
            fs.unlinkSync(currentPath); // Hapus file lama di folder sebelumnya
        }
        
        fs.writeFileSync(targetPath, JSON.stringify(userData, null, 2));
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
    const expectedPath = path.join(getTargetFolder(jid, user), `${getPhone(jid)}.json`);
    if (!fs.existsSync(expectedPath)) {
        saveUser(jid, user);
    }

    return user;
}

/**
 * Kurangi limit user jika tidak premium
 */
function deductLimit(jid) {
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
    if (!fs.existsSync(dbFolderUsers)) return;
    
    const files = fs.readdirSync(dbFolderUsers);
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

async function isOwnerAsync(jid, sock) {
    if (!jid) return false;
    if (isOwnerJid(jid)) return true;
    if (!sock?.signalRepository?.lidMapping) return false;
    try {
        const pnJid = await sock.signalRepository.lidMapping.getPNForLID(jid);
        if (pnJid) {
            const phone = getPhone(pnJid);
            if (phone === getPhone(config.ownerNumber)) return true;
            if (config.botNumber && phone === getPhone(config.botNumber)) return true;
            if (pnJid.includes(config.ownerNumber) || (config.botNumber && pnJid.includes(config.botNumber))) return true;
        }
    } catch (_) {}
    return false;
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
    getPhone,
    isOwnerJid,
    isOwnerAsync
};
