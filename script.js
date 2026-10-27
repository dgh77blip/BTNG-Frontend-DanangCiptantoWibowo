const API_URL = "https://api-web.dnccudinus.org/api/mobil";

// Foto cadangan hanya digunakan jika API tidak menyediakan URL gambar.
// Data contoh di bawah tidak menggantikan integrasi API; status fallback ditampilkan di halaman.
const demoCars = [
  {id:"demo-1",nama:"Honda Civic",merek:"Honda",model:"Civic",tahun:2024,harga:585000000,transmisi:"Automatic",jenis:"Sedan",gambar:"https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80",deskripsi:"Sedan modern untuk perjalanan penuh percaya diri."},
  {id:"demo-2",nama:"Toyota Land Cruiser",merek:"Toyota",model:"Land Cruiser",tahun:2023,harga:2450000000,transmisi:"Automatic",jenis:"SUV",gambar:"https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80",deskripsi:"SUV tangguh untuk perjalanan lebih jauh."},
  {id:"demo-3",nama:"BMW Series 3",merek:"BMW",model:"Series 3",tahun:2024,harga:990000000,transmisi:"Automatic",jenis:"Sedan",gambar:"https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=900&q=80",deskripsi:"Perpaduan karakter dinamis dan kenyamanan."},
  {id:"demo-4",nama:"Mercedes-Benz GLC",merek:"Mercedes-Benz",model:"GLC",tahun:2023,harga:1250000000,transmisi:"Automatic",jenis:"SUV",gambar:"https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=900&q=80",deskripsi:"Kenyamanan premium dalam desain berkarakter."},
  {id:"demo-5",nama:"Hyundai IONIQ 5",merek:"Hyundai",model:"IONIQ 5",tahun:2024,harga:780000000,transmisi:"Automatic",jenis:"Electric",gambar:"https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=900&q=80",deskripsi:"Gaya futuristik untuk mobilitas masa kini."},
  {id:"demo-6",nama:"Mazda CX-5",merek:"Mazda",model:"CX-5",tahun:2023,harga:625000000,transmisi:"Automatic",jenis:"SUV",gambar:"https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80",deskripsi:"SUV dengan detail desain yang elegan."}
];

const grid = document.querySelector("#carGrid");
const searchInput = document.querySelector("#searchInput");
const brandFilter = document.querySelector("#brandFilter");
const sortSelect = document.querySelector("#sortSelect");
const resultCount = document.querySelector("#resultCount");
const apiNotice = document.querySelector("#apiNotice");
const emptyState = document.querySelector("#emptyState");
const carDialog = document.querySelector("#carDialog");
const dialogContent = document.querySelector("#dialogContent");
let cars = [];
let usingDemoData = false;

function firstValue(object, keys) {
  for (const key of keys) {
    const value = object?.[key];
    if (value !== undefined && value !== null && value !== "") {
      if (typeof value === "object") {
        const nested = value.url || value.path || value.name || value.value;
        if (nested) return nested;
      } else return value;
    }
  }
  return "";
}
function normalizeCar(raw, index) {
  const name = firstValue(raw, ["nama","name","nama_mobil","model","title","mobil","car_name","tipe"]) || `Mobil ${index + 1}`;
  const brand = firstValue(raw, ["merek","brand","merk","manufacturer","nama_merek"]) || "";
  const model = firstValue(raw, ["model","tipe","type","nama_model"]) || name;
  const rawPrice = firstValue(raw, ["harga","price","harga_mobil","nominal","selling_price"]);
  const numericPrice = typeof rawPrice === "number" ? rawPrice : Number(String(rawPrice).replace(/[^\d]/g, ""));
  const image = firstValue(raw, ["gambar","image","foto","image_url","photo","thumbnail","url_gambar","foto_mobil"]);
  return {
    id: firstValue(raw, ["id","_id","mobil_id","uuid"]) || `car-${index}`,
    nama: String(name),
    merek: String(brand || name.split(" ")[0]),
    model: String(model),
    tahun: firstValue(raw, ["tahun","year","tahun_produksi"]) || "",
    harga: Number.isFinite(numericPrice) ? numericPrice : 0,
    transmisi: String(firstValue(raw, ["transmisi","transmission","gearbox"]) || ""),
    jenis: String(firstValue(raw, ["jenis","kategori","category","body_type"]) || "Pilihan OtoDrive"),
    gambar: image ? String(image) : "",
    deskripsi: String(firstValue(raw, ["deskripsi","description","keterangan","detail"]) || "Temukan detail kendaraan ini bersama tim OtoDrive."),
    raw
  };
}
function extractArray(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ["data","mobil","cars","results","items","vehicles"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (payload && typeof payload === "object") {
    for (const value of Object.values(payload)) {
      if (Array.isArray(value)) return value;
    }
  }
  return null;
}
function formatPrice(price) {
  if (!price) return "Hubungi kami";
  return new Intl.NumberFormat("id-ID", {style:"currency",currency:"IDR",maximumFractionDigits:0}).format(price).replace(/\u00a0/g," ");
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function imageFallback(car) {
  const palettes = ["#dce3d5","#d7dedf","#e7ddd0","#d8dcd1"];
  const index = Math.abs(String(car.id).length + String(car.nama).length) % palettes.length;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="${palettes[index]}"/><g fill="#27352b" opacity=".88"><path d="M135 310l42-82c9-18 28-29 48-29h286c23 0 42 11 55 31l55 80 42 14v57H105v-55z"/><path d="M250 214h244l-42-62H299z" fill="#aebbb0"/><circle cx="230" cy="365" r="43" fill="#17201b"/><circle cx="230" cy="365" r="20" fill="#b8c2b5"/><circle cx="570" cy="365" r="43" fill="#17201b"/><circle cx="570" cy="365" r="20" fill="#b8c2b5"/></g><text x="400" y="90" font-family="Arial" font-size="24" fill="#27352b" text-anchor="middle" letter-spacing="8">OtoDrive</text></svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}
function getCarImage(car) {
  if (car.gambar && /^(https?:\/\/|data:image\/)/i.test(car.gambar)) return car.gambar;
  return imageFallback(car);
}
function fillBrandFilter() {
  const current = brandFilter.value;
  const brands = [...new Set(cars.map(car => car.merek).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"id"));
  brandFilter.innerHTML = '<option value="">Semua merek</option>' + brands.map(brand => `<option value="${escapeHTML(brand)}">${escapeHTML(brand)}</option>`).join("");
  if (brands.includes(current)) brandFilter.value = current;
}
function visibleCars() {
  const query = searchInput.value.trim().toLocaleLowerCase("id");
  const brand = brandFilter.value;
  let filtered = cars.filter(car => {
    const searchable = `${car.nama} ${car.merek} ${car.model} ${car.jenis} ${car.tahun}`.toLocaleLowerCase("id");
    return searchable.includes(query) && (!brand || car.merek === brand);
  });
  switch (sortSelect.value) {
    case "name": filtered.sort((a,b)=>a.nama.localeCompare(b.nama,"id")); break;
    case "priceAsc": filtered.sort((a,b)=>(a.harga || Infinity)-(b.harga || Infinity)); break;
    case "priceDesc": filtered.sort((a,b)=>b.harga-a.harga); break;
  }
  return filtered;
}
function renderCars() {
  const filtered = visibleCars();
  resultCount.textContent = `${filtered.length} mobil ${usingDemoData ? "pilihan" : "tersedia"}`;
  emptyState.hidden = filtered.length > 0;
  grid.hidden = filtered.length === 0;
  grid.innerHTML = filtered.map((car, index) => `
    <article class="car-card" tabindex="0" role="button" aria-label="Lihat detail ${escapeHTML(car.nama)}" data-car-id="${escapeHTML(car.id)}">
      <div class="car-photo"><img src="${escapeHTML(getCarImage(car))}" alt="${escapeHTML(car.nama)}" loading="lazy" onerror="this.onerror=null;this.src='${imageFallback(car)}'"><span class="car-badge">${escapeHTML(car.jenis || "PILIHAN OtoDrive")}</span><span class="car-arrow">↗</span></div>
      <div class="car-info"><div class="car-meta"><span>${escapeHTML(car.merek || "OtoDrive")}</span><span>${escapeHTML(car.tahun || "FEATURED")}</span></div><h3>${escapeHTML(car.nama)}</h3><p class="car-description">${escapeHTML(car.transmisi || car.deskripsi)}</p><div class="car-card-bottom"><div><div class="price-label">HARGA / ESTIMASI</div><div class="car-price">${escapeHTML(formatPrice(car.harga))}</div></div><span class="detail-link">Detail <span>↗</span></span></div></div>
    </article>`).join("");
}
function showCarDetail(id) {
  const car = cars.find(item => String(item.id) === String(id));
  if (!car) return;
  dialogContent.innerHTML = `<img class="dialog-photo" src="${escapeHTML(getCarImage(car))}" alt="${escapeHTML(car.nama)}" onerror="this.onerror=null;this.src='${imageFallback(car)}'"><div class="dialog-body"><div class="eyebrow"><span></span> ${escapeHTML(car.merek || "OtoDrive")} · ${escapeHTML(car.tahun || "KOLEKSI")}</div><h2>${escapeHTML(car.nama)}</h2><p>${escapeHTML(car.deskripsi)}</p><div class="dialog-price">${escapeHTML(formatPrice(car.harga))}</div><div class="dialog-specs">${car.jenis ? `<span>Jenis: ${escapeHTML(car.jenis)}</span>` : ""}${car.tahun ? `<span>Tahun: ${escapeHTML(car.tahun)}</span>` : ""}${car.transmisi ? `<span>Transmisi: ${escapeHTML(car.transmisi)}</span>` : ""}</div><div class="dialog-contact"><a href="mailto:hello@otodrive.example?subject=${encodeURIComponent("Informasi " + car.nama)}">Tanyakan mobil ini ↗</a></div></div>`;
  carDialog.showModal();
}
async function loadCars() {
  try {
    const response = await fetch(API_URL, {headers:{"Accept":"application/json"}});
    if (!response.ok) throw new Error(`Server merespons ${response.status}`);
    const payload = await response.json();
    const data = extractArray(payload);
    if (!data) throw new Error("Format respons API belum dikenali. Periksa struktur JSON endpoint.");
    cars = data.map(normalizeCar);
    usingDemoData = false;
    if (!cars.length) {
      apiNotice.hidden = false;
      apiNotice.textContent = "API berhasil dihubungi, tetapi belum ada data mobil yang dapat ditampilkan.";
    } else {
      apiNotice.hidden = true;
    }
  } catch (error) {
    console.error("Gagal memuat data API mobil:", error);
    cars = demoCars.map(normalizeCar);
    usingDemoData = true;
    apiNotice.hidden = false;
    apiNotice.textContent = "API belum dapat diakses dari browser ini. Yang tampil adalah data contoh untuk pratinjau; data resmi akan muncul otomatis saat endpoint dapat diakses. Periksa koneksi, CORS, dan struktur respons API sebelum penilaian.";
  }
  fillBrandFilter();
  renderCars();
}
searchInput.addEventListener("input", renderCars);
brandFilter.addEventListener("change", renderCars);
sortSelect.addEventListener("change", renderCars);
document.querySelector("#resetFilters").addEventListener("click", () => {
  searchInput.value = ""; brandFilter.value = ""; sortSelect.value = "default"; renderCars();
});
grid.addEventListener("click", event => {
  const card = event.target.closest("[data-car-id]");
  if (card) showCarDetail(card.dataset.carId);
});
grid.addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-car-id]")) {
    event.preventDefault(); showCarDetail(event.target.dataset.carId);
  }
});
document.querySelector("#dialogClose").addEventListener("click", () => carDialog.close());
carDialog.addEventListener("click", event => { if (event.target === carDialog) carDialog.close(); });
const menuToggle = document.querySelector("#menuToggle");
menuToggle.addEventListener("click", () => {
  const nav = document.querySelector(".desktop-nav");
  const open = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.textContent = open ? "×" : "☰";
});
document.querySelectorAll(".desktop-nav a").forEach(link => link.addEventListener("click", () => {
  document.querySelector(".desktop-nav").classList.remove("open");
  menuToggle.setAttribute("aria-expanded","false"); menuToggle.textContent = "☰";
}));
loadCars();
