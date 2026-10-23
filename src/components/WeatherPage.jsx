import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import VoiceWeather from "./VoiceWeather.jsx";
import {
  Cloud, CloudDrizzle, CloudFog, CloudLightning, LocateFixed, Eye, CloudRain, CloudSun, Droplets,
  Info, MapPin, Search, ShieldCheck, Sun, Thermometer, Wind, TriangleAlert, X
} from "lucide-react";

// Daftar wilayah seluruh Indonesia (Kepmendagri 100.1.1-6117/2024 / Permendagri 72/2019)
// dimuat dari /wilayah.json. Struktur: [[kodeProv, nama, [[kodeKab, nama, [[kodeKec, nama, [[kodeDesa, nama]]]]]]]].
// Kode adm4 BMKG = prov.kab.kec.desa, misalnya 12.07.01.2001.
const DEFAULT_PICK = { p: "12", k: "71", c: "18", d: "1002" };

// Ikon memakai gambar resmi BMKG (field `image`) bila ada; jika gagal dimuat, dipakai ikon cadangan
// yang membedakan cerah, cerah berawan, berawan, berawan tebal, kabut/asap, hujan, dan petir.
function FallbackIcon({ description = "", size }) {
  const d = description.toLowerCase();
  if (/petir|thunder/.test(d)) return <CloudLightning size={size} />;
  if (/gerimis|ringan|drizzle/.test(d) && /hujan|gerimis/.test(d)) return <CloudDrizzle size={size} />;
  if (/hujan|rain/.test(d)) return <CloudRain size={size} />;
  if (/kabut|kabur|asap|fog|haze|smoke/.test(d)) return <CloudFog size={size} />;
  if (/tebal|mendung|overcast/.test(d)) return <Cloud size={size} />;
  if (/cerah berawan|partly/.test(d)) return <CloudSun size={size} />;
  if (/berawan|cloud/.test(d)) return <Cloud size={size} />;
  if (/cerah|sunny|clear/.test(d)) return <Sun size={size} />;
  return <Cloud size={size} />;
}
function WeatherIcon({ description = "", image = "", size = 32 }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [image]);
  if (image && !failed) {
    return <img src={image} alt={description} width={size * 1.3} height={size * 1.3} style={{ objectFit: "contain" }} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
  }
  return <FallbackIcon description={description} size={size} />;
}

const norm = (t = "") => t.toLowerCase().replace(/\b(kabupaten|kab\.?|kota|kecamatan|kec\.?|kelurahan|kel\.?|desa)\b/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const TZ = { 7: "WIB", 8: "WITA", 9: "WIT" };

async function fetchBmkg(area) {
  const response = await fetch(
    `/api/bmkg/publik/prakiraan-cuaca?adm4=${encodeURIComponent(area.code)}`
  );
  if (response.status === 404) throw new Error("Data prakiraan BMKG belum tersedia untuk desa/kelurahan ini.");
  if (!response.ok) throw new Error(`BMKG ${response.status}`);

  const json = await response.json();
  // Pastikan data yang diterima benar-benar untuk kode yang diminta.
  const returned = json.lokasi?.adm4 || json.data?.[0]?.lokasi?.adm4;
  if (returned && returned !== area.code) throw new Error("Kode wilayah dari BMKG tidak sesuai dengan permintaan.");
  const forecasts = (json.data || []).flatMap((group) => group.cuaca || []).flat();
  const stamp = (item) => item.utc_datetime ? new Date(item.utc_datetime.replace(" ", "T") + "Z").getTime() : NaN;
  const valid = forecasts.filter((item) => Number.isFinite(stamp(item))).sort((x, y) => stamp(x) - stamp(y));
  // Slot "sekarang" = slot prakiraan terakhir yang waktunya sudah lewat (bukan slot yang sudah basi atau yang masih jauh).
  const nowMs = Date.now();
  let start = valid.findIndex((item) => stamp(item) > nowMs) - 1;
  if (start < 0) start = valid.findIndex((item) => stamp(item) > nowMs) === 0 ? 0 : valid.length - 1;
  const items = valid.slice(Math.max(start, 0)).map((item) => ({
      time: item.local_datetime?.slice(11, 16) || "—",
      date: item.local_datetime?.slice(0, 10) || "",
      temperature: item.t,
      humidity: item.hu,
      wind: item.ws,
      windFrom: item.wd,
      cloud: item.tcc,
      rain: item.tp,
      visibility: item.vs_text,
      image: item.image || "",
      description: item.weather_desc || "Informasi cuaca tidak tersedia",
      heavy: /lebat|petir/i.test(item.weather_desc || ""),
    }));

  if (!items.length) throw new Error("Data prakiraan BMKG belum tersedia untuk lokasi ini.");

  // Gunakan nama administratif dari respons BMKG agar label wilayah konsisten.
  const location = json.lokasi || {};
  const place = [location.desa, location.kecamatan, location.kotkab, location.provinsi]
    .filter(Boolean)
    .join(", ");

  const offset = Number(String(location.timezone || "").match(/[+-]?\d+/)?.[0]);
  return { source: "BMKG", place: place || area.label, tz: TZ[offset] || "", items };
}

export default function WeatherPage() {
  const [tree, setTree] = useState(null);
  const [treeError, setTreeError] = useState(false);
  const [pick, setPick] = useState(DEFAULT_PICK);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadedLabel, setLoadedLabel] = useState("");
  const reqId = useRef(0);

  useEffect(() => {
    fetch("/wilayah.json")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setTree)
      .catch(() => setTreeError(true));
  }, []);

  // Indeks pencarian: kabupaten/kota, kecamatan, dan desa/kelurahan.
  const index = useMemo(() => {
    if (!tree) return [];
    const out = [];
    for (const [pc, pn, ks] of tree) {
      for (const [kc, kn, cs] of ks) {
        out.push({ level: "k", label: `${kn}, ${pn}`, pick: { p: pc, k: kc }, text: `${kn} ${pn}`.toLowerCase() });
        for (const [cc, cn, ds] of cs) {
          out.push({ level: "c", label: `Kec. ${cn}, ${kn}, ${pn}`, pick: { p: pc, k: kc, c: cc }, text: `${cn} ${kn} ${pn}`.toLowerCase() });
          for (const [dc, dn] of ds) {
            out.push({ level: "d", label: `${dn}, Kec. ${cn}, ${kn}, ${pn}`, pick: { p: pc, k: kc, c: cc, d: dc }, text: `${dn} ${cn} ${kn} ${pn}`.toLowerCase() });
          }
        }
      }
    }
    return out;
  }, [tree]);

  const matches = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length || query.trim().length < 3) return [];
    const found = [];
    for (const e of index) {
      if (words.every((w) => e.text.includes(w))) {
        found.push(e);
        if (found.length >= 40) break;
      }
    }
    // Tampilkan kabupaten/kota dan kecamatan lebih dulu, lalu desa/kelurahan.
    const rank = { k: 0, c: 1, d: 2 };
    return found.sort((a, b) => rank[a.level] - rank[b.level]);
  }, [query, index]);

  const prov = tree?.find((x) => x[0] === pick.p);
  const kab = prov?.[2].find((x) => x[0] === pick.k);
  const kec = kab?.[2].find((x) => x[0] === pick.c);
  const desa = kec?.[2].find((x) => x[0] === pick.d);

  const load = useCallback(async (p) => {
    const id = ++reqId.current;
    setLoading(true); setError(""); setResults(null);
    const area = { code: `${p.p}.${p.k}.${p.c}.${p.d}` };
    try {
      const data = await fetchBmkg(area);
      if (id === reqId.current) setResults(data);
    } catch (err) {
      if (id === reqId.current) {
        setError(/belum tersedia|tidak sesuai/.test(err.message)
          ? err.message
          : "Data BMKG belum dapat dimuat. Periksa koneksi internet lalu coba lagi. Cuaca cadangan tidak ditampilkan agar data tetap akurat.");
      }
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  // Muat otomatis begitu desa/kelurahan lengkap dipilih.
  useEffect(() => {
    if (tree && desa) { setLoadedLabel(`${desa[1]}, Kec. ${kec[1]}, ${kab[1]}, ${prov[1]}`); load(pick); }
    else { reqId.current++; setResults(null); setLoading(false); setLoadedLabel(""); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, pick.p, pick.k, pick.c, pick.d]);

  const [geoMsg, setGeoMsg] = useState("");
  function useMyLocation() {
    if (!navigator.geolocation) { setGeoMsg("Perangkat tidak mendukung lokasi."); return; }
    setGeoMsg("Meminta izin lokasi…");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        setGeoMsg("Mencari desa/kelurahan Anda…");
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=id&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        const a = (await r.json()).address || {};
        const vill = norm(a.village || a.suburb || a.hamlet || a.neighbourhood || a.quarter || "");
        const kecN = norm(a.city_district || a.municipality || a.suburb || "");
        const kabN = norm(a.city || a.county || a.town || a.regency || "");
        let hit = null;
        for (const [pc, , ks] of tree) for (const [kc, kn, cs] of ks) {
          if (!kabN || norm(kn) !== kabN) continue;
          for (const [cc, cn, ds] of cs) {
            if (kecN && norm(cn) === kecN) {
              const d = ds.find(([, dn]) => vill && norm(dn) === vill);
              if (!hit || d) hit = d ? { p: pc, k: kc, c: cc, d: d[0] } : { p: pc, k: kc, c: cc };
            }
          }
          if (!hit) hit = { p: pc, k: kc };
        }
        if (!hit) { setGeoMsg("Wilayah Anda tidak cocok dengan daftar. Pilih manual dari daftar di bawah."); return; }
        setPick(hit);
        setGeoMsg(hit.d ? "Lokasi Anda cocok dengan desa/kelurahan di bawah." : "Desa/kelurahan tidak dapat dicocokkan otomatis. Pilih desa/kelurahan Anda dari daftar.");
      } catch { setGeoMsg("Gagal menentukan wilayah dari lokasi Anda. Pilih manual dari daftar."); }
    }, () => setGeoMsg("Izin lokasi ditolak atau tidak tersedia. Pilih wilayah manual."), { timeout: 10000 });
  }
  const choose = (np) => { setPick(np); setQuery(""); setError(""); };
  const sel = (level) => (e) => {
    const v = e.target.value;
    setError("");
    if (level === "p") setPick({ p: v });
    if (level === "k") setPick({ p: pick.p, k: v });
    if (level === "c") setPick({ p: pick.p, k: pick.k, c: v });
    if (level === "d") setPick({ ...pick, d: v });
  };

  const current = results?.items?.[0];
  const heavyRain = results?.items?.some((item) => item.heavy);

  return (
    <div className="page-wrap section-page weather-page-final">
      <section className="page-heading">
        <span className="eyebrow">CUACA RESMI</span>
        <h1>Informasi Cuaca</h1>
        <p>Prakiraan cuaca berdasarkan wilayah administrasi yang terhubung ke data BMKG.</p>
      </section>

      <section className="weather-search-section" aria-label="Pilih wilayah cuaca">
        {treeError && <div className="weather-error"><Info size={18}/><span>Daftar wilayah gagal dimuat. Muat ulang halaman.</span></div>}
        {!tree && !treeError && <div className="weather-loading"><span className="spinner"/> Memuat daftar wilayah…</div>}
        {tree && <>
          <div className="x-search weather-search-final">
            <Search size={19} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kabupaten/kota, kecamatan, atau desa — mis. Deli Serdang"
              aria-label="Cari wilayah"
            />
            {query && <button type="button" className="weather-clear-search" aria-label="Hapus pencarian" onClick={() => setQuery("")}><X size={16}/></button>}
          </div>
          {query.trim().length >= 3 && (
            <div className="weather-suggestions" role="listbox" aria-label="Hasil wilayah">
              {matches.length ? matches.map((m) => (
                <button type="button" role="option" key={m.label} onClick={() => choose(m.pick)}>
                  <MapPin size={16}/><span>{m.label}<small className="wx-level"> · {m.level === "k" ? "Kab/Kota" : m.level === "c" ? "Kecamatan" : "Desa/Kelurahan"}</small></span>
                </button>
              )) : <p>Wilayah tidak ditemukan.</p>}
            </div>
          )}
          <button type="button" className="x-locate wx-locate" onClick={useMyLocation}><LocateFixed size={17}/> Gunakan lokasi saya</button>
          {geoMsg && <p className="x-status" role="status">{geoMsg}</p>}
          <div className="wx-selects">
            <label>Provinsi
              <select value={pick.p || ""} onChange={sel("p")}>{tree.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
            </label>
            <label>Kabupaten / Kota
              <select value={pick.k || ""} onChange={sel("k")} disabled={!prov}>
                <option value="">Pilih…</option>{prov?.[2].map(([c, n]) => <option key={c} value={c}>{n}</option>)}
              </select>
            </label>
            <label>Kecamatan
              <select value={pick.c || ""} onChange={sel("c")} disabled={!kab}>
                <option value="">Pilih…</option>{kab?.[2].map(([c, n]) => <option key={c} value={c}>{n}</option>)}
              </select>
            </label>
            <label>Desa / Kelurahan
              <select value={pick.d || ""} onChange={sel("d")} disabled={!kec}>
                <option value="">Pilih…</option>{kec?.[2].map(([c, n]) => <option key={c} value={c}>{n}</option>)}
              </select>
            </label>
          </div>
          <p className="weather-search-hint">Prakiraan BMKG tersedia per desa/kelurahan. Pilih sampai tingkat desa/kelurahan untuk menampilkan cuaca.{loadedLabel && <> Wilayah terpilih: <b>{loadedLabel}</b>.</>}</p>
        </>}
      </section>

      <VoiceWeather data={results && !loading ? results : null} />

      {loading && <div className="weather-loading"><span className="spinner"/> Mengambil prakiraan dari BMKG…</div>}
      {error && !loading && <div className="weather-error"><Info size={18}/><span>{error}</span></div>}

      {results && !loading && current && (
        <>
          <section className="x-wx-hero">
            <div className="x-wx-main">
              <div className="x-wx-ic"><WeatherIcon description={current.description} image={current.image} size={62}/></div>
              <div>
                <small>{results.place}</small>
                <div className="x-temp">{current.temperature}°C</div>
                <strong>{current.description}</strong>
                <span className="weather-data-label">Prakiraan BMKG · {current.date} {current.time} {results.tz}</span>
              </div>
            </div>
            <div className="x-wx-stats">
              <div><Droplets size={18}/><span>Kelembapan</span><b>{current.humidity}%</b></div>
              <div><Wind size={18}/><span>Kecepatan angin</span><b>{current.wind} km/jam</b></div>
              {current.rain !== undefined && <div><CloudRain size={18}/><span>Curah hujan</span><b>{current.rain} mm</b></div>}
              {current.cloud !== undefined && <div><Cloud size={18}/><span>Tutupan awan</span><b>{current.cloud}%</b></div>}
              {current.visibility && <div><Eye size={18}/><span>Jarak pandang</span><b>{current.visibility}</b></div>}
              <div><Thermometer size={18}/><span>Sumber data</span><b>BMKG</b></div>
            </div>
          </section>

          <section className={`x-advice ${heavyRain ? "hot" : ""}`}>
            {heavyRain ? <TriangleAlert size={22}/> : <ShieldCheck size={22}/>}
            <div>
              <b>{heavyRain ? "Perhatikan prakiraan hujan lebat" : "Tetap pantau perubahan cuaca"}</b>
              <span>{heavyRain ? "Prakiraan memuat kondisi hujan lebat atau petir. Jika tinggal dekat sungai atau lereng, tingkatkan kewaspadaan dan ikuti arahan petugas." : "Periksa pembaruan resmi, terutama jika tinggal di dekat sungai atau lereng yang rawan."}</span>
            </div>
          </section>

          <h2 className="x-h2">Prakiraan berikutnya</h2>
          <section className="x-forecast weather-forecast-final">
            {results.items.map((item, index) => (
              <article key={`${item.date}-${item.time}-${index}`} className={item.heavy ? "heavy" : ""}>
                <span>{index === 0 || item.date !== results.items[index - 1].date ? `${item.date.slice(8, 10)}/${item.date.slice(5, 7)} · ` : ""}{item.time}{results.tz ? ` ${results.tz}` : ""}</span>
                <WeatherIcon description={item.description} image={item.image} size={30}/>
                <b>{item.temperature}°C</b>
                <p>{item.description}</p>
                <small>{item.humidity}% · {item.wind} km/j{item.rain ? ` · ${item.rain} mm` : ""}</small>
              </article>
            ))}
          </section>
        </>
      )}

      <aside className="official-source-note">
        <ShieldCheck size={18}/>
        <div>
          <strong>Sumber: BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)</strong>
          <p>Data yang ditampilkan berasal dari layanan prakiraan BMKG. Waktu dan kondisi prakiraan mengikuti data yang diterima. Untuk peringatan resmi, kunjungi <a href="https://www.bmkg.go.id/cuaca/peringatan-dini-cuaca" target="_blank" rel="noreferrer">BMKG</a>.</p>
        </div>
      </aside>
    </div>
  );
}
