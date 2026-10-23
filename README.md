# BUMITRA: Transformasi Digital untuk Mitigasi Bencana, Adaptasi Iklim, dan Pelestarian Lingkungan

## Revisi terbaru
- Nama website diganti menjadi BUMITRA (judul tab, beranda, tentang, footer).
- Halaman Cuaca: tombol mikrofon untuk bertanya dengan suara; jawaban dibacakan berdasarkan data BMKG yang tampil (butuh Chrome/Edge, HTTPS, dan izin mikrofon).
- Beranda: tombol "Klik video" membuka pemutar video. Atur sumber video di `src/config.js` (file di `public/video/` atau `youtubeId`).

Prototipe website edukasi kesiapsiagaan banjir dan tanah longsor.

## Perubahan pada versi 6
- Materi edukasi banjir, tanah longsor, cuaca, peta risiko, persiapan keluarga, bantuan, dan kepedulian lingkungan dipusatkan ke chatbot Sahabat BUMITRA.
- Menu navigasi dibuat lebih ringkas: Beranda, Peta Risiko, Cuaca, dan Bantuan.
- Pertanyaan edukasi sudah disediakan per kategori dan dapat dipilih tanpa harus mengetik.
- Pengguna tetap dapat menulis pertanyaan sendiri; jawaban chatbot berbasis aturan/kata kunci dari materi panduan, bukan model AI generatif.
- Chatbot memakai tampilan percakapan yang lebih terstruktur, quick questions, kategori, tombol percakapan baru, dan mode layar penuh pada perangkat kecil.
- Beranda menampilkan pintasan topik edukasi, serta fitur peta, cuaca, dan bantuan.

## Menjalankan proyek
Pastikan Node.js LTS terpasang, lalu dari folder proyek jalankan:

```bash
npm install
npm run dev
```

Untuk memeriksa build produksi:

```bash
npm run build
```

## Catatan penting
- Materi edukasi disusun berdasarkan dokumen `ISI WEBSITE KITA` yang diberikan pemilik proyek.
- Peta, cuaca, dan kontak bantuan bergantung pada layanan/sumber eksternal. Periksa sumber resmi sebelum mengambil keputusan keselamatan.
- Chatbot saat ini menggunakan jawaban terprogram dan pencocokan kata kunci. Ini belum terhubung ke Gemini/API AI maupun database.

## Pembaruan: cuaca nasional & peta risiko bernama
- Cuaca: seluruh desa/kelurahan Indonesia (data kode wilayah Kemendagri di `public/wilayah.json`, dibuat dari repo `kodewilayah/permendagri-72-2019`). Pilih Provinsi → Kab/Kota → Kecamatan → Desa, atau cari dengan kata kunci. Kode `adm4` dikirim ke BMKG dan responsnya diverifikasi cocok.
- Peta risiko: titik yang diklik/dicari diberi nama lokasi (OpenStreetMap), hasil pencarian diberi nomor dan label, serta nilai bahaya/risiko di titik dibaca dari layanan BNPB lewat proxy `/api/bnpb`.
- Proxy `/api/bmkg` dan `/api/bnpb` harus aktif di hosting (sudah ada di `vite.config.js`, `vercel.json`, `netlify.toml`).

## Pembaruan v7
- Cuaca: `public/wilayah.json` diganti dengan kode wilayah Kepmendagri No 300.2.2-2138/2025 (sumber: cahyadsn/wilayah), sama dengan kode yang dipakai BMKG. Versi lama (Permendagri 72/2019) belum memuat Papua Selatan/Tengah/Pegunungan/Barat Daya sehingga mis. Nasem (Merauke) dikirim sebagai 91.01.01.2001 dan ditolak BMKG; kode yang benar 93.01.01.2001.
- Peta risiko: mencari kota/kabupaten/provinsi (mis. "Sumatera Utara", "Medan") menggambar batas wilayah dan ratusan titik sampel grid berwarna (merah/oranye/hijau) dari raster InaRISK; ada filter kelas dan daftar titik tertinggi bernama. Klik titik untuk detail.
- Chatbot: pencocokan lebih ketat (fase banjir/longsor), menolak menebak data real-time/prediksi/status lokasi dan bencana di luar materi, menawarkan pertanyaan terdekat, serta label sumber pada jawaban dari materi.

## Pembaruan v8
- Bantuan: bagian "Bantuan di sekitar Anda" memakai lokasi perangkat (izin pengguna) untuk menentukan wilayah, menampilkan 112/115/117, rumah sakit dan titik kumpul terdekat dari OpenStreetMap (Overpass), serta tautan pencarian BPBD wilayah tersebut. Nomor BPBD kabupaten/kota lain tidak ditebak.
- Peta risiko: setiap titik kini menampilkan nilai mentah, aturan kelas, dan tautan langsung ke jawaban server BNPB sebagai bukti yang bisa diperiksa.
- Catatan akurasi: layanan BNPB juga menyediakan layer `*_30` (30 m, mis. `layer_bahaya_banjir_30_sumatera`) selain ImageServer 100 m yang dipakai saat ini. Perlu dicocokkan dengan layer yang dipakai portal InaRISK.

## Pembaruan v11
- Tampilan dan halaman sama seperti v8 (materi banjir, longsor, lingkungan lewat chatbot; Peta Risiko, Cuaca, Bantuan tetap halaman sendiri).
- Jawaban chatbot sekarang dibuat otomatis dari `src/data/content.js` (isi dokumen ISI WEBSITE KITA) lewat `src/data/answers.js`. Kalimat di luar dokumen dihapus.
- Peta risiko: batas kelas disesuaikan dengan pembagian BNPB (rendah 0-0,333; sedang 0,334-0,666; tinggi 0,667-1).

## Pembaruan v12
- Beranda dirapikan: bagian topik edukasi dihapus (sudah ada di chatbot). Urutan sekarang: hero, Fitur Informasi (Peta Risiko, Cuaca, Bantuan), lalu Kontak & Komentar.
- Komentar terkirim otomatis ke email pengelola lewat FormSubmit. Isi `email` di `src/config.js`. Pengiriman pertama akan meminta pengelola mengaktifkan formulir lewat email konfirmasi dari FormSubmit.

## Cara mengganti background beranda

Background beranda memakai foto di `public/background/beranda.webp`.

Cara termudah: timpa file `public/background/beranda.webp` dengan gambar baru (nama file harus sama).

Cara lain: taruh gambar baru di `public/background/`, lalu ubah `HERO_BG.src` di `src/config.js`.

Pengaturan di `src/config.js` (`HERO_BG`):
- `src`: gambar untuk laptop/tablet (dan HP bila `srcMobile` kosong).
- `srcMobile`: opsional, gambar khusus HP (misalnya potongan potret).
- `positionDesktop` / `positionMobile`: bagian gambar yang tetap terlihat saat dipotong, mis. `"40% center"`.

Saran gambar: lebar 1600-2200 px, format .webp atau .jpg, di bawah 400 KB. Lapisan gelap di atas gambar diatur di `src/home.css` (`.hero-shade`).
