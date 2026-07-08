const fs = require('fs');
const path = require('path');
const { customLogger } = require('./logger');

const tempDir = path.join(__dirname, '..', '..', 'temp');

/**
 * Memastikan folder temp ada, jika tidak, dibuat.
 */
function initTemp() {
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        customLogger.info('Folder temp berhasil dibuat.');
    }
}

/**
 * Menghapus semua isi file di dalam folder temp.
 */
function clearTemp() {
    initTemp();
    try {
        const files = fs.readdirSync(tempDir);
        let deleted = 0;
        for (const file of files) {
            const filePath = path.join(tempDir, file);
            if (fs.lstatSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
                deleted++;
            }
        }
        if (deleted > 0) {
            customLogger.info(`Berhasil membersihkan ${deleted} file di folder temp.`);
        }
    } catch (err) {
        customLogger.error(`Gagal membersihkan temp: ${err.message}`);
    }
}

/**
 * Menjadwalkan pembersihan folder temp setiap X ms.
 * Secara default setiap 1 jam (3600000 ms).
 */
function startAutoCleanTemp(intervalMs = 3600000) {
    // Bersihkan saat startup
    clearTemp();
    
    setInterval(() => {
        clearTemp();
    }, intervalMs);
}

module.exports = { initTemp, clearTemp, startAutoCleanTemp };
