const axios = require('axios');
const cloudscraper = require('cloudscraper');
const cheerio = require('cheerio');

module.exports = {
    name: 'bypass',
    aliases: ['shortlink', 'bypasslink'],
    description: 'Bypass shortlink / URL shortener',
    category: 'Tools',
    async execute(sock, msg, args) {
        const { from } = msg;

        if (args.length === 0) {
            await sock.sendMessage(from, { text: '❌ Masukkan URL shortlink.\nContoh: !bypass https://bit.ly/xxx' }, { quoted: msg });
            return;
        }

        let url = args[0];
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

        try {
            let finalUrl = null;

            // 1. FOLLOW HTTP REDIRECT (301/302/303/307/308)
            finalUrl = await followRedirect(url);
            if (finalUrl) finalUrl = await followChain(finalUrl, 5);

            // 2. SCRAPE PAGE (kalo blom dapet atau masih di domain yg sama)
            if (!finalUrl || sameDomain(finalUrl, url)) {
                const scraped = await scrapeUrl(url);
                if (scraped) finalUrl = scraped;
            }

            // 3. FALLBACK KE EXTERNAL BYPASS SERVICE
            if (!finalUrl || sameDomain(finalUrl, url)) {
                const bypassed = await externalBypass(url);
                if (bypassed) finalUrl = bypassed;
            }

            if (!finalUrl) throw new Error('Tidak dapat menemukan URL final');

            await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });
            await sock.sendMessage(from, {
                text: `🔗 *Shortlink Bypass*\n\n*Asal:* ${url}\n*Tujuan:* ${finalUrl}`
            }, { quoted: msg });

        } catch (err) {
            console.error('Bypass Error:', err.message);
            await sock.sendMessage(from, { text: `❌ Gagal bypass shortlink. ${err.message}` }, { quoted: msg });
        }
    }
};

function sameDomain(a, b) {
    try { return new URL(a).hostname === new URL(b).hostname; }
    catch { return true; }
}

async function followRedirect(url) {
    try {
        const res = await axios.get(url, {
            maxRedirects: 0,
            validateStatus: s => s >= 200 && s < 400,
            timeout: 10000
        });
        if ([301, 302, 303, 307, 308].includes(res.status) && res.headers.location)
            return res.headers.location;
    } catch (e) {
        if (e.response && [301, 302, 303, 307, 308].includes(e.response.status) && e.response.headers?.location)
            return e.response.headers.location;
    }
    return null;
}

async function followChain(url, maxHop) {
    let visited = new Set();
    let current = url;
    for (let i = 0; i < maxHop; i++) {
        if (visited.has(current)) break;
        visited.add(current);
        const next = await followRedirect(current);
        if (!next) break;
        current = next;
    }
    return current !== url ? current : null;
}

async function scrapeUrl(url) {
    try {
        const html = await cloudscraper.get({ uri: url, followRedirect: false });
        const $ = cheerio.load(html);
        const scripts = $('script').map((i, el) => $(el).html()).get().filter(Boolean);

        // kumpulin semua URL potensial
        let candidates = [];

        // a. meta refresh
        const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
        if (metaRefresh) {
            const m = metaRefresh.match(/url=["']?([^"'\s]+)/i);
            if (m) candidates.push(m[1]);
        }

        // b. window.location / window.open / location.href di script
        for (const script of scripts) {
            let found;
            // atob (base64)
            const atobMatch = script.match(/atob\(["']([^"']+)["']\)/);
            if (atobMatch) {
                try { candidates.push(Buffer.from(atobMatch[1], 'base64').toString('utf8')); } catch {}
            }
            // var (url|link|redirect) = "..."
            found = script.match(/(?:var|let|const)\s+(?:url|link|redirect|go|target|dest)\s*[=:]\s*["']([^"']+)["']/i);
            if (found) candidates.push(found[1]);
            // window.location = / window.location.href = / location.href =
            found = script.match(/(?:window\.location(?:\.href)?|location\.href|document\.location)\s*[=:]\s*["']([^"']+)["']/);
            if (found) candidates.push(found[1]);
            // window.open("...")
            found = script.match(/window\.open\(["']([^"']+)["']/);
            if (found) candidates.push(found[1]);
            // top.location
            found = script.match(/top\.location\s*=\s*["']([^"']+)["']/);
            if (found) candidates.push(found[1]);
        }

        // c. element attributes
        $('[data-link], [data-url], [data-redirect], [data-href]').each((i, el) => {
            const val = $(el).attr('data-link') || $(el).attr('data-url') || $(el).attr('data-redirect') || $(el).attr('data-href');
            if (val && val.startsWith('http')) candidates.push(val);
        });

        // d. input dengan value URL
        $('input[type="hidden"]').each((i, el) => {
            const val = $(el).attr('value');
            if (val && val.startsWith('http')) candidates.push(val);
        });

        // e. form action
        $('form').each((i, el) => {
            const action = $(el).attr('action');
            if (action && action.startsWith('http')) candidates.push(action);
        });

        // f. iframe src
        $('iframe').each((i, el) => {
            const src = $(el).attr('src');
            if (src && src.startsWith('http')) candidates.push(src);
        });

        // g. semua anchor href
        $('a[href]').each((i, el) => {
            const href = $(el).attr('href');
            if (href && (href.startsWith('http') || href.startsWith('//'))) {
                if (href.startsWith('//')) candidates.push('https:' + href);
                else candidates.push(href);
            }
        });

        // h. text body
        const bodyText = $('body').text();
        const textUrls = bodyText.match(/https?:\/\/[^\s"'<>)\]]+/g);
        if (textUrls) candidates.push(...textUrls);

        // filter: exclude ads, same domain, empty
        const host = new URL(url).hostname;
        const filtered = candidates.filter(u => {
            try {
                const uHost = new URL(u).hostname;
                return uHost !== host && !uHost.includes('ads') && !uHost.includes('adservice') && !uHost.includes('doubleclick');
            } catch { return false; }
        });

        // follow redirect chain dari candidate pertama yg valid
        for (const c of filtered) {
            const result = await followChain(c, 5);
            if (result) return result;
            // cek kalo langsung URL yg bener (bukan shortener)
            try {
                const res = await axios.head(c, { timeout: 5000 });
                if (res.status < 400) return c;
            } catch {}
        }

        return filtered[0] || null;
    } catch (e) {
        console.log('Scrape gagal:', e.message);
        return null;
    }
}

async function externalBypass(url) {
    const services = [
        `https://adbypass.org/bypass?bypass=${encodeURIComponent(url)}`,
        `https://bypass.city/bypass?bypass=${encodeURIComponent(url)}`,
    ];
    for (const service of services) {
        try {
            const result = await followChain(service, 5);
            if (result && !result.includes('adbypass.org') && !result.includes('bypass.city'))
                return result;
        } catch {}
    }
    return null;
}
