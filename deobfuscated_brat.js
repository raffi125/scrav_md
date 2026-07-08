"use strict";
const _0x3f2296 = _0x2602;
(function (_0x1ca2f2, _0x50e3b0) {
  const _0x38ad78 = _0x2602,
    _0x3ec774 = _0x1ca2f2();
  while (!![]) {
    try {
      const _0x2378af =
        -parseInt("638341qjODac") / 0x1 +
        parseInt("2071174GJHfBo") / 0x2 +
        (parseInt("3MjhrJZ") / 0x3) * (parseInt("2386988RhtQZU") / 0x4) +
        parseInt("3781775WIYdfI") / 0x5 +
        -parseInt("4097130qIyCDW") / 0x6 +
        (-parseInt("16114iclOzw") / 0x7) * (parseInt("320KquSvk") / 0x8) +
        -parseInt("2926485WcBpPf") / 0x9;
      if (_0x2378af === _0x50e3b0) break;
      else _0x3ec774.push(_0x3ec774.shift());
    } catch (_0x26092e) {
      _0x3ec774.push(_0x3ec774.shift());
    }
  }
})(_0x4ec1, 0x9ec08);
const path = require("path"),
  fs = require("fs"),
  FONT_PATH = path["join"](__dirname, "arialnarrow.ttf"),
  FONT_URL =
    "https://github.com/gbif/analytics/raw/master/fonts/Arial%20Narrow.ttf",
  FONT_ALIAS = "BratNarrow",
  _fontState = { loaded: ![] },
  EMOJI_RE =
    /(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200D(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*|[\u{1F1E0}-\u{1F1FF}]{2}|[#*0-9]\uFE0F?\u20E3/gu;
async function _ensureFont() {
  const _0x5d9526 = _0x3f2296;
  if (_fontState["loaded"]) return;
  const { FontLibrary: _0x224770 } = require("skia-canvas");
  if (!fs["existsSync"](FONT_PATH)) {
    const _0xf43193 = require("axios"),
      _0x439785 = await _0xf43193["get"](FONT_URL, {
        responseType: "arraybuffer",
        timeout: 0x61a8,
      });
    fs["writeFileSync"](FONT_PATH, Buffer["from"](_0x439785.data));
  }
  try {
    (_0x224770["use"](FONT_ALIAS, FONT_PATH), (_fontState["loaded"] = !![]));
  } catch {}
}
function _emojiCodepoint(_0x107440) {
  const _0x45bfb1 = _0x3f2296,
    _0x5d20d5 = [];
  let _0x12e24f = 0x0;
  while (_0x12e24f < _0x107440["length"]) {
    const _0x41b90f = _0x107440.codePointAt(_0x12e24f);
    (_0x41b90f !== undefined &&
      _0x41b90f !== 0xfe0f &&
      _0x41b90f !== 0x200d &&
      _0x5d20d5.push(_0x41b90f["toString"](0x10)["toLowerCase"]()),
      (_0x12e24f += _0x41b90f !== undefined && _0x41b90f > 0xffff ? 0x2 : 0x1));
  }
  return _0x5d20d5.join("-");
}
function _0x2602(_0x209770, _0x227ee1) {
  const _0x4ec122 = _0x4ec1();
  return (
    (_0x2602 = function (_0x2602ee, _0x27322c) {
      _0x2602ee = _0x2602ee - 0x1f2;
      let _0x220ac2 = _0x4ec122[_0x2602ee];
      return _0x220ac2;
    }),
    _0x2602(_0x209770, _0x227ee1)
  );
}
function _emojiCodepointFull(_0x7236e4) {
  const _0x3be67c = _0x3f2296,
    _0x2632d7 = [];
  let _0x229577 = 0x0;
  while (_0x229577 < _0x7236e4["length"]) {
    const _0xfe627 = _0x7236e4.codePointAt(_0x229577);
    (_0xfe627 !== undefined &&
      _0xfe627 !== 0xfe0f &&
      _0x2632d7["push"](_0xfe627["toString"](0x10).toLowerCase()),
      (_0x229577 += _0xfe627 !== undefined && _0xfe627 > 0xffff ? 0x2 : 0x1));
  }
  return _0x2632d7.join("-");
}
function _emojiCodepointZwj(_0x540845) {
  const _0x3b6de1 = _0x3f2296,
    _0x27afa0 = [];
  let _0x5d7d30 = 0x0;
  while (_0x5d7d30 < _0x540845["length"]) {
    const _0x24fce7 = _0x540845["codePointAt"](_0x5d7d30);
    if (_0x24fce7 !== undefined)
      _0x27afa0["push"](_0x24fce7["toString"](0x10)["toLowerCase"]());
    _0x5d7d30 += _0x24fce7 !== undefined && _0x24fce7 > 0xffff ? 0x2 : 0x1;
  }
  return _0x27afa0.join("-");
}
const _imgCache = new Map();
async function _fetchEmoji(_0x440c42) {
  const _0x3e34a7 = _0x3f2296,
    _0x18318c = _emojiCodepoint(_0x440c42);
  if (_imgCache.has(_0x18318c)) return _imgCache["get"](_0x18318c);
  const { loadImage: _0x752725 } = require("skia-canvas"),
    _0x3b6900 = _0x18318c,
    _0xde6f82 = _emojiCodepointFull(_0x440c42),
    _0x56dba6 = _emojiCodepointZwj(_0x440c42),
    _0x1f2bf7 = _0x440c42["replace"](/\uFE0F/g, ""),
    _0x256166 = _emojiCodepoint(_0x1f2bf7),
    _0x1d8355 = encodeURIComponent(_0x440c42),
    _0x53fec7 = [
      "https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-160/" +
        _0x3b6900 +
        ".png",
      "https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-160/" +
        _0xde6f82 +
        ".png",
      "https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-160/" +
        _0x256166 +
        ".png",
      "https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160/" +
        _0x3b6900 +
        ".png",
      "https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160/" +
        _0xde6f82 +
        ".png",
      "https://emojicdn.elk.sh/" + _0x1d8355 + "?style=apple",
      "https://emojicdn.elk.sh/" +
        encodeURIComponent(_0x1f2bf7) +
        "?style=apple",
      "https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64/" +
        _0x3b6900 +
        ".png",
      "https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64/" +
        _0xde6f82 +
        ".png",
      "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u" +
        _0x3b6900["replace"](/-/g, "_") +
        ".png",
      "https://emojiapi.dev/api/v1/" + _0x3b6900 + "/160.png",
      "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/" +
        _0x3b6900 +
        ".png",
    ];
  for (const _0x5bcc16 of _0x53fec7) {
    try {
      const _0x2be48c = await _0x752725(_0x5bcc16);
      if (_0x2be48c && _0x2be48c.width > 0x0)
        return (_imgCache["set"](_0x18318c, _0x2be48c), _0x2be48c);
    } catch {}
  }
  return (_imgCache["set"](_0x18318c, null), null);
}
function _tokenize(_0x3cac43) {
  const _0x480a0b = _0x3f2296,
    _0x1cb29b = [];
  let _0x222b26 = 0x0;
  const _0x2474e9 = new RegExp(EMOJI_RE["source"], "gu");
  let _0x4681ad;
  while ((_0x4681ad = _0x2474e9["exec"](_0x3cac43)) !== null) {
    if (_0x4681ad["index"] > _0x222b26) {
      const _0x1b7c92 = _0x3cac43["slice"](_0x222b26, _0x4681ad["index"]);
      if (_0x1b7c92["trim"]())
        _0x1cb29b["push"]({ type: "text", value: _0x1b7c92.trim() });
    }
    (_0x1cb29b["push"]({ type: "emoji", value: _0x4681ad[0x0] }),
      (_0x222b26 = _0x4681ad["index"] + _0x4681ad[0x0]["length"]));
  }
  if (_0x222b26 < _0x3cac43["length"]) {
    const _0x36a3d1 = _0x3cac43.slice(_0x222b26).trim();
    if (_0x36a3d1) _0x1cb29b["push"]({ type: "text", value: _0x36a3d1 });
  }
  return _0x1cb29b;
}
function _0x4ec1() {
  const _0x1e4b8c = [
    "join",
    "3MjhrJZ",
    "measureText",
    "textAlign",
    "textBaseline",
    "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u",
    "axios",
    "width",
    "4097130qIyCDW",
    "read",
    "jimp",
    "toString",
    "320KquSvk",
    "from",
    "getContext",
    "2386988RhtQZU",
    "index",
    "emoji",
    "loaded",
    "get",
    "fillStyle",
    "https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64/",
    "toLowerCase",
    "existsSync",
    "3781775WIYdfI",
    "filter",
    "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/",
    "text",
    "638341qjODac",
    "round",
    "exec",
    "arialnarrow.ttf",
    "2071174GJHfBo",
    "https://emojiapi.dev/api/v1/",
    "use",
    "trim",
    "length",
    "type",
    "push",
    "https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-160/",
    "blur",
    "all",
    "arraybuffer",
    "toBuffer",
    "max",
    "16114iclOzw",
    "value",
    "white",
    "map",
    "font",
    "2926485WcBpPf",
    "exports",
    "getBufferAsync",
    "?style=apple",
    "codePointAt",
    "https://emojicdn.elk.sh/",
    "drawImage",
    "BratNarrow",
    "px\x20\x22",
    "png",
    "fillText",
    "slice",
    "path",
    "https://github.com/gbif/analytics/raw/master/fonts/Arial%20Narrow.ttf",
    "replace",
    "skia-canvas",
    "MIME_PNG",
    "Teks\x20kosong",
    "https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160/",
    "split",
    ".png",
    "source",
    "writeFileSync",
    "Arial",
    "words",
    "set",
    "alphabetic",
  ];
  _0x4ec1 = function () {
    return _0x1e4b8c;
  };
  return _0x4ec1();
}
function _wordsFromTokens(_0x242e0a) {
  const _0x363a01 = _0x3f2296,
    _0x5f16f5 = [];
  for (const _0x2ca048 of _0x242e0a) {
    if (_0x2ca048.type === "emoji")
      _0x5f16f5.push({ type: "emoji", value: _0x2ca048.value });
    else {
      const _0xfc49e4 = _0x2ca048["value"]["split"](/\s+/)["filter"](Boolean);
      for (const _0x318bb4 of _0xfc49e4)
        _0x5f16f5["push"]({ type: "text", value: _0x318bb4 });
    }
  }
  return _0x5f16f5;
}
function _measureWord(_0x3e389d, _0x372dcf, _0x3cfdf7) {
  const _0x205dd1 = _0x3f2296;
  if (_0x372dcf.type === "emoji") return _0x3cfdf7;
  return _0x3e389d["measureText"](_0x372dcf["value"])["width"];
}
function _buildLines(_0x1b3196, _0x444014, _0x489957, _0x26a1d6, _0x4051ac) {
  const _0x4b89ea = _0x3f2296,
    _0x43d807 = [];
  let _0x15833e = [],
    _0x347894 = 0x0;
  for (const _0x4c06eb of _0x444014) {
    const _0x15b4a1 = _measureWord(_0x1b3196, _0x4c06eb, _0x26a1d6),
      _0x5330b2 = _0x15833e["length"] > 0x0 ? _0x4051ac + _0x15b4a1 : _0x15b4a1;
    _0x347894 + _0x5330b2 > _0x489957 && _0x15833e["length"] > 0x0
      ? (_0x43d807["push"]({ words: _0x15833e, width: _0x347894 }),
        (_0x15833e = [_0x4c06eb]),
        (_0x347894 = _0x15b4a1))
      : (_0x15833e["push"](_0x4c06eb), (_0x347894 += _0x5330b2));
  }
  if (_0x15833e["length"] > 0x0)
    _0x43d807.push({ words: _0x15833e, width: _0x347894 });
  return _0x43d807;
}
async function generateBrat(_0x5d3bb2) {
  const _0x25fac5 = _0x3f2296,
    { Canvas: _0x1ba943 } = require("skia-canvas"),
    _0x419045 = require("jimp");
  await _ensureFont();
  const _0xe0f251 = _fontState["loaded"] ? FONT_ALIAS : "Arial",
    _0x1b4ea0 = String(_0x5d3bb2 || "")["trim"]();
  if (!_0x1b4ea0) throw new Error("Teks kosong");
  const _0x2e706d = _tokenize(_0x1b4ea0),
    _0x52d377 = _wordsFromTokens(_0x2e706d),
    _0x18bcce = [
      ...new Set(
        _0x52d377["filter"]((_0x8a0ba2) => _0x8a0ba2["type"] === "emoji")[
          "map"
        ]((_0x5adb99) => _0x5adb99["value"]),
      ),
    ];
  await Promise["all"](_0x18bcce["map"]((_0x15b977) => _fetchEmoji(_0x15b977)));
  const _0x5bd531 = 0x400,
    _0x24dd35 = 0x400,
    _0x5c8d5d = 0x30,
    _0x4777dc = 0x2c,
    _0x7ca8fe = _0x5bd531 - _0x5c8d5d * 0x2,
    _0x340c1f = _0x24dd35 - _0x4777dc * 0x2;
  let _0x5b2cef = 0x168,
    _0x25b998 = [];
  const _0x39b065 = new _0x1ba943(_0x5bd531, _0x24dd35),
    _0x3a176b = _0x39b065["getContext"]("2d");
  while (_0x5b2cef >= 0xe) {
    _0x3a176b["font"] = _0x5b2cef + 'px "' + _0xe0f251 + "\x22";
    const _0x5b10a2 = Math["round"](_0x5b2cef * 0.92),
      _0x25e130 = Math["round"](_0x5b2cef * 0.2);
    _0x25b998 = _buildLines(
      _0x3a176b,
      _0x52d377,
      _0x7ca8fe,
      _0x5b10a2,
      _0x25e130,
    );
    const _0x13cdf5 = _0x25b998["length"] * _0x5b2cef * 1.18,
      _0x3f0985 = Math["max"](
        ..._0x25b998["map"]((_0x5731c3) => _0x5731c3["width"]),
      );
    if (_0x13cdf5 <= _0x340c1f && _0x3f0985 <= _0x7ca8fe) break;
    _0x5b2cef -= _0x5b2cef > 0x50 ? 0x6 : _0x5b2cef > 0x28 ? 0x3 : 0x1;
  }
  const _0x4d8928 = Math["round"](_0x5b2cef * 0.92),
    _0x450f6d = Math["round"](_0x5b2cef * 0.2),
    _0xa01876 = _0x5b2cef * 1.18;
  ((_0x3a176b.fillStyle = "white"),
    _0x3a176b.fillRect(0x0, 0x0, _0x5bd531, _0x24dd35),
    (_0x3a176b["fillStyle"] = "black"),
    (_0x3a176b["textBaseline"] = "alphabetic"),
    (_0x3a176b["textAlign"] = "left"),
    (_0x3a176b.font = _0x5b2cef + "px\x20\x22" + _0xe0f251 + "\x22"));
  let _0xbc1146 = _0x4777dc + _0x5b2cef * 0.92;
  for (const _0x4ee5eb of _0x25b998) {
    let _0x5cbf47 = _0x5c8d5d;
    for (
      let _0x39eb49 = 0x0;
      _0x39eb49 < _0x4ee5eb.words["length"];
      _0x39eb49++
    ) {
      const _0x4a5163 = _0x4ee5eb["words"][_0x39eb49];
      if (_0x39eb49 > 0x0) _0x5cbf47 += _0x450f6d;
      if (_0x4a5163.type === "emoji") {
        const _0x228faa = _imgCache.get(_emojiCodepoint(_0x4a5163["value"]));
        if (_0x228faa) {
          const _0x223350 = _0xbc1146 - _0x4d8928 * 0.82;
          _0x3a176b["drawImage"](
            _0x228faa,
            _0x5cbf47,
            _0x223350,
            _0x4d8928,
            _0x4d8928,
          );
        } else _0x3a176b.fillText(_0x4a5163["value"], _0x5cbf47, _0xbc1146);
        _0x5cbf47 += _0x4d8928;
      } else
        (_0x3a176b["fillText"](_0x4a5163["value"], _0x5cbf47, _0xbc1146),
          (_0x5cbf47 += _0x3a176b["measureText"](_0x4a5163["value"])["width"]));
    }
    _0xbc1146 += _0xa01876;
  }
  const _0x1ea6e5 = await _0x39b065["toBuffer"]("png"),
    _0x1c6dc7 = await _0x419045["read"](_0x1ea6e5);
  return (
    _0x1c6dc7["blur"](0x3),
    _0x1c6dc7["getBufferAsync"](_0x419045["MIME_PNG"])
  );
}
module["exports"] = { generateBrat: generateBrat };
