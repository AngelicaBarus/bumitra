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
