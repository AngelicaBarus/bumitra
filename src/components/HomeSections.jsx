import { useEffect, useState } from "react";
import { HeartHandshake, Info, MapPin, Send, ShieldCheck } from "lucide-react";
import { CONTACT, SITE } from "../config.js";

const TENTANG = [
  { icon: ShieldCheck, title: "Edukasi kesiapsiagaan", desc: "Materi banjir, tanah longsor, dan cuaca disusun agar mudah dipahami, lewat percakapan dengan Sahabat BUMITRA." },
  { icon: MapPin, title: "Data dari sumber resmi", desc: "Peta risiko memakai data InaRISK BNPB, prakiraan cuaca dari BMKG, dan kontak bantuan dari situs pemerintah." },
  { icon: HeartHandshake, title: "Untuk semua warga", desc: "Dibuat sebagai prototipe edukasi agar keluarga lebih siap dan peduli lingkungan sebelum bencana terjadi." },
];

export function TentangSection() {
  return <section className="hm-sec hm-about" aria-labelledby="tentang-h">
    <div className="hm-head"><span className="hm-eyebrow">TENTANG</span><h2 id="tentang-h">Tentang BUMITRA</h2><p><b>{SITE.full}</b>. BUMITRA adalah website edukasi untuk membantu masyarakat mengenali risiko banjir dan tanah longsor, memantau cuaca, dan mengetahui ke mana mencari bantuan.</p></div>
    <div className="hm-about-grid">{TENTANG.map((t) => { const I = t.icon; return <article key={t.title}><span><I size={24}/></span><h3>{t.title}</h3><p>{t.desc}</p></article>; })}</div>
    <p className="hm-about-note"><Info size={17}/> BUMITRA bukan sumber peringatan resmi. Untuk keputusan keselamatan, selalu ikuti informasi BMKG, BNPB/BPBD, dan arahan petugas setempat.</p>
  </section>;
}

export function KontakKomentar() {
  const [nama, setNama] = useState(""), [email, setEmail] = useState(""), [isi, setIsi] = useState(""), [honey, setHoney] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | ok | err
  const [wait, setWait] = useState(0);
  const tujuan = CONTACT.formId || CONTACT.email; const siap = !!tujuan;
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);

  async function kirim(e) {
    e.preventDefault();
    if (!isi.trim() || honey || !siap || wait > 0) return;
    setState("sending");
    try {
      const r = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(tujuan)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: nama.trim() || "Warga (tanpa nama)", email: email.trim() || undefined, message: isi.trim(), _subject: "Komentar baru dari website BUMITRA", _template: "table", _captcha: "false" }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || String(j.success) === "false") throw new Error(j.message || "gagal");
      setState("ok"); setIsi(""); setWait(30);
    } catch { setState("err"); }
  }

  return <section className="hm-sec hm-contact" aria-labelledby="kontak-h">
    <div className="hm-head"><span className="hm-eyebrow">KOMENTAR</span><h2 id="kontak-h">Kirim komentar</h2><p>Punya saran atau perbaikan untuk website ini? Tulis di bawah; pesan Anda diteruskan otomatis ke pengelola.</p></div>
    <div className="hm-contact-grid">
      <form className="hm-form" onSubmit={kirim}>
        <h3>Tulis komentar Anda</h3><p className="hm-urgent"><ShieldCheck size={18}/> Untuk keadaan darurat, jangan menunggu balasan. Hubungi 112 atau petugas setempat.</p>
        <div className="hm-two">
          <label>Nama <span>(boleh dikosongkan)</span><input value={nama} maxLength={60} onChange={(e) => setNama(e.target.value)} autoComplete="name"/></label>
          <label>Email Anda <span>(agar bisa dibalas)</span><input type="email" value={email} maxLength={100} onChange={(e) => setEmail(e.target.value)} autoComplete="email"/></label>
        </div>
        <label>Komentar Anda<textarea rows={5} maxLength={1000} required value={isi} onChange={(e) => { setIsi(e.target.value); if (state !== "sending") setState("idle"); }} placeholder="Tulis saran atau perbaikan untuk website ini…"/></label>
        <input className="hm-honey" tabIndex={-1} autoComplete="off" aria-hidden="true" value={honey} onChange={(e) => setHoney(e.target.value)} name="_honey"/>
        <button className="hm-send" disabled={!siap || state === "sending" || wait > 0 || !isi.trim()}>{state === "sending" ? "Mengirim…" : wait > 0 ? `Tunggu ${wait} detik` : <>Kirim komentar <Send size={17}/></>}</button>
        {!siap && <p className="hm-msg warn" role="status">Pengiriman belum aktif: pengelola perlu mengisi <code>src/config.js</code>.</p>}
        {state === "ok" && <p className="hm-msg ok" role="status">Terima kasih! Komentar Anda sudah terkirim ke pengelola.</p>}
        {state === "err" && <p className="hm-msg err" role="alert">Komentar belum terkirim. Periksa koneksi internet lalu coba lagi.</p>}
        <small className="hm-priv">Komentar diteruskan lewat layanan formulir pihak ketiga (FormSubmit) ke email pengelola. Jangan menulis data pribadi yang sensitif.</small>
      </form>
    </div>
  </section>;
}
