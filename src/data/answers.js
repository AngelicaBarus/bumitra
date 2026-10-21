// Jawaban chatbot disusun dari content.js (isi dokumen ISI WEBSITE KITA) agar selalu sama dengan isi website.
import { disasters as D, cuacaKartu as C, langkahPeta, lingkungan as L, langkahBantuan } from "./content.js";
const b = (a) => a.map((x) => "• " + x).join("\n");
const sg = (k) => D[k].signs.map((s) => s[1]);
const ph = (k, i) => `${D[k].phases[i][0]}:\n${b(D[k].phases[i][1])}`;
const num = (a) => a.map((x, i) => `${i + 1}. ${x}`).join("\n");

export const answers = {
  "apa itu banjir?": D.banjir.what.join(" "),
  "apa tanda-tanda banjir?": `${D.banjir.signsT}\n${b(sg("banjir"))}`,
  "apa yang harus dilakukan sebelum banjir?": ph("banjir", 0),
  "apa yang harus dilakukan saat banjir?": ph("banjir", 1),
  "apa yang harus dilakukan setelah banjir?": ph("banjir", 2),
  "apa yang tidak boleh dilakukan saat banjir?": `${D.banjir.remember[0]}\n• ${D.banjir.phases[2][1][0]}\n• ${D.banjir.phases[2][1][1]}\n\n${D.banjir.remember[1]}`,

  "apa itu tanah longsor?": D.longsor.what.join(" "),
  "apa tanda-tanda tanah longsor?": `${D.longsor.signsT}\n${b(sg("longsor"))}`,
  "apa yang harus dilakukan sebelum longsor?": ph("longsor", 0),
  "apa yang harus dilakukan jika ada tanda bahaya longsor?": `${ph("longsor", 1)}\n\n${D.longsor.remember.join(" ")}`,
  "apa yang harus dilakukan setelah longsor?": ph("longsor", 2),

  "apa yang harus dilakukan saat hujan deras?": `Hujan deras dapat meningkatkan risiko banjir dan tanah longsor di wilayah tertentu.\n• ${C[2][1]}: ${C[2][2]}\n• ${C[3][1]}: ${C[3][2]}`,
  "mengapa perlu memeriksa cuaca?": "Hujan deras dapat meningkatkan risiko banjir dan tanah longsor di wilayah tertentu. Dengan mengetahui informasi cuaca lebih awal, Anda dapat mempersiapkan diri dan keluarga. Informasi cuaca dapat berubah. Selalu periksa pembaruan dari sumber resmi.",
  "di mana melihat prakiraan cuaca resmi?": "Informasi cuaca dari BMKG dapat dilihat di halaman Cek Cuaca (tombol LIHAT CUACA BMKG) atau langsung di situs resmi BMKG: https://www.bmkg.go.id/ dan https://data.bmkg.go.id/peringatan-dini-cuaca/",

  "bagaimana cara menggunakan peta risiko?": `Cara menggunakannya:\n${num(langkahPeta.map(([t, d]) => `${t}. ${d}`))}`,
  "apa arti warna pada peta risiko?": "🔴 Merah: Wilayah dengan tingkat kerawanan tinggi berdasarkan data peta.\n🟡 Kuning: Wilayah dengan tingkat kerawanan sedang berdasarkan data peta.\n🟢 Hijau: Wilayah dengan tingkat kerawanan rendah berdasarkan data peta.\n\nWarna hanya digunakan jika sesuai dengan data peta yang tersedia.",
  "apakah wilayah hijau berarti bebas bencana?": "Tidak. Wilayah berwarna hijau tidak berarti sepenuhnya bebas dari bencana. Warna hanya digunakan jika sesuai dengan data peta yang tersedia.",

  "bagaimana cara menjaga lingkungan?": `Mulailah dari kebiasaan sederhana di sekitar rumah:\n${b(L.map((x) => `${x[2]}. ${x[3]}`))}\n\nMenjaga lingkungan bukan hanya tugas pemerintah, tetapi juga tanggung jawab kita bersama.\nLingkungan terawat, masyarakat lebih kuat!`,
  "mengapa sampah tidak boleh dibuang ke selokan?": `${L[0][3]} ${L[2][3]}`,
  "mengapa pohon dan daerah resapan perlu dijaga?": `${L[1][3]} ${L[3][3]}`,
  "apa yang bisa dilakukan bersama tetangga?": `${L[4][3]} Menjaga lingkungan bukan hanya tugas pemerintah, tetapi juga tanggung jawab kita bersama.`,

  "apa yang perlu disiapkan sebelum bencana?": `${ph("banjir", 0)}\n\n${ph("longsor", 0)}`,
  "apa saja yang perlu ada di tas darurat?": "Panduan SIGMA-BUMI menyebut: “Siapkan tas berisi barang penting” dan “Simpan dokumen penting di tempat aman.” Daftar isi tas yang lebih rinci belum ditetapkan di panduan ini, jadi sesuaikan dengan kebutuhan keluarga dan arahan petugas setempat.",
  "bagaimana membuat keluarga lebih siap?": `Langkah yang dianjurkan panduan:\n• ${D.banjir.phases[0][1][1]}\n• ${D.banjir.phases[0][1][2]}\n• ${D.banjir.phases[0][1][3]}\n• ${D.longsor.phases[0][1][2]}\n• ${D.longsor.phases[0][1][3]}\n• ${langkahBantuan[3]}`,

  "apa yang harus dilakukan saat keadaan darurat?": `Utamakan keselamatan Anda dan keluarga!\n${num(langkahBantuan)}\n\nUntuk keadaan darurat di Kota Medan, informasi layanan 112 tersedia di portal Medan Smart City: https://portalsmartcity.medan.go.id/welcome/detail_call`,
  "bagaimana mencari tempat evakuasi?": "Lokasi pengungsian dapat berubah sesuai kejadian. Ikuti arahan petugas dan informasi BPBD setempat. Jangan menuju lokasi yang belum terkonfirmasi. Di halaman Bantuan ada tombol “Lokasi pengungsian terdekat”. Untuk Kota Medan, kunjungi kontak BPBD: https://bpbd.medan.go.id/menu-single/Kontak.html",
  "bagaimana menghubungi bpbd kota medan?": "Halaman kontak BPBD Kota Medan mencantumkan WhatsApp 0813-7080-0880. Silakan verifikasi informasi terbaru melalui halaman resminya: https://bpbd.medan.go.id/menu-single/Kontak.html. Jika keadaan mendesak, hubungi layanan darurat setempat.",
};
