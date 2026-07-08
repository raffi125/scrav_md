module.exports = {
    name: 'buypremium',
    aliases: ['sewa', 'premium'],
    description: 'Menampilkan daftar harga Premium SCRAVBOT',
    category: 'User',
    async execute(sock, msg, args) {
        const { from } = msg;

        const reply = `🌟 *SCRAVBOT PREMIUM* 🌟

Dapatkan akses tanpa batas (Unlimited Limit) ke seluruh fitur eksklusif bot (AI, Downloader Resolusi Tinggi, Sticker Custom) dengan berlangganan Premium!

📜 *DAFTAR HARGA:*
1. 🥉 *Paket 1 Minggu* - Rp 5.000
2. 🥈 *Paket 1 Bulan* - Rp 15.000
3. 🥇 *Paket LIFETIME (Seumur Hidup)* - Rp 50.000 

💳 *METODE PEMBAYARAN:*
- **DANA / OVO / GOPAY**: 089635804346
- **QRIS**: _Minta kode QR ke Owner_

📞 *CARA PEMBELIAN:*
Transfer sesuai nominal di atas, lalu kirim bukti transfer ke Owner bot.
Klik link ini untuk menghubungi Owner: 
wa.me/6289635804346?text=Halo+bang,+mau+beli+Premium+ScravBot+paket+...`;

        await sock.sendMessage(from, { text: reply }, { quoted: msg });
    }
};
