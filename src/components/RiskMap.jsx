import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowRight, ExternalLink, Info, LocateFixed, Search, TriangleAlert, Waves, Mountain, X } from "lucide-react";

// Layer resmi InaRISK BNPB (ArcGIS ImageServer, diakses lewat WMS).
const BNPB = "https://gis.bnpb.go.id/server/services/inarisk";
const wmsUrl = (s) => `${BNPB}/${s}/ImageServer/WMSServer`;
const legendUrl = (s) => `${wmsUrl(s)}?request=GetLegendGraphic&version=1.3.0&format=image/png&layer=${s}`;

const LAYERS = [
  { id: "bh-banjir", label: "Bahaya Banjir", service: "layer_bahaya_banjir", icon: Waves },
  { id: "bh-longsor", label: "Bahaya Tanah Longsor", service: "layer_bahaya_tanah_longsor", icon: Mountain },
  { id: "rs-banjir", label: "Risiko Banjir", service: "layer_risiko_banjir", icon: Waves },
  { id: "rs-longsor", label: "Risiko Tanah Longsor", service: "layer_risiko_tanah_longsor", icon: Mountain },
];

// Pembacaan nilai raster di satu titik lewat REST ImageServer BNPB (lewat proxy /api/bnpb agar tidak terblokir CORS).
// Nilai raster berupa indeks 0–1 (pixelType F32); kelas mengikuti Perka BNPB No. 2 Tahun 2012 (Pedoman Umum Pengkajian Risiko Bencana): skor < 0,34 Rendah; 0,34–0,66 Sedang; > 0,67 Tinggi.
// Perka menyisakan celah (0,33–0,34 dan 0,66–0,67); nilai di celah dimasukkan ke kelas di bawah batas atasnya agar tidak ada nilai tanpa kelas.
function classOf(v) {
  if (v < 0.34) return { text: "Rendah", color: "#7cb342" };
  if (v < 0.67) return { text: "Sedang", color: "#fb8c00" };
  return { text: "Tinggi", color: "#e53935" };
}
function parseValue(j) {
  // Beberapa bentuk balasan ArcGIS ImageServer: value, properties.Values, atau catalogItems.
  const cands = [j.value, j.properties?.Values?.[0], j.properties?.values?.[0]];
  for (const c of cands) {
    if (c === undefined || c === null) continue;
    const n = parseFloat(String(c).split(/[ ,]/)[0]);
    if (Number.isFinite(n)) return n;
  }
  return null;
}
async function identify(service, lat, lng) {
  const base = `/api/bnpb/server/rest/services/inarisk/${service}/ImageServer/identify`;
  // Layanan ini berkoordinat EPSG:3395 (meter) dan mengabaikan sr=4326, jadi titik diproyeksikan dulu.
  const { x, y } = L.CRS.EPSG3395.project(L.latLng(lat, lng));
  const geo = encodeURIComponent(JSON.stringify({ x, y, spatialReference: { wkid: 3395 } }));
  const urls = [
    `${base}?geometry=${geo}&geometryType=esriGeometryPoint&returnGeometry=false&returnCatalogItems=false&f=json`,
    `${base}?geometry=${x},${y}&geometryType=esriGeometryPoint&sr=3395&returnGeometry=false&returnCatalogItems=false&f=json`,
  ];
  let raw = "";
  for (const url of urls) {
    const r = await fetch(url);
    const text = await r.text();
    raw = `${r.status} ${text.slice(0, 300)}`;
    let j; try { j = JSON.parse(text); } catch { continue; }
    if (j.error) continue;
    const v = parseValue(j);
    if (v !== null) return { value: v, ...classOf(v), raw, src: url.replace("/api/bnpb", "https://gis.bnpb.go.id") };
  }
  return { none: true, raw };
}
function shortPlace(a = {}, fallback = "") {
  const desa = a.village || a.suburb || a.hamlet || a.neighbourhood || a.quarter;
  const kec = a.city_district || a.municipality;
  const kab = a.city || a.town || a.regency || a.county || a.state_district;
  const parts = [desa, kec, kab, a.state].filter(Boolean);
  return parts.length ? parts.filter((x, i) => parts.indexOf(x) === i).join(", ") : fallback;
}


// ---------- Analisis wilayah (kota/kabupaten/provinsi) ----------
// Batas wilayah dari OpenStreetMap (Nominatim, polygon_geojson). Di dalam batas itu dibuat titik-titik sampel
// berbentuk grid, lalu nilai raster InaRISK dibaca pada tiap titik. Titik diberi warna sesuai kelas (tinggi/sedang/rendah).
const isAdmin = (r) => !!r?.geojson && /Polygon/.test(r.geojson.type) && (r.category === "boundary" || r.class === "boundary");
const toPolys = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);
function ringContains(ring, x, y) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const polyContains = (polys, x, y) => polys.some((rings) => ringContains(rings[0], x, y) && !rings.slice(1).some((h) => ringContains(h, x, y)));
function gridPoints(polys, target) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  polys.forEach((rings) => rings[0].forEach(([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }));
  let step = Math.sqrt(((maxX - minX) * (maxY - minY)) / target);
  let pts = [];
  for (let it = 0; it < 10; it++) {
    pts = [];
    for (let y = minY + step / 2; y < maxY; y += step) for (let x = minX + step / 2; x < maxX; x += step) if (polyContains(polys, x, y)) pts.push({ lat: y, lng: x });
    if (pts.length >= target * 0.8 && pts.length <= target * 1.25) break;
    const ratio = pts.length ? Math.sqrt(pts.length / target) : 0.5;
    step *= Math.min(2, Math.max(0.5, ratio));
  }
  if (!pts.length) pts = [{ lat: (minY + maxY) / 2, lng: (minX + maxX) / 2 }];
  return pts;
}
async function pool(items, n, fn, stop) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length && !stop()) { const k = i++; await fn(items[k], k); } }));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function areaName(r) { return r.display_name.split(",").slice(0, 2).join(",").trim(); }
const CLASSES = [["Tinggi", "#e53935"], ["Sedang", "#fb8c00"], ["Rendah", "#7cb342"]];

export default function RiskMap() {
  const box = useRef(null), map = useRef(null), wms = useRef(null), pin = useRef(null);
  const loaded = useRef(0), failed = useRef(0), hits = useRef(null), markReq = useRef(0);
  const [layerId, setLayerId] = useState(LAYERS[0].id);
  const [opacity, setOpacity] = useState(0.7);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("");
  const [problem, setProblem] = useState(false);
  const [legendOk, setLegendOk] = useState(true);
  const [point, setPoint] = useState(null);
  const [info, setInfo] = useState(null); // { name, risks: [{label, state, ...}] }
  const [area, setArea] = useState(null); // { id, name, pts, polys }
  const [samples, setSamples] = useState({}); // `${areaId}:${layerId}` -> { status, done, total, items, none, err }
  const [tops, setTops] = useState({}); // `${areaId}:${layerId}` -> [{ name, lat, lng, text, color, value }]
  const [show, setShow] = useState({ Tinggi: true, Sedang: true, Rendah: true });
  const areaRef = useRef(null), outline = useRef(null), dots = useRef(null), running = useRef(new Set()), samplesRef = useRef({});
  samplesRef.current = samples;
  const layer = LAYERS.find((l) => l.id === layerId);

  useEffect(() => {
    const m = L.map(box.current, { center: [2.2, 99.0], zoom: 7, minZoom: 4, maxZoom: 16, zoomControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "© OpenStreetMap",
    }).addTo(m);
    m.on("click", (e) => mark(e.latlng.lat, e.latlng.lng));
    map.current = m;
    dots.current = L.layerGroup().addTo(m);
    const fix = () => m.invalidateSize();
    window.addEventListener("resize", fix);
    setTimeout(fix, 200);
    return () => { window.removeEventListener("resize", fix); m.remove(); };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    if (wms.current) map.current.removeLayer(wms.current);
    loaded.current = 0; failed.current = 0; setProblem(false); setLegendOk(true);
    const l = L.tileLayer.wms(wmsUrl(layer.service), {
      layers: layer.service, format: "image/png", transparent: true, version: "1.3.0",
      crs: L.CRS.EPSG3395, opacity, attribution: "Data risiko: InaRISK BNPB",
    });
    l.on("tileload", () => { loaded.current++; setProblem(false); });
    l.on("tileerror", () => { failed.current++; if (failed.current >= 4 && loaded.current === 0) setProblem(true); });
    l.addTo(map.current); wms.current = l;
  }, [layerId]);

  useEffect(() => { wms.current?.setOpacity(opacity); }, [opacity]);

  // Baca nilai raster pada titik-titik sampel wilayah untuk peta yang sedang dipilih.
  useEffect(() => {
    if (!area) return;
    const key = `${area.id}:${layerId}`;
    if (samplesRef.current[key] || running.current.has(key)) return;
    running.current.add(key);
    const l = LAYERS.find((x) => x.id === layerId);
    const items = []; let done = 0, none = 0, err = 0;
    const push = (status) => setSamples((s) => ({ ...s, [key]: { status, done, total: area.pts.length, items: items.slice(), none, err } }));
    push("loading");
    const stop = () => areaRef.current?.id !== area.id;
    pool(area.pts, 8, async (pt) => {
      try {
        const res = await identify(l.service, pt.lat, pt.lng);
        if (res.none) none++; else items.push({ lat: pt.lat, lng: pt.lng, value: res.value, text: res.text, color: res.color });
      } catch { err++; }
      done++;
      if (done % 6 === 0) push("loading");
    }, stop).then(() => { running.current.delete(key); if (!stop()) push(items.length === 0 && err > area.pts.length / 2 ? "failed" : "done"); });
  }, [area, layerId]);

  // Gambar titik sampel di peta sesuai filter kelas.
  const cur = area ? samples[`${area.id}:${layerId}`] : null;
  useEffect(() => {
    if (!dots.current) return;
    dots.current.clearLayers();
    if (!cur) return;
    cur.items.filter((it) => show[it.text]).forEach((it) => {
      L.circleMarker([it.lat, it.lng], { radius: 7, color: "#fff", weight: 1.5, fillColor: it.color, fillOpacity: 0.95, bubblingMouseEvents: false })
        .bindTooltip(`${it.text} · indeks ${it.value.toFixed(2)}`, { direction: "top" })
        .on("click", () => mark(it.lat, it.lng))
        .addTo(dots.current);
    });
  }, [cur, show]);

  // Setelah pembacaan selesai: namai beberapa titik dengan nilai tertinggi (satu per satu, sesuai batas laju Nominatim).
  useEffect(() => {
    if (!area || !cur || cur.status !== "done") return;
    const key = `${area.id}:${layerId}`;
    if (tops[key]) return;
    let cancelled = false;
    (async () => {
      const ranked = cur.items.slice().sort((a, b) => b.value - a.value).slice(0, 14);
      const out = [], seen = new Set();
      for (const it of ranked) {
        if (cancelled || out.length >= 6) break;
        try {
          const d = await (await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&addressdetails=1&accept-language=id&lat=${it.lat}&lon=${it.lng}`)).json();
          const name = shortPlace(d.address, d.display_name || "");
          if (name && !seen.has(name)) { seen.add(name); out.push({ ...it, name }); }
        } catch { /* lewati */ }
        await sleep(1100);
      }
      if (!cancelled) setTops((t) => ({ ...t, [key]: out }));
    })();
    return () => { cancelled = true; };
  }, [cur?.status, area, layerId]);

  const counts = useMemo(() => {
    const c = { Tinggi: 0, Sedang: 0, Rendah: 0 };
    cur?.items.forEach((it) => { c[it.text]++; });
    return c;
  }, [cur]);

  function clearArea() {
    areaRef.current = null; setArea(null); setSamples({}); setTops({});
    if (outline.current) { outline.current.remove(); outline.current = null; }
    dots.current?.clearLayers();
  }
  function analyzeArea(r) {
    if (areaRef.current?.id === `${r.osm_type}${r.osm_id}` && outline.current) { map.current.fitBounds(outline.current.getBounds(), { padding: [30, 30] }); return; }
    if (pin.current) { map.current.removeLayer(pin.current); pin.current = null; }
    if (hits.current) { hits.current.remove(); hits.current = null; }
    if (outline.current) outline.current.remove();
    markReq.current++; setPoint(null); setInfo(null); setTops({}); setSamples({}); running.current.clear();
    const polys = toPolys(r.geojson);
    outline.current = L.geoJSON(r.geojson, { style: { color: "#0b7f78", weight: 2.5, fill: false, dashArray: "6 5" }, interactive: false }).addTo(map.current);
    map.current.fitBounds(outline.current.getBounds(), { padding: [30, 30] });
    const b = outline.current.getBounds();
    const big = (b.getNorth() - b.getSouth()) * (b.getEast() - b.getWest()) > 6; // > ±6 derajat persegi (provinsi besar)
    const pts = gridPoints(polys, big ? 170 : 110);
    const a = { id: `${r.osm_type}${r.osm_id}`, name: areaName(r), pts, polys };
    areaRef.current = a; setArea(a);
    setStatus("");
  }

  async function mark(lat, lng, zoom, knownName) {
    if (pin.current) map.current.removeLayer(pin.current);
    pin.current = L.circleMarker([lat, lng], { radius: 9, color: "#fff", weight: 3, fillColor: "#0b7f78", fillOpacity: 1 }).addTo(map.current);
    setPoint({ lat, lng });
    if (zoom) map.current.setView([lat, lng], zoom);
    const id = ++markReq.current;
    setInfo({ name: knownName || "Mencari nama lokasi…", risks: LAYERS.map((l) => ({ label: l.label, state: "loading" })) });
    // Nama lokasi (reverse geocoding OpenStreetMap)
    if (!knownName) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&addressdetails=1&accept-language=id&lat=${lat}&lon=${lng}`)
        .then((r) => r.json())
        .then((d) => { if (id === markReq.current) setInfo((i) => ({ ...i, name: d.error ? "Nama lokasi tidak ditemukan" : shortPlace(d.address, d.display_name) })); })
        .catch(() => { if (id === markReq.current) setInfo((i) => ({ ...i, name: "Nama lokasi tidak dapat dimuat" })); });
    }
    // Nilai bahaya/risiko pada titik ini untuk keempat peta
    LAYERS.forEach((l, n) => {
      identify(l.service, lat, lng)
        .then((res) => res.none ? { state: "none", raw: res.raw } : { state: "ok", ...res })
        .catch((e) => ({ state: "error", raw: String(e.message || e) }))
        .then((res) => { if (id === markReq.current) setInfo((i) => ({ ...i, risks: i.risks.map((x, k) => k === n ? { label: l.label, ...res } : x) })); });
    });
  }

  function showHits(list) {
    if (hits.current) hits.current.remove();
    const g = L.layerGroup();
    list.forEach((r, i) => {
      L.marker([+r.lat, +r.lon], { icon: L.divIcon({ className: "x-hit", html: `<span>${i + 1}</span>`, iconSize: [26, 26] }) })
        .bindTooltip(`${i + 1}. ${r.display_name.split(",").slice(0, 3).join(",")}`, { direction: "top" })
        .on("click", () => { pickHit(r); })
        .addTo(g);
    });
    g.addTo(map.current); hits.current = g;
    if (list.length) map.current.fitBounds(L.latLngBounds(list.map((r) => [+r.lat, +r.lon])), { maxZoom: 12, padding: [40, 40] });
  }
  function pickHit(r) {
    if (hits.current) { hits.current.remove(); hits.current = null; }
    if (isAdmin(r)) { analyzeArea(r); return; } // kota/kabupaten/provinsi: tampilkan sebaran titik; daftar hasil tetap ada
    setResults([]);
    if (areaRef.current) clearArea();
    mark(+r.lat, +r.lon, 12, r.display_name);
  }

  async function search(e) {
    e?.preventDefault();
    if (!query.trim()) return;
    setStatus("Mencari lokasi…"); setResults([]);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=id&limit=8&accept-language=id&polygon_geojson=1&polygon_threshold=0.01&q=${encodeURIComponent(query)}`);
      const d = await r.json();
      setResults(d); setStatus(d.length ? "" : "Lokasi tidak ditemukan. Coba nama desa/kecamatan/kota lain.");
      if (d.length && isAdmin(d[0])) analyzeArea(d[0]); // wilayah administratif: langsung tampilkan titik-titik risiko di dalamnya
      else showHits(d);
    } catch { setStatus("Pencarian lokasi gagal. Periksa koneksi internet lalu coba lagi."); }
  }
  function myLocation() {
    if (!navigator.geolocation) { setStatus("Perangkat tidak mendukung lokasi."); return; }
    setStatus("Meminta izin lokasi…");
    navigator.geolocation.getCurrentPosition(
      (p) => { if (areaRef.current) clearArea(); mark(p.coords.latitude, p.coords.longitude, 13); setStatus("Lokasi Anda ditandai pada peta."); },
      () => setStatus("Izin lokasi ditolak atau tidak tersedia. Anda tetap bisa mencari nama desa/kecamatan."),
      { timeout: 10000 }
    );
  }

  return <div className="page-wrap section-page">
    <section className="page-heading"><span className="eyebrow">DATA RESMI INARISK BNPB</span><h1>Peta Risiko Bencana</h1><p>Cari desa, kecamatan, kota, atau provinsi (mis. Sumatera Utara, Medan), pilih jenis peta, lalu lihat titik-titik wilayah yang rawan banjir atau longsor.</p></section>

    <div className="x-map-shell">
      <aside className="x-panel">
        <form className="x-search" onSubmit={search}>
          <Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari desa, kecamatan, kota, atau provinsi" aria-label="Cari lokasi"/>
          <button type="submit" aria-label="Cari"><ArrowRight size={18}/></button>
        </form>
        <button className="x-locate" onClick={myLocation}><LocateFixed size={17}/> Gunakan lokasi saya</button>
        {status && <p className="x-status" role="status">{status}</p>}
        {results.length > 0 && <ul className="x-results">{results.map((r, i) => <li key={r.place_id}><button onClick={() => pickHit(r)}><b>{i + 1}.</b> {r.display_name}</button></li>)}</ul>}


        {area && (() => {
          const key = `${area.id}:${layerId}`; const t = tops[key]; const total = cur?.total || area.pts.length; const pct = Math.round(((cur?.done || 0) / total) * 100);
          return <div className="x-area">
            <div className="x-area-head"><div><b>{area.name}</b><small>{layer.label} · {total} titik sampel</small></div><button type="button" onClick={clearArea} aria-label="Tutup analisis wilayah"><X size={16}/></button></div>
            {cur?.status === "loading" && <div className="x-area-prog" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100"><i style={{ width: pct + "%" }}/><span>Membaca data BNPB… {pct}%</span></div>}
            {cur?.status === "failed" && <p className="x-area-err">Data BNPB tidak dapat dibaca untuk titik-titik ini. Layanan mungkin sedang sibuk; coba lagi nanti atau buka InaRISK.</p>}
            {cur && cur.items.length > 0 && <>
              <div className="x-area-counts" role="group" aria-label="Filter kelas">
                {CLASSES.map(([name, color]) => <button type="button" key={name} aria-pressed={show[name]} className={show[name] ? "on" : ""} onClick={() => setShow((s) => ({ ...s, [name]: !s[name] }))}><i style={{ background: color }}/>{name} <b>{counts[name]}</b></button>)}
              </div>
              {(cur.none > 0 || cur.err > 0) && cur.status === "done" && <small className="x-area-note">{cur.none > 0 && `${cur.none} titik tanpa data raster (mis. laut/sungai besar)`}{cur.none > 0 && cur.err > 0 && "; "}{cur.err > 0 && `${cur.err} titik gagal dibaca`}.</small>}
              {cur.status === "done" && <div className="x-area-top"><h4>Titik dengan nilai tertinggi</h4>
                {!t && <small>Mencari nama wilayah…</small>}
                {t && t.length === 0 && <small>Nama wilayah tidak dapat dimuat. Klik titik di peta untuk melihat detailnya.</small>}
                {t && <ol>{t.map((x) => <li key={x.lat + "," + x.lng}><button type="button" onClick={() => { map.current.setView([x.lat, x.lng], 11); mark(x.lat, x.lng, undefined, x.name); }}><span style={{ color: x.color }}>●</span> {x.name}<small>{x.text} · {x.value.toFixed(2)}</small></button></li>)}</ol>}
              </div>}
              <small className="x-area-note">Titik adalah sampel grid dari raster InaRISK, bukan daftar lengkap lokasi bencana. Klik titik untuk melihat detail dan nama lokasi. Warna latar peta tetap mengikuti data resmi.</small>
            </>}
          </div>;
        })()}
        <h3 className="x-h">Pilih peta</h3>
        <div className="x-chips" role="radiogroup" aria-label="Jenis peta">
          {LAYERS.map((l) => { const I = l.icon; return <button key={l.id} role="radio" aria-checked={layerId === l.id} className={layerId === l.id ? "on" : ""} onClick={() => setLayerId(l.id)}><I size={16}/>{l.label}</button>; })}
        </div>

        <label className="x-range">Transparansi peta risiko<input type="range" min="0.2" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(+e.target.value)}/></label>

        <h3 className="x-h">Cara membaca warna</h3>
        <div className="x-legend">
          {legendOk && <img src={legendUrl(layer.service)} alt={`Legenda resmi ${layer.label}`} onError={() => setLegendOk(false)}/>}
          <ul><li><i style={{ background: "#e53935" }}/>Merah: tinggi</li><li><i style={{ background: "#fb8c00" }}/>Kuning/oranye: sedang</li><li><i style={{ background: "#7cb342" }}/>Hijau: rendah</li></ul>
          <small>Ikuti legenda resmi di atas jika ada. Wilayah hijau tidak berarti bebas bencana.</small>
        </div>
      </aside>

      <div className="x-map-wrap">
        <div ref={box} className="x-map" role="application" aria-label="Peta risiko bencana"/>
        {problem && <div className="x-warn" role="alert"><TriangleAlert size={20}/><div><b>Layer BNPB belum bisa dimuat.</b><span>Server BNPB mungkin sedang sibuk atau memblokir permintaan dari alamat ini.</span><a href="https://inarisk.bnpb.go.id/webgis/" target="_blank" rel="noreferrer">Buka InaRISK <ExternalLink size={13}/></a></div></div>}
        {point && info && <div className="x-point">
          <b>{info.name}</b>
          <span>{point.lat.toFixed(5)}, {point.lng.toFixed(5)}</span>
          <ul className="x-risk-list">{info.risks.map((r) => <li key={r.label}>
            <span>{r.label}</span>
            {r.state === "loading" && <em>memuat…</em>}
            {r.state === "ok" && <strong style={{ color: r.color }}>{r.text} <small>(indeks {r.value.toFixed(2)})</small></strong>}
            {r.state === "none" && <em>tidak ada data raster di titik ini</em>}
            {r.state === "error" && <em>tidak dapat dibaca</em>}
          </li>)}</ul>
          <details className="x-proof"><summary>Bukti sumber data & cara memverifikasi</summary>
            <p>Angka di atas dibaca langsung dari raster InaRISK BNPB (indeks 0–1, piksel 100 m). Kelas mengikuti Perka BNPB No. 2 Tahun 2012 tentang Pedoman Umum Pengkajian Risiko Bencana: rendah di bawah 0,34, sedang 0,34–0,66, tinggi di atas 0,67 (nilai di antara 0,66 dan 0,67 dimasukkan ke sedang). Klik tautan untuk melihat jawaban mentah server BNPB di titik yang sama:</p>
            <ul>{info.risks.filter((r) => r.src).map((r) => <li key={r.label}><a href={r.src} target="_blank" rel="noreferrer">{r.label}: nilai mentah {r.value.toFixed(4)} <ExternalLink size={12}/></a></li>)}</ul>
            <a href="https://inarisk.bnpb.go.id/webgis/" target="_blank" rel="noreferrer">Buka InaRISK resmi untuk membandingkan <ExternalLink size={12}/></a>
            <small>Koordinat titik: {point.lat.toFixed(5)}, {point.lng.toFixed(5)}. Jika berbeda dari InaRISK, catat koordinat dan layer yang dibandingkan agar bisa ditelusuri.</small>
          </details>
          {info.risks.some((r) => r.raw && r.state !== "ok") && <details className="x-debug"><summary>Detail teknis (untuk pengecekan)</summary>{info.risks.filter((r) => r.raw && r.state !== "ok").map((r) => <pre key={r.label}>{r.label}: {r.raw}</pre>)}</details>}
          <small>Nilai dibaca dari layanan InaRISK BNPB di titik ini. Cocokkan dengan legenda resmi; data bersifat indikatif.</small>
        </div>}
      </div>
    </div>

    <div className="official-map-note"><Info size={18}/><p><strong>Sumber & batasan.</strong> Layer risiko berasal dari layanan peta resmi InaRISK BNPB; peta dasar dari OpenStreetMap. Data bersifat indikatif dan bukan prediksi kejadian. Periksa tanggal dan metodologi di <a href="https://inarisk.bnpb.go.id/portal/Unduh" target="_blank" rel="noreferrer">portal InaRISK</a> sebelum mengambil keputusan.</p></div>
  </div>;
}
