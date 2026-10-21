export const slogan = "Kenali Bahayanya, Lindungi Keluarga, Jaga Lingkungan!";
export const narasi = "Halo, Bapak dan Ibu! Selamat datang di SIGMA-BUMI. Website ini membantu Anda mengenali risiko banjir dan tanah longsor di sekitar tempat tinggal. Tidak perlu bingung! Pilih informasi yang ingin Anda ketahui di bawah ini.";

export const menu = [
  { to: "banjir", e: "🌧️", t: "Waspada Banjir", d: "Kenali tanda bahaya dan cara menyelamatkan diri.", c: "blue" },
  { to: "longsor", e: "⛰️", t: "Waspada Tanah Longsor", d: "Pelajari tanda-tanda longsor dan cara menghindarinya.", c: "brown" },
  { to: "cuaca", e: "🌦️", t: "Cek Cuaca Hari Ini", d: "Ketahui informasi cuaca dari BMKG.", c: "sky" },
  { to: "wilayah", e: "🗺️", t: "Cek Wilayah Saya", d: "Lihat informasi potensi bencana di sekitar Anda.", c: "green" },
  { to: "lingkungan", e: "🌱", t: "Jaga Lingkungan", d: "Pelajari cara sederhana menjaga lingkungan agar lebih aman.", c: "lime" },
  { to: "bantuan", e: "🆘", t: "Butuh Bantuan?", d: "Temukan informasi kontak darurat dan tempat evakuasi.", c: "red" },
];

export const disasters = {
  banjir: {
    e: "🌧️", scene: "flood", title: "Waspada Banjir", c: "blue",
    whatT: "Apa Itu Banjir?",
    what: ["Banjir terjadi ketika air menggenangi rumah, jalan, atau lingkungan tempat tinggal kita.", "Banjir dapat terjadi karena hujan deras, sungai meluap, atau saluran air tersumbat sampah."],
    signsT: "Apa Tanda-Tanda Banjir?",
    signs: [["🌧️", "Hujan deras berlangsung lama."], ["🌊", "Air sungai mulai naik."], ["🚰", "Air selokan meluap."], ["🏠", "Air mulai masuk ke halaman atau rumah."]],
    doT: "Apa yang Harus Dilakukan?",
    phases: [
      ["Sebelum Banjir", ["Bersihkan selokan dari sampah.", "Simpan dokumen penting di tempat aman.", "Siapkan tas berisi barang penting.", "Ketahui tempat yang aman untuk mengungsi."]],
      ["Saat Banjir", ["Segera menjauh dari aliran air yang berbahaya.", "Matikan listrik jika aman dilakukan.", "Bawa keluarga ke tempat yang lebih aman.", "Ikuti arahan petugas."]],
      ["Setelah Banjir", ["Jangan menyalakan listrik sebelum dinyatakan aman.", "Hindari air banjir yang mungkin tercemar.", "Bersihkan rumah menggunakan perlindungan yang sesuai.", "Periksa informasi dari petugas sebelum kembali ke lokasi berbahaya."]],
    ],
    remember: ["Jangan menerobos banjir dengan berjalan kaki atau kendaraan jika kedalaman dan arus air tidak diketahui.", "Keselamatan Anda dan keluarga adalah yang utama!"],
  },
  longsor: {
    e: "⛰️", scene: "landslide", title: "Waspada Tanah Longsor", c: "brown",
    whatT: "Apa Itu Tanah Longsor?",
    what: ["Tanah longsor terjadi ketika tanah atau batuan bergerak menuruni lereng. Longsor dapat membahayakan rumah dan orang-orang di sekitarnya.", "Hujan deras dapat meningkatkan risiko longsor, terutama di daerah perbukitan."],
    signsT: "Kenali Tanda Bahayanya!",
    signs: [["🕳️", "Muncul retakan baru di tanah."], ["🌲", "Pohon atau tiang tiba-tiba miring."], ["⛰️", "Tanah pada lereng mulai bergerak."], ["💧", "Muncul rembesan air yang tidak biasa."]],
    doT: "Apa yang Harus Dilakukan?",
    phases: [
      ["Sebelum Longsor", ["Kenali apakah rumah berada dekat lereng rawan longsor.", "Perhatikan informasi cuaca.", "Ketahui jalur menuju tempat aman.", "Ikuti arahan petugas setempat."]],
      ["Jika Ada Tanda Bahaya", ["Segera menjauh dari lereng yang dicurigai tidak stabil.", "Ajak keluarga menuju tempat aman jika jalurnya aman.", "Beri tahu tetangga dan petugas.", "Jangan mendekati lokasi untuk mengambil foto."]],
      ["Setelah Longsor", ["Jangan mendekati lokasi longsor.", "Waspadai longsor susulan.", "Jangan kembali ke rumah sebelum dinyatakan aman.", "Ikuti arahan petugas."]],
    ],
    remember: ["Jika melihat tanda-tanda longsor, jangan menunggu sampai tanah bergerak lebih jauh.", "Utamakan keselamatan dan segera menjauh dari area berbahaya."],
  },
};

export const cuacaKartu = [
  ["🌞", "Cerah", "Tetap perhatikan perubahan cuaca."],
  ["🌥️", "Berawan", "Pantau kondisi cuaca secara berkala."],
  ["🌧️", "Hujan", "Berhati-hatilah jika tinggal dekat sungai atau lereng."],
  ["⛈️", "Hujan Lebat atau Peringatan Cuaca Ekstrem", "Tingkatkan kewaspadaan dan ikuti informasi resmi dari BMKG."],
];

export const langkahPeta = [
  ["Pilih Lokasi", "Pilih daerah atau desa yang ingin Anda ketahui."],
  ["Lihat Peta", "Perhatikan informasi lokasi dan potensi bahaya yang tersedia."],
  ["Baca Keterangan", "Pahami arti warna dan simbol pada peta."],
  ["Lakukan Persiapan", "Jika tempat tinggal berada di wilayah berpotensi terdampak, kenali jalur evakuasi dan ikuti informasi resmi."],
];

export const lingkungan = [
  ["🗑️", "trash", "Buang Sampah pada Tempatnya", "Jangan membuang sampah ke sungai atau selokan karena dapat menyumbat aliran air."],
  ["🌳", "tree", "Rawat Pohon dan Tanaman", "Tanaman membantu menjaga tanah dan mendukung keseimbangan lingkungan."],
  ["💧", "drain", "Jaga Saluran Air", "Pastikan selokan di sekitar rumah tidak tersumbat sampah."],
  ["🌿", "sprout", "Jaga Daerah Resapan Air", "Pertahankan ruang terbuka hijau dan area tanah yang dapat menyerap air hujan."],
  ["🤝", null, "Ajak Tetangga Peduli Lingkungan", "Lakukan kerja bakti dan kegiatan bersih lingkungan bersama masyarakat."],
];

export const langkahBantuan = ["Jauhi lokasi yang berbahaya.", "Ikuti arahan petugas.", "Hubungi layanan darurat jika membutuhkan pertolongan.", "Bantu anak-anak, lansia, dan orang yang membutuhkan bantuan jika aman dilakukan."];
