import { useEffect, useRef, useState } from "react";
import { Building2, ExternalLink, Info, LocateFixed, MapPin, Navigation, Phone, RefreshCw, Square } from "lucide-react";

const norm = (t = "") => t.toLowerCase().replace(/\b(kabupaten|kab\.?|kota|kecamatan|kec\.?|kelurahan|kel\.?|desa|provinsi)\b/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
function km(a, b, c, d) {
  const t = (x) => (x * Math.PI) / 180;
  const h = Math.sin(t(c - a) / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(t(d - b) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
const route = (lat, lon) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
const fmt = (d) => (d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);
const telHref = (p) => "tel:" + String(p).split(/[\/;,]| atau /)[0].replace(/[^\d+]/g, "");

const MOVE_KM = 1;        // lokasi dianggap berpindah jika bergeser lebih dari 1 km
const MIN_GAP_MS = 20000; // jeda minimal antar pencarian ulang (menghormati batas layanan OSM)

export default function NearbyHelp({ onLocation }) {
  const [state, setState] = useState("idle"); // idle | locating | done | error
  const [msg, setMsg] = useState("");
  const [loc, setLoc] = useState(null);
  const [near, setNear] = useState(null); // { hospitals, points } | "failed" | null
  const [tracking, setTracking] = useState(false);
  const [updated, setUpdated] = useState(null);
  const watchId = useRef(null), last = useRef(null), seq = useRef(0), timer = useRef(null);

  useEffect(() => () => { clearTimeout(timer.current); if (watchId.current != null) navigator.geolocation?.clearWatch(watchId.current); }, []);

  async function resolve(lat, lon) {
    const my = ++seq.current;
    last.current = { lat, lon, t: Date.now() };
    try {
      setMsg("Menentukan wilayah Anda…");
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&addressdetails=1&accept-language=id&lat=${lat}&lon=${lon}`);
      if (!r.ok) throw new Error();
      const a = (await r.json()).address || {};
      if (my !== seq.current) return;
      const kab = a.city || a.county || a.regency || a.town || a.municipality || a.state_district || "";
      const kec = a.city_district || a.suburb || a.municipality || "";
      const prov = a.state || "";
      const info = { lat, lon, kab, kec, prov, isMedan: norm(kab) === "medan", inSumut: /sumatera utara/i.test(prov) };
      setLoc(info); onLocation?.(info); setState("done"); setMsg(""); setUpdated(new Date());
      setNear(null);
      try {
        const q = `[out:json][timeout:20];(nwr["amenity"="hospital"](around:8000,${lat},${lon});nwr["amenity"~"^(police|fire_station)$"](around:8000,${lat},${lon});nwr["name"~"BPBD|Penanggulangan Bencana|Basarnas|SAR",i](around:12000,${lat},${lon});nwr["emergency"="assembly_point"](around:8000,${lat},${lon}););out center tags 200;`;
        const o = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(q) });
        if (!o.ok) throw new Error();
        const els = (await o.json()).elements || [];
        if (my !== seq.current) return;
        const items = els.map((e) => {
          const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
          return { id: e.type + e.id, name: e.tags?.name, kind: e.tags?.amenity === "hospital" ? "h" : e.tags?.emergency === "assembly_point" ? "p" : "s", type: e.tags?.amenity === "police" ? "Kepolisian" : e.tags?.amenity === "fire_station" ? "Pemadam kebakaran" : /basarnas|sar/i.test(e.tags?.name || "") ? "SAR" : "Penanggulangan bencana", lat: la, lon: lo, phone: e.tags?.phone || e.tags?.["contact:phone"] || "", d: km(lat, lon, la, lo) };
        }).filter((x) => x.name && Number.isFinite(x.lat)).sort((x, y) => x.d - y.d);
        setNear({ hospitals: items.filter((x) => x.kind === "h").slice(0, 5), services: items.filter((x) => x.kind === "s").slice(0, 8), points: items.filter((x) => x.kind === "p").slice(0, 5) });
      } catch { if (my === seq.current) setNear("failed"); }
    } catch {
      if (my !== seq.current) return;
      last.current = null; // izinkan percobaan ulang pada pembaruan posisi berikutnya
      if (!loc) { setState("error"); setMsg("Gagal menentukan wilayah dari lokasi Anda. Periksa koneksi lalu coba lagi."); }
    }
  }

  function stop() {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null; clearTimeout(timer.current); setTracking(false);
  }

  function start() {
    if (!navigator.geolocation) { setState("error"); setMsg("Perangkat/peramban tidak mendukung lokasi."); return; }
    stop(); last.current = null;
    setState("locating"); setMsg("Meminta izin lokasi…");
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const p = last.current;
        clearTimeout(timer.current);
        if (p && km(p.lat, p.lon, lat, lon) < MOVE_KM) return;
        // Bergeser jauh tetapi masih dalam jeda: tunda, jangan dibuang.
        const wait = p ? MIN_GAP_MS - (Date.now() - p.t) : 0;
        if (wait > 0) timer.current = setTimeout(() => resolve(lat, lon), wait); else resolve(lat, lon);
      },
      (err) => {
        if (err?.code === 1) { stop(); setState("error"); setMsg("Izin lokasi ditolak. Aktifkan izin lokasi di peramban, lalu coba lagi."); }
        else if (!last.current) { setState("error"); setMsg("Lokasi belum dapat ditentukan. Pastikan GPS/lokasi aktif; pencarian dilanjutkan otomatis."); }
        // galat sementara setelah lokasi diketahui diabaikan; pemantauan tetap berjalan
      },
      { timeout: 20000, maximumAge: 30000, enableHighAccuracy: true }
    );
    setTracking(true);
  }

  const wilayah = loc && [loc.kec, loc.kab, loc.prov].filter(Boolean).filter((x, i, arr) => arr.indexOf(x) === i).join(", ");
  const time = updated && updated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const Row = ({ x, icon }) => <li className="hp-row">
    <span className="hp-row-ic">{icon}</span>
    <div className="hp-row-tx"><b>{x.name}</b><small>{x.type ? x.type + " · " : ""}{fmt(x.d)} dari Anda</small>{x.phone ? <small className="hp-row-ph"><Phone size={12}/> <a href={telHref(x.phone)}>{x.phone}</a></small> : <small className="hp-row-ph none">Nomor tidak tercatat</small>}</div>
    <a className="hp-row-go" href={route(x.lat, x.lon)} target="_blank" rel="noreferrer" aria-label={`Rute ke ${x.name}`}><Navigation size={14}/> Rute</a>
  </li>;

  return (
    <section className="hp-nearby" aria-label="Bantuan sesuai lokasi Anda">
      <div className="hp-nearby-head">
        <div><span className="hp-eyebrow">SESUAI LOKASI ANDA</span><h3>Bantuan di sekitar Anda</h3><p>Izinkan lokasi agar kontak dan fasilitas menyesuaikan wilayah Anda. Saat Anda berpindah lebih dari {MOVE_KM} km, daftar ikut diperbarui otomatis selama halaman terbuka. Lokasi hanya dipakai di peramban ini.</p></div>
        <div className="hp-nearby-actions">
          <button type="button" className="hp-btn" onClick={start} disabled={state === "locating"}>{loc ? <RefreshCw size={17}/> : <LocateFixed size={17}/>} {state === "locating" ? "Mencari lokasi…" : loc ? "Perbarui sekarang" : "Gunakan lokasi saya"}</button>
          {tracking && <button type="button" className="hp-btn ghost" onClick={stop}><Square size={14}/> Hentikan pelacakan</button>}
        </div>
      </div>
      {msg && <p className={`hp-msg ${state === "error" ? "err" : ""}`} role="status">{msg}</p>}

      {loc && <>
        <p className="hp-where"><MapPin size={17}/><span>Lokasi terdeteksi: <b>{wilayah || "wilayah tidak dikenali"}</b>{time && <em> · diperbarui {time}{tracking ? " · memantau perpindahan" : ""}</em>}</span></p>
        <div className="hp-two">
          <div className="hp-box">
            <h4>Layanan darurat terdekat</h4>
            {near === null && <small className="hp-empty">Mencari fasilitas…</small>}
            {near === "failed" && <small className="hp-empty">Data fasilitas tidak dapat dimuat. Coba perbarui lokasi.</small>}
            {near && near !== "failed" && (near.services.length ? <ul className="hp-list">{near.services.map((x) => <Row key={x.id} x={x} icon={<Phone size={16}/>}/>)}</ul> : <small className="hp-empty">Belum ada kantor polisi, pemadam kebakaran, atau BPBD bernama di data OpenStreetMap sekitar Anda. Hubungi 112.</small>)}
          </div>
          <div className="hp-box">
            <h4>Rumah sakit terdekat</h4>
            {near === null && <small className="hp-empty">Mencari fasilitas…</small>}
            {near === "failed" && <small className="hp-empty">Data fasilitas tidak dapat dimuat. Coba perbarui lokasi.</small>}
            {near && near !== "failed" && (near.hospitals.length ? <ul className="hp-list">{near.hospitals.map((x) => <Row key={x.id} x={x} icon={<Building2 size={16}/>}/>)}</ul> : <small className="hp-empty">Tidak ada rumah sakit bernama dalam radius 8 km pada data OpenStreetMap.</small>)}
          </div>
          <div className="hp-box">
            <h4>Titik kumpul/evakuasi tercatat</h4>
            {near === null && <small className="hp-empty">Mencari fasilitas…</small>}
            {near === "failed" && <small className="hp-empty">Data fasilitas tidak dapat dimuat. Coba perbarui lokasi.</small>}
            {near && near !== "failed" && (near.points.length ? <ul className="hp-list">{near.points.map((x) => <Row key={x.id} x={x} icon={<MapPin size={16}/>}/>)}</ul> : <small className="hp-empty">Belum ada titik kumpul tercatat di OpenStreetMap pada radius 8 km. Tanyakan lokasi pengungsian resmi ke BPBD/petugas setempat.</small>)}
          </div>
        </div>
        <p className="hp-note"><Info size={15}/> Fasilitas dan nomor di daftar ini dicari dari data OpenStreetMap di sekitar lokasi Anda (disumbang relawan), sehingga bisa tidak lengkap atau usang. Jika nomor tidak tercatat, hubungi 112. Hubungi dulu sebelum berangkat; lokasi pengungsian resmi selalu mengikuti arahan BPBD/petugas.</p>
      </>}
    </section>
  );
}
