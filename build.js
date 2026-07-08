const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

console.log('Memulai proses Obfuscation (Enkripsi Kode)...');

const targetFiles = [
    'config.js',
    'src/index.js',
    'src/handler.js'
];

const outputDir = path.join(__dirname, 'obfuscated_build');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
    fs.mkdirSync(path.join(outputDir, 'src'));
}

targetFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        const code = fs.readFileSync(fullPath, 'utf8');
        const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            debugProtection: false,
            disableConsoleOutput: false,
            identifierNamesGenerator: 'hexadecimal',
            renameGlobals: false,
            stringArray: true,
            stringArrayEncoding: ['base64'],
            stringArrayThreshold: 0.75,
            unicodeEscapeSequence: false
        });

        const outputPath = path.join(outputDir, file);
        fs.writeFileSync(outputPath, obfuscationResult.getObfuscatedCode());
        console.log(`✅ Berhasil mengenkripsi: ${file}`);
    } else {
        console.log(`❌ File tidak ditemukan: ${file}`);
    }
});

console.log(`\n🎉 Selesai! File yang aman siap dijual ada di folder: ${outputDir}`);
