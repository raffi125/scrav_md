const fs = require('fs');

function _0x4ec1(){const _0x1e4b8c=['join','3MjhrJZ','measureText','textAlign','textBaseline','https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u','axios','width','4097130qIyCDW','read','jimp','toString','320KquSvk','from','getContext','2386988RhtQZU','index','emoji','loaded','get','fillStyle','https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64/','toLowerCase','existsSync','3781775WIYdfI','filter','https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/','text','638341qjODac','round','exec','arialnarrow.ttf','2071174GJHfBo','https://emojiapi.dev/api/v1/','use','trim','length','type','push','https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-160/','blur','all','arraybuffer','toBuffer','max','16114iclOzw','value','white','map','font','2926485WcBpPf','exports','getBufferAsync','?style=apple','codePointAt','https://emojicdn.elk.sh/','drawImage','BratNarrow','px\x20\x22','png','fillText','slice','path','https://github.com/gbif/analytics/raw/master/fonts/Arial%20Narrow.ttf','replace','skia-canvas','MIME_PNG','Teks\x20kosong','https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160/','split','.png','source','writeFileSync','Arial','words','set','alphabetic'];_0x4ec1=function(){return _0x1e4b8c;};return _0x4ec1();}
function _0x2602(_0x209770,_0x227ee1){const _0x4ec122=_0x4ec1();return _0x2602=function(_0x2602ee,_0x27322c){_0x2602ee=_0x2602ee-0x1f2;let _0x220ac2=_0x4ec122[_0x2602ee];return _0x220ac2;},_0x2602(_0x209770,_0x227ee1);}
(function(_0x1ca2f2,_0x50e3b0){const _0x38ad78=_0x2602,_0x3ec774=_0x1ca2f2();while(!![]){try{const _0x2378af=-parseInt(_0x38ad78(0x20c))/0x1+parseInt(_0x38ad78(0x210))/0x2+parseInt(_0x38ad78(0x23e))/0x3*(parseInt(_0x38ad78(0x1ff))/0x4)+parseInt(_0x38ad78(0x208))/0x5+-parseInt(_0x38ad78(0x1f8))/0x6+-parseInt(_0x38ad78(0x21d))/0x7*(parseInt(_0x38ad78(0x1fc))/0x8)+-parseInt(_0x38ad78(0x222))/0x9;if(_0x2378af===_0x50e3b0)break;else _0x3ec774['push'](_0x3ec774['shift']());}catch(_0x26092e){_0x3ec774['push'](_0x3ec774['shift']());}}}(_0x4ec1,0x9ec08));
const _0x3f2296=_0x2602;

let code = fs.readFileSync('C:/Users/Raffi/Kuliah_TI/coding_bot/BUTLER_MD_EDIT/lib/canvas/brat.js', 'utf8');

// Replace all function calls with string values
code = code.replace(/_0x[a-f0-9]+\((0x[a-f0-9]+)\)/g, (match, hex) => {
    try {
        const str = _0x3f2296(parseInt(hex));
        return JSON.stringify(str);
    } catch(e) {
        return match;
    }
});

// Also replace property access like ['push'] to .push
code = code.replace(/\['([a-zA-Z0-9_$]+)'\]/g, '.$1');

fs.writeFileSync('C:/Users/Raffi/Kuliah_TI/coding_bot/Scrav_MD/deobfuscated_brat.js', code);
console.log("Deobfuscation complete");
