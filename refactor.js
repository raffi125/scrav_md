const fs = require('fs');
const path = require('path');

const dir = 'src/plugin/stickermaker';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // 1. Loading
    content = content.replace(/await sock\.sendMessage\(from,\s*\{\s*text:\s*(['"`])⏳[^'"`]+\1\s*\},\s*\{\s*quoted:\s*msg\s*\}\);/g, 
        "await msg.react('⏳');");
        
    // 2. Catch Error (❌ Gagal...) -> Just react
    content = content.replace(/await sock\.sendMessage\(from,\s*\{\s*text:\s*(['"`])❌ Gagal[^'"`]*\1\s*\},\s*\{\s*quoted:\s*msg\s*\}\);/g,
        "await msg.react('❌');");
        
    // 3. Other Rejection (❌ Harap sertakan / ❌ Kirim gambar...) -> React + Reply
    content = content.replace(/await sock\.sendMessage\(from,\s*\{\s*text:\s*((['"`])❌[^'"`]*\2)\s*\},\s*\{\s*quoted:\s*msg\s*\}\);/g, 
        "await msg.react('❌');\n            await msg.reply($1);");
        
    // 4. Success Sticker Sent
    content = content.replace(/await sock\.sendMessage\(from,\s*\{\s*sticker:\s*([^}]+)\s*\},\s*\{\s*quoted:\s*msg\s*\}\);/g,
        "await sock.sendMessage(from, { sticker: $1 }, { quoted: msg });\n            await msg.react('✅');");
        
    fs.writeFileSync(path.join(dir, file), content);
    console.log('Refactored ' + file);
});
