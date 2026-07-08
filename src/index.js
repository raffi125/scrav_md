const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const cfonts = require('cfonts');
const { startAutoCleanTemp } = require('./lib/temp');
// const { messageHandler } = require('./handler'); // Dihapus karena akan di-require dinamis
const { customLogger } = require('./lib/logger');
let config = require('../config');

// Logger untuk baileys
const logger = pino({ level: 'silent' });

async function startSCRAVBOT() {
    // Jalankan auto clean temp (setiap 1 jam)
    startAutoCleanTemp(3600000);

    // Welcome Banner yang Keren
    console.clear();
    cfonts.say(config.botName, {
        font: 'block',
        align: 'center',
        colors: ['cyan', 'blue'],
        background: 'transparent',
        letterSpacing: 1,
        lineHeight: 1,
        space: true,
        maxLength: '0',
    });
    cfonts.say(`Created by ${config.ownerName} | Base: Scrav_MD`, {
        font: 'console',
        align: 'center',
        colors: ['yellow'],
    });
    console.log('\n=======================================================\n');

    customLogger.info(`Memulai ${config.botName} (Plugin-Based)...`);

    // Setup Chokidar Watcher
    const watcher = chokidar.watch([path.join(__dirname, 'plugin'), path.join(__dirname, 'handler.js'), path.join(__dirname, '..', 'config.js')], {
        ignored: /(^|[\/\\])\../,
        persistent: true
    });

    watcher.on('change', (filePath) => {
        const fileName = path.basename(filePath);
        customLogger.warn(`[WATCHER] Perubahan terdeteksi pada ${fileName}`);
        
        try {
            if (fileName === 'config.js') {
                delete require.cache[require.resolve('../config.js')];
                config = require('../config.js');
                customLogger.info('Config berhasil direload!');
            } else if (fileName === 'handler.js') {
                delete require.cache[require.resolve('./handler.js')];
                customLogger.info('Handler berhasil direload!');
                require('./handler').loadPlugins(); // reload handler plugin
            } else if (filePath.includes('plugin')) {
                // Reload plugin tertentu
                delete require.cache[require.resolve(filePath)];
                // Panggil ulang loadPlugins agar plugins object terupdate
                require('./handler').loadPlugins();
                customLogger.info(`Plugin ${fileName} berhasil direload!`);
            }
        } catch (err) {
            customLogger.error(`Gagal reload ${fileName}: ${err.message}`);
        }
    });

    const { version, isLatest } = await fetchLatestBaileysVersion();
    customLogger.info(`Menggunakan WA v${version.join('.')}, isLatest: ${isLatest}`);

    // Auth info diletakkan di root project (../session relatif terhadap src/)
    const authDir = path.join(__dirname, '..', 'session');
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    // Setup socket
    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        browser: Browsers.ubuntu('Chrome'),
        generateHighQualityLinkPreview: true,
    });

    // Fitur Pairing Code
    if (!sock.authState.creds.registered) {
        console.log(`\n--- ${config.botName} PAIRING ---`);
        
        let phoneNumber = config.botNumber.replace(/[^0-9]/g, '');
        if (!phoneNumber) {
            customLogger.error('Nomor bot tidak valid di config.js. Silakan perbaiki dan restart aplikasi.');
            process.exit(0);
        }

        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                customLogger.success(`\n> PAIRING CODE ANDA: ${code}`);
                customLogger.info('> Buka WhatsApp > Tautkan Perangkat > Tautkan dengan Nomor Telepon');
            } catch (err) {
                customLogger.error(`Gagal mendapatkan pairing code: ${err.message}`);
            }
        }, 3000);
    }

    // Listener Koneksi
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            customLogger.warn(`Koneksi terputus. Alasan: ${lastDisconnect.error?.message} | Reconnecting: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                startSCRAVBOT();
            } else {
                customLogger.error('Anda telah logout. Silakan hapus folder "session" dan jalankan ulang.');
                process.exit(0);
            }
        } else if (connection === 'open') {
            // KILL SWITCH / ANTI-CLONE
            const currentNum = sock.user.id.split(':')[0];
            const expectedNum = config.botNumber.replace(/[^0-9]/g, '');
            
            if (currentNum !== expectedNum) {
                customLogger.error(`[KILL SWITCH] Nomor login (${currentNum}) BEDA dengan config (${expectedNum}).`);
                customLogger.error(`[KILL SWITCH] Menghapus folder session dan mematikan sistem...`);
                try {
                    fs.rmSync(path.join(__dirname, '..', 'session'), { recursive: true, force: true });
                } catch (e) {}
                process.exit(1);
            }

            customLogger.success(`${config.botName} berhasil terhubung!`);
        }
    });

    // Simpan Kredensial
    sock.ev.on('creds.update', saveCreds);

    // Menangani Pesan Masuk
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        for (const msg of messages) {
            if (!msg.message) continue;
            
            try {
                // Gunakan require dinamis agar jika handler.js berubah, fungsi barunya langsung terpanggil
                await require('./handler').messageHandler(sock, msg);
            } catch (err) {
                customLogger.error(`Error handling message: ${err.message}`);
            }
        }
    });
}

startSCRAVBOT();
