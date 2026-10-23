// ===== NAMA WEBSITE =====
export const SITE = {
  short: "BUMITRA",
  full: "BUMITRA: TRANSFORMASI DIGITAL UNTUK MITIGASI BENCANA, ADAPTASI IKLIM, DAN PELESTARIAN LINGKUNGAN",
};

// ===== VIDEO BERANDA =====
// Pilih salah satu cara:
//  1) File sendiri: taruh video di folder public/video/ (mis. profil.mp4) lalu isi src: "/video/profil.mp4"
//  2) Google Drive: isi driveId dengan kode di link Drive (bagian antara /d/ dan /view).
//     Syarat: di Drive, klik Bagikan > Akses umum > "Siapa saja yang memiliki link" (Viewer).
//  3) YouTube: isi youtubeId dengan kode video (mis. link youtube.com/watch?v=ABCDEFG -> "ABCDEFG").
//     Urutan prioritas: youtubeId, lalu driveId, lalu src.
export const VIDEO = {
  title: "Video Pengenalan BUMITRA",
  src: "/video/profil.mp4",
  poster: "",
  youtubeId: "HS615PIxxlY",
  driveId: "12GkuRzUDdQV_UanfJgvK4i-fyxDNiQVl",
};

// Isi alamat email pengelola di bawah ini agar komentar dari website terkirim otomatis ke email tersebut.
// Contoh: email: "pengelola@contoh.com"
export const CONTACT = {
  // Email penerima komentar. Pengunjung TIDAK melihat alamat ini di tampilan situs.
  email: "angelicabarus999@gmail.com",
  // Opsional, lebih tertutup: setelah email diaktivasi di FormSubmit, isi dengan kode acak
  // dari email aktivasi (bentuk 32 karakter) agar alamat email tidak tertulis di kode situs.
  formId: "",
};

// ===== BACKGROUND BERANDA =====
// Untuk mengganti gambar: taruh file baru di folder public/background/ lalu ubah nama file di bawah.
// (Atau cukup timpa file beranda.webp dengan gambar baru bernama sama; tidak perlu ubah kode.)
// Format yang disarankan: .webp atau .jpg, lebar 1600-2200 px, ukuran di bawah 400 KB.
export const HERO_BG = {
  // Gambar untuk laptop/tablet (dan HP jika srcMobile kosong).
  src: "/background/beranda.webp",
  // Opsional: gambar khusus HP (misalnya potongan potret). Kosongkan (isi "") untuk memakai gambar di atas.
  srcMobile: "",
  // Bagian gambar yang dijaga tetap terlihat saat dipotong. Format: x% y% (0% = kiri/atas, 100% = kanan/bawah).
  positionDesktop: "center 55%",
  positionMobile: "40% center",
};
