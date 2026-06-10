import { useState, useRef, useEffect, useCallback } from "react";

const GREEN = "#4CAF50";
const GREEN_DARK = "#388E3C";
const GREEN_DIM = "#1B5E20";
const BG = "#0A0E14";
const BG2 = "#111720";
const BG3 = "#1A2232";
const BORDER = "#243045";
const TEXT = "#E8EDF5";
const TEXT2 = "#8A9BBB";
const TEXT3 = "#4A5878";
const RED = "#EF5350";
const AMBER = "#FFA726";
const BLUE = "#42A5F5";
const PURPLE = "#AB47BC";

const MOTORISTAS_INIT = [
  { id: "MOT001", nome: "João Silva", email: "joao@lhs.com.br" },
  { id: "MOT002", nome: "Maria Souza", email: "maria@lhs.com.br" },
  { id: "MOT003", nome: "Carlos Oliveira", email: "carlos@lhs.com.br" },
];
const VEICULOS_INIT = [
  { id: "VEI001", placa: "ABC-1234", modelo: "Volvo FH 460", tipo: "Caminhão" },
  { id: "VEI002", placa: "DEF-5678", modelo: "Mercedes Actros", tipo: "Caminhão" },
  { id: "VEI003", placa: "GHI-9012", modelo: "Sprinter 415", tipo: "Van" },
];
const ABASTECIMENTOS_INIT = [
  { id: "ABA001", dataHora: "2024-06-01T08:30:00.000Z", motoristaId: "MOT001", veiculoId: "VEI001", kmAtual: 52340, litros: 120.5, valorTotal: 856.35, obs: "", fotoHodometro: null, fotoBomba: null, status: "Aprovado", gps: { lat: -23.5505, lng: -46.6333, endereco: "Av. Paulista, 1000 — São Paulo, SP" } },
  { id: "ABA002", dataHora: "2024-06-03T14:15:00.000Z", motoristaId: "MOT002", veiculoId: "VEI002", kmAtual: 78650, litros: 95.0, valorTotal: 675.50, obs: "", fotoHodometro: null, fotoBomba: null, status: "Aprovado", gps: { lat: -23.5620, lng: -46.6550, endereco: "Rod. Anhanguera, km 15 — Osasco, SP" } },
  { id: "ABA003", dataHora: "2024-06-07T09:00:00.000Z", motoristaId: "MOT003", veiculoId: "VEI003", kmAtual: 33120, litros: 60.0, valorTotal: 426.00, obs: "", fotoHodometro: null, fotoBomba: null, status: "Pendente", gps: null },
  { id: "ABA004", dataHora: "2024-06-10T07:45:00.000Z", motoristaId: "MOT001", veiculoId: "VEI001", kmAtual: 52890, litros: 118.0, valorTotal: 839.00, obs: "", fotoHodometro: null, fotoBomba: null, status: "Aprovado", gps: { lat: -23.4890, lng: -46.7100, endereco: "Rod. Anhanguera, km 28 — Cajamar, SP" } },
];

const fmt = (n) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};
const getMes = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth()}`; };
const getMesAtual = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()}`; };

const S = {
  screen: { minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Inter', 'Roboto', sans-serif" },
  topbar: { display: "flex", alignItems: "center", gap: 12, padding: "16px 20px 12px", borderBottom: `1px solid ${BORDER}`, background: BG2 },
  card: { background: BG2, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 20px", marginBottom: 14 },
  input: { width: "100%", background: BG3, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "13px 16px", color: TEXT, fontSize: 15, outline: "none", boxSizing: "border-box" },
  label: { fontSize: 12, color: TEXT2, fontWeight: 600, letterSpacing: 0.5, marginBottom: 6, display: "block" },
  btnGreen: { width: "100%", background: GREEN, color: "#fff", border: "none", borderRadius: 12, padding: "16px", fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5 },
  badge: (color) => ({ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: color + "22", color, letterSpacing: 0.5 }),
};

const Topbar = ({ title, onBack, right }) => (
  <div style={S.topbar}>
    {onBack && <button onClick={onBack} style={{ background: "none", border: "none", color: TEXT2, cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 0 }}>‹</button>}
    <span style={{ flex: 1, fontSize: 17, fontWeight: 700, color: TEXT }}>{title}</span>
    {right}
  </div>
);

// ── GPS Hook ──────────────────────────────────────────────────────────────
function useGPS() {
  const [gps, setGps] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("idle"); // idle | loading | ok | error

  const capturar = useCallback(() => {
    if (!navigator.geolocation) { setGpsStatus("error"); return; }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let endereco = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const d = await r.json();
          if (d.display_name) {
            const parts = d.display_name.split(",");
            endereco = parts.slice(0, 3).join(",").trim();
          }
        } catch (_) {}
        setGps({ lat, lng, endereco });
        setGpsStatus("ok");
      },
      () => setGpsStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { gps, gpsStatus, capturar, setGps };
}

// ── GPS Card Component ────────────────────────────────────────────────────
const GPSCard = ({ gps, gpsStatus, onCapturar }) => {
  const mapUrl = gps ? `https://www.openstreetmap.org/export/embed.html?bbox=${gps.lng - 0.003},${gps.lat - 0.002},${gps.lng + 0.003},${gps.lat + 0.002}&layer=mapnik&marker=${gps.lat},${gps.lng}` : null;

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={S.label}>📍 LOCALIZAÇÃO GPS</label>
      {gpsStatus === "idle" && (
        <button onClick={onCapturar}
          style={{ ...S.card, width: "100%", border: `1.5px dashed ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "20px", cursor: "pointer", marginBottom: 0, borderRadius: 12 }}>
          <span style={{ fontSize: 26 }}>📍</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>Capturar localização</div>
            <div style={{ color: TEXT2, fontSize: 12, marginTop: 2 }}>Registra onde o caminhão abasteceu</div>
          </div>
        </button>
      )}
      {gpsStatus === "loading" && (
        <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 12, padding: "18px 20px" }}>
          <div style={{ width: 28, height: 28, border: `3px solid ${GREEN}33`, borderTopColor: GREEN, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div>
            <div style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>Localizando...</div>
            <div style={{ color: TEXT2, fontSize: 12 }}>Aguarde — buscando coordenadas GPS</div>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
      {gpsStatus === "error" && (
        <div style={{ ...S.card, border: `1px solid ${RED}44`, padding: "14px 18px" }}>
          <div style={{ color: RED, fontSize: 13, fontWeight: 600 }}>⚠️ GPS indisponível</div>
          <div style={{ color: TEXT2, fontSize: 12, marginTop: 4 }}>Permita o acesso à localização nas configurações do celular.</div>
          <button onClick={onCapturar} style={{ marginTop: 10, background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "7px 14px", color: TEXT2, fontSize: 12, cursor: "pointer" }}>Tentar novamente</button>
        </div>
      )}
      {gpsStatus === "ok" && gps && (
        <div style={{ ...S.card, padding: 0, overflow: "hidden", borderColor: GREEN + "66" }}>
          {/* Mini mapa via OpenStreetMap embed */}
          <iframe
            src={mapUrl}
            title="Mapa de localização"
            style={{ width: "100%", height: 160, border: "none", display: "block" }}
            loading="lazy"
          />
          <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ ...S.badge(GREEN) }}>✓ GPS capturado</span>
              </div>
              <div style={{ fontSize: 12, color: TEXT2 }}>{gps.endereco}</div>
              <div style={{ fontSize: 11, color: TEXT3, marginTop: 2 }}>{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</div>
            </div>
            <button onClick={onCapturar} style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 12px", color: TEXT2, fontSize: 11, cursor: "pointer" }}>↺ Atualizar</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── OCR Hodômetro via Anthropic API ───────────────────────────────────────
async function lerKMporIA(base64Image) {
  const imageData = base64Image.split(",")[1];
  const mediaType = base64Image.split(";")[0].split(":")[1] || "image/jpeg";
 
  const response = await fetch("/api/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageData, mediaType }),
  });
 
  const data = await response.json();
  const numero = parseInt(data.km, 10);
  return isNaN(numero) || numero === 0 ? null : numero;

// ── Foto Hodômetro com IA ─────────────────────────────────────────────────
const FotoHodometroIA = ({ preview, onCapture, onKmLido, kmLido }) => {
  const ref = useRef();
  const [status, setStatus] = useState("idle"); // idle | reading | ok | error

  const handleFile = async (file) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      onCapture(dataUrl);
      setStatus("reading");
      try {
        const km = await lerKMporIA(dataUrl);
        if (km) {
          onKmLido(km);
          setStatus("ok");
        } else {
          setStatus("error");
        }
      } catch (_) {
        setStatus("error");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ ...S.label, marginBottom: 0 }}>📸 FOTO DO HODÔMETRO</label>
        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: PURPLE + "22", color: PURPLE, fontWeight: 700 }}>✦ IA OCR</span>
      </div>
      <input ref={ref} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
        onChange={e => { const f = e.target.files[0]; if (f) handleFile(f); }} />
      {!preview ? (
        <button onClick={() => ref.current.click()}
          style={{ ...S.card, width: "100%", border: `1.5px dashed ${PURPLE}66`, display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", cursor: "pointer", marginBottom: 0, borderRadius: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: PURPLE + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📸</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>Fotografar hodômetro</div>
            <div style={{ color: TEXT2, fontSize: 12, marginTop: 2 }}>A IA lê o KM automaticamente</div>
          </div>
        </button>
      ) : (
        <div style={{ ...S.card, padding: 0, overflow: "hidden", border: `1px solid ${PURPLE}66`, marginBottom: 0 }}>
          <div style={{ position: "relative" }}>
            <img src={preview} alt="hodômetro" style={{ width: "100%", maxHeight: 170, objectFit: "cover", display: "block" }} />
            {status === "reading" && (
              <div style={{ position: "absolute", inset: 0, background: "#000a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, border: `3px solid ${PURPLE}44`, borderTopColor: PURPLE, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                <span style={{ color: PURPLE, fontSize: 13, fontWeight: 600 }}>Lendo KM com IA...</span>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}
            {status === "ok" && (
              <div style={{ position: "absolute", top: 10, right: 10, background: GREEN, borderRadius: 8, padding: "4px 12px", fontSize: 12, color: "#fff", fontWeight: 700 }}>✓ KM lido: {kmLido?.toLocaleString("pt-BR")}</div>
            )}
          </div>
          <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              {status === "ok" && <div style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>✦ KM preenchido automaticamente</div>}
              {status === "error" && <div style={{ fontSize: 12, color: AMBER }}>⚠️ Não leu — preencha o KM manualmente</div>}
              {status === "reading" && <div style={{ fontSize: 12, color: PURPLE }}>Processando imagem...</div>}
            </div>
            <button onClick={() => { onCapture(null); onKmLido(null); setStatus("idle"); }}
              style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "5px 12px", color: TEXT2, fontSize: 11, cursor: "pointer" }}>
              ✕ Refazer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Foto simples (bomba) ──────────────────────────────────────────────────
const PhotoBtn = ({ label, preview, onCapture }) => {
  const ref = useRef();
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={S.label}>{label}</label>
      <input ref={ref} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
        onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => onCapture(ev.target.result); r.readAsDataURL(f); } }} />
      {preview ? (
        <div style={{ position: "relative" }}>
          <img src={preview} alt="preview" style={{ width: "100%", borderRadius: 10, maxHeight: 160, objectFit: "cover", border: `2px solid ${GREEN}` }} />
          <button onClick={() => onCapture(null)} style={{ position: "absolute", top: 8, right: 8, background: RED, border: "none", borderRadius: 20, color: "#fff", fontSize: 12, padding: "4px 10px", cursor: "pointer" }}>✕ Refazer</button>
        </div>
      ) : (
        <button onClick={() => ref.current.click()}
          style={{ ...S.card, width: "100%", border: `1.5px dashed ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "20px", cursor: "pointer", marginBottom: 0, borderRadius: 12 }}>
          <span style={{ fontSize: 24 }}>📸</span>
          <span style={{ color: TEXT2, fontSize: 14 }}>Toque para fotografar</span>
        </button>
      )}
    </div>
  );
};

// ── Mini mapa estático para detalhes ─────────────────────────────────────
const MapaDetalhe = ({ gps }) => {
  if (!gps) return null;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${gps.lng - 0.004},${gps.lat - 0.003},${gps.lng + 0.004},${gps.lat + 0.003}&layer=mapnik&marker=${gps.lat},${gps.lng}`;
  return (
    <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
      <iframe src={mapUrl} title="Local do abastecimento" style={{ width: "100%", height: 200, border: "none", display: "block" }} loading="lazy" />
      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14 }}>📍</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Local do abastecimento</span>
          <span style={{ ...S.badge(GREEN), fontSize: 10 }}>GPS verificado</span>
        </div>
        <div style={{ fontSize: 12, color: TEXT2 }}>{gps.endereco}</div>
        <div style={{ fontSize: 11, color: TEXT3, marginTop: 3 }}>
          {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
          <a href={`https://www.google.com/maps?q=${gps.lat},${gps.lng}`} target="_blank" rel="noreferrer"
            style={{ color: BLUE, marginLeft: 10, textDecoration: "none" }}>↗ Abrir no Google Maps</a>
        </div>
      </div>
    </div>
  );
};

const BarChart = ({ data, color = GREEN }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, padding: "0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10, color: TEXT3 }}>{d.value > 0 ? (d.value >= 1000 ? (d.value / 1000).toFixed(1) + "k" : d.value.toFixed(0)) : ""}</span>
          <div style={{ width: "100%", height: Math.max((d.value / max) * 90, d.value > 0 ? 6 : 0), background: color, borderRadius: "4px 4px 0 0", transition: "height 0.4s" }} />
          <span style={{ fontSize: 10, color: TEXT2, textAlign: "center", lineHeight: 1.2 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════════════
const LoginScreen = ({ onLogin }) => {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = () => {
    setErr("");
    if (!user || !pass) { setErr("Preencha usuário e senha."); return; }
    setLoading(true);
    setTimeout(() => {
      if (pass === "admin" && user === "admin") onLogin({ role: "admin", nome: "Administrador", id: "ADMIN" });
      else if (pass === "123") {
        const m = MOTORISTAS_INIT.find(m => m.nome.toLowerCase().includes(user.toLowerCase()));
        if (m) onLogin({ role: "motorista", nome: m.nome, id: m.id });
        else { setErr("Usuário não encontrado."); setLoading(false); }
      } else { setErr("Usuário ou senha incorretos."); setLoading(false); }
    }, 800);
  };

  return (
    <div style={{ ...S.screen, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: `linear-gradient(135deg, ${GREEN_DIM}, ${GREEN})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: `0 0 36px ${GREEN}44` }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}>LHS</span>
          </div>
          <div style={{ fontSize: 10, color: TEXT2, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Segurança e Tecnologia</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: TEXT, margin: "0 0 4px" }}>LHS Controle de Abastecimento</h1>
          <p style={{ fontSize: 12, color: TEXT2, margin: 0 }}>Gestão de frota corporativa</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
            {[{icon:"📍",label:"GPS"},{icon:"🤖",label:"IA OCR"},{icon:"🔒",label:"Antifraude"}].map(f => (
              <span key={f.label} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: GREEN + "22", color: GREEN, fontWeight: 600 }}>{f.icon} {f.label}</span>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>USUÁRIO</label>
            <input style={S.input} placeholder="Digite seu usuário" value={user} onChange={e => setUser(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>SENHA</label>
            <input style={S.input} type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} />
          </div>
          {err && <div style={{ background: RED + "22", border: `1px solid ${RED}44`, borderRadius: 8, padding: "10px 14px", color: RED, fontSize: 13, marginBottom: 14 }}>{err}</div>}
          <button style={{ ...S.btnGreen, opacity: loading ? 0.7 : 1 }} onClick={handle} disabled={loading}>{loading ? "Autenticando..." : "ENTRAR"}</button>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: TEXT3, marginTop: 12 }}>Demo: admin/admin · joão/123 · maria/123</p>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
const DashboardScreen = ({ user, abastecimentos, veiculos, onNav, onLogout }) => {
  const lista = user.role === "admin" ? abastecimentos : abastecimentos.filter(a => a.motoristaId === user.id);
  const mesAtual = getMesAtual();
  const doMes = lista.filter(a => getMes(a.dataHora) === mesAtual);
  const totalLitros = lista.reduce((s, a) => s + a.litros, 0);
  const totalGasto = lista.reduce((s, a) => s + a.valorTotal, 0);
  const ultimo = [...lista].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))[0];
  const ultimoVei = ultimo ? veiculos.find(v => v.id === ultimo.veiculoId) : null;
  const comGPS = lista.filter(a => a.gps).length;
  const menu = [
    { icon: "⛽", label: "Novo Abastecimento", screen: "novo", color: GREEN },
    { icon: "📋", label: "Histórico", screen: "historico", color: BLUE },
    { icon: "🚛", label: "Veículos", screen: "veiculos", color: AMBER },
    { icon: "📊", label: "Relatórios", screen: "relatorios", color: PURPLE },
  ];

  return (
    <div style={S.screen}>
      <div style={{ background: BG2, borderBottom: `1px solid ${BORDER}`, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${GREEN_DIM}, ${GREEN})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>LHS</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Olá, {user.nome.split(" ")[0]} 👋</div>
              <div style={{ fontSize: 11, color: TEXT2 }}>{user.role === "admin" ? "Administrador" : "Motorista"}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 14px", color: TEXT2, fontSize: 12, cursor: "pointer" }}>Sair</button>
        </div>
      </div>

      <div style={{ padding: "20px 20px 100px" }}>
        {/* Destaques IA + GPS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, background: PURPLE + "15", border: `1px solid ${PURPLE}33`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: PURPLE }}>IA OCR Ativa</div>
              <div style={{ fontSize: 10, color: TEXT2 }}>Leitura auto de KM</div>
            </div>
          </div>
          <div style={{ flex: 1, background: GREEN + "15", border: `1px solid ${GREEN}33`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>📍</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>GPS Antifraude</div>
              <div style={{ fontSize: 10, color: TEXT2 }}>{comGPS} registros mapeados</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            { label: "LITROS TOTAL", value: fmt(totalLitros) + " L", color: GREEN, icon: "💧" },
            { label: "GASTO TOTAL", value: "R$ " + (totalGasto >= 1000 ? (totalGasto / 1000).toFixed(1) + "k" : fmt(totalGasto)), color: AMBER, icon: "💰" },
          ].map(s => (
            <div key={s.label} style={{ ...S.card, padding: "16px", marginBottom: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{s.icon}</div>
                <span style={{ fontSize: 11, color: TEXT2, fontWeight: 600 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {ultimo && (
          <div style={{ ...S.card, borderLeft: `3px solid ${GREEN}`, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: TEXT2, fontWeight: 600, marginBottom: 6 }}>ÚLTIMO ABASTECIMENTO</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{ultimoVei?.placa} — {ultimoVei?.modelo}</div>
            <div style={{ fontSize: 12, color: TEXT2, marginTop: 3 }}>{fmtDate(ultimo.dataHora)} · {fmt(ultimo.litros)} L · R$ {fmt(ultimo.valorTotal)}</div>
            {ultimo.gps && <div style={{ fontSize: 11, color: GREEN, marginTop: 4 }}>📍 {ultimo.gps.endereco}</div>}
          </div>
        )}

        <div style={{ fontSize: 12, color: TEXT2, fontWeight: 600, letterSpacing: 0.5, marginBottom: 12 }}>MENU PRINCIPAL</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {menu.map(item => (
            <button key={item.screen} onClick={() => onNav(item.screen)}
              style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 16px", cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.label}</div>
            </button>
          ))}
        </div>

        <div style={{ ...S.card, marginTop: 16, display: "flex", justifyContent: "space-around", padding: "14px 10px" }}>
          {[{ label: "Registros", value: lista.length }, { label: "Com GPS", value: comGPS }, { label: "Este mês", value: doMes.length }].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: GREEN }}>{s.value}</div>
              <div style={{ fontSize: 11, color: TEXT2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// NOVO ABASTECIMENTO — com GPS + IA OCR
// ══════════════════════════════════════════════════════════════════════════
const NovoAbastecimentoScreen = ({ user, motoristas, veiculos, abastecimentos, onSave, onBack }) => {
  const [form, setForm] = useState({
    motoristaId: user.role === "motorista" ? user.id : "",
    veiculoId: "", kmAtual: "", litros: "", valorTotal: "", obs: "",
    fotoHodometro: null, fotoBomba: null,
  });
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const { gps, gpsStatus, capturar: capturarGPS } = useGPS();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const valorLitro = form.litros && form.valorTotal ? (parseFloat(form.valorTotal) / parseFloat(form.litros)) : 0;

  // Capturar GPS automaticamente ao abrir a tela
  useEffect(() => { capturarGPS(); }, []);

  const validate = () => {
    const e = {};
    if (!form.veiculoId) e.veiculoId = "Obrigatório";
    if (!form.kmAtual || isNaN(form.kmAtual)) e.kmAtual = "KM inválido";
    if (!form.litros || parseFloat(form.litros) <= 0) e.litros = "Inválido";
    if (!form.valorTotal || parseFloat(form.valorTotal) <= 0) e.valorTotal = "Inválido";
    if (!form.fotoHodometro) e.fotoHodometro = "Foto obrigatória";
    if (!form.fotoBomba) e.fotoBomba = "Foto obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id: "ABA" + Date.now(),
      dataHora: new Date().toISOString(),
      motoristaId: form.motoristaId || user.id,
      veiculoId: form.veiculoId,
      kmAtual: parseFloat(form.kmAtual),
      litros: parseFloat(form.litros),
      valorTotal: parseFloat(form.valorTotal),
      obs: form.obs,
      fotoHodometro: form.fotoHodometro,
      fotoBomba: form.fotoBomba,
      status: "Pendente",
      gps: gps || null,
    });
    setSaved(true);
  };

  if (saved) return (
    <div style={{ ...S.screen, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: GREEN, marginBottom: 8 }}>Abastecimento Salvo!</h2>
      {gps && <div style={{ background: GREEN + "22", border: `1px solid ${GREEN}44`, borderRadius: 10, padding: "10px 18px", marginBottom: 12, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>📍 Localização registrada</div>
        <div style={{ fontSize: 11, color: TEXT2, marginTop: 2 }}>{gps.endereco}</div>
      </div>}
      <p style={{ color: TEXT2, textAlign: "center", marginBottom: 28 }}>Registro enviado. O gestor foi notificado.</p>
      <button style={S.btnGreen} onClick={onBack}>VOLTAR AO INÍCIO</button>
    </div>
  );

  const Err = ({ k }) => errors[k] ? <div style={{ fontSize: 11, color: RED, marginTop: 4 }}>{errors[k]}</div> : null;

  return (
    <div style={S.screen}>
      <Topbar title="Novo Abastecimento" onBack={onBack} />
      <div style={{ padding: "16px 20px 100px" }}>
        <div style={{ ...S.card, borderLeft: `3px solid ${GREEN}`, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
          <span style={{ fontSize: 16 }}>🕐</span>
          <div>
            <div style={{ fontSize: 10, color: TEXT2 }}>DATA E HORA AUTOMÁTICA</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>{fmtDate(new Date().toISOString())}</div>
          </div>
        </div>

        {/* GPS automático */}
        <GPSCard gps={gps} gpsStatus={gpsStatus} onCapturar={capturarGPS} />

        {user.role === "admin" && (
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>MOTORISTA *</label>
            <select style={{ ...S.input, appearance: "none" }} value={form.motoristaId} onChange={e => set("motoristaId", e.target.value)}>
              <option value="">Selecione...</option>
              {motoristas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>VEÍCULO *</label>
          <select style={{ ...S.input, appearance: "none" }} value={form.veiculoId} onChange={e => set("veiculoId", e.target.value)}>
            <option value="">Selecione o veículo...</option>
            {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
          </select>
          <Err k="veiculoId" />
        </div>

        {/* Hodômetro com IA OCR */}
        <FotoHodometroIA
          preview={form.fotoHodometro}
          onCapture={v => set("fotoHodometro", v)}
          onKmLido={km => { if (km) set("kmAtual", String(km)); }}
          kmLido={form.kmAtual ? parseInt(form.kmAtual) : null}
        />
        {errors.fotoHodometro && <div style={{ fontSize: 11, color: RED, marginTop: -10, marginBottom: 12 }}>{errors.fotoHodometro}</div>}

        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>KM ATUAL * <span style={{ color: PURPLE, fontSize: 10, fontWeight: 600 }}>(preenchido pela IA ou manual)</span></label>
          <input style={{ ...S.input, borderColor: form.kmAtual ? GREEN + "66" : BORDER }} type="number" placeholder="Ex: 52340" value={form.kmAtual} onChange={e => set("kmAtual", e.target.value)} inputMode="numeric" />
          <Err k="kmAtual" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={S.label}>LITROS *</label>
            <input style={S.input} type="number" placeholder="0.00" value={form.litros} onChange={e => set("litros", e.target.value)} inputMode="decimal" />
            <Err k="litros" />
          </div>
          <div>
            <label style={S.label}>VALOR TOTAL (R$) *</label>
            <input style={S.input} type="number" placeholder="0.00" value={form.valorTotal} onChange={e => set("valorTotal", e.target.value)} inputMode="decimal" />
            <Err k="valorTotal" />
          </div>
        </div>

        {valorLitro > 0 && (
          <div style={{ ...S.card, background: GREEN + "11", borderColor: GREEN + "44", marginBottom: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span>🧮</span>
            <span style={{ fontSize: 14, color: GREEN, fontWeight: 600 }}>R$ {fmt(valorLitro)} por litro</span>
          </div>
        )}

        <PhotoBtn label="📸 FOTO DA BOMBA *" preview={form.fotoBomba} onCapture={v => set("fotoBomba", v)} />
        {errors.fotoBomba && <div style={{ fontSize: 11, color: RED, marginTop: -10, marginBottom: 12 }}>{errors.fotoBomba}</div>}

        <div style={{ marginBottom: 24 }}>
          <label style={S.label}>OBSERVAÇÃO</label>
          <textarea style={{ ...S.input, minHeight: 72, resize: "vertical" }} placeholder="Opcional..." value={form.obs} onChange={e => set("obs", e.target.value)} />
        </div>

        {/* Resumo antifraude */}
        <div style={{ ...S.card, background: gps ? GREEN + "0d" : AMBER + "0d", borderColor: gps ? GREEN + "33" : AMBER + "33", marginBottom: 16, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, color: TEXT2, fontWeight: 600, marginBottom: 8 }}>CHECKLIST ANTIFRAUDE</div>
          {[
            { ok: !!gps, label: "Localização GPS capturada" },
            { ok: !!form.fotoHodometro, label: "Foto do hodômetro" },
            { ok: !!form.fotoBomba, label: "Foto da bomba de combustível" },
            { ok: !!form.kmAtual, label: "KM registrado" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14, color: item.ok ? GREEN : TEXT3 }}>{item.ok ? "✓" : "○"}</span>
              <span style={{ fontSize: 12, color: item.ok ? TEXT : TEXT2 }}>{item.label}</span>
            </div>
          ))}
        </div>

        <button style={S.btnGreen} onClick={handleSave}>⛽ SALVAR ABASTECIMENTO</button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// HISTÓRICO
// ══════════════════════════════════════════════════════════════════════════
const HistoricoScreen = ({ user, abastecimentos, motoristas, veiculos, onBack, onDetalhe }) => {
  const [busca, setBusca] = useState("");
  const [filtroGPS, setFiltroGPS] = useState(false);
  const lista = (user.role === "admin" ? abastecimentos : abastecimentos.filter(a => a.motoristaId === user.id))
    .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
  const filtrado = lista
    .filter(a => filtroGPS ? a.gps : true)
    .filter(a => {
      const v = veiculos.find(v => v.id === a.veiculoId);
      const m = motoristas.find(m => m.id === a.motoristaId);
      return (v?.placa + v?.modelo + m?.nome).toLowerCase().includes(busca.toLowerCase());
    });

  return (
    <div style={S.screen}>
      <Topbar title="Histórico" onBack={onBack} />
      <div style={{ padding: "16px 20px 100px" }}>
        <input style={{ ...S.input, marginBottom: 10 }} placeholder="🔍 Buscar por veículo ou motorista..." value={busca} onChange={e => setBusca(e.target.value)} />
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => setFiltroGPS(false)} style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: !filtroGPS ? GREEN : BG3, color: !filtroGPS ? "#fff" : TEXT2 }}>Todos</button>
          <button onClick={() => setFiltroGPS(true)} style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: filtroGPS ? GREEN : BG3, color: filtroGPS ? "#fff" : TEXT2 }}>📍 Com GPS</button>
        </div>
        {filtrado.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: TEXT3 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div>Nenhum registro encontrado</div>
          </div>
        )}
        {filtrado.map(a => {
          const v = veiculos.find(v => v.id === a.veiculoId);
          const m = motoristas.find(m => m.id === a.motoristaId);
          return (
            <button key={a.id} onClick={() => onDetalhe(a)} style={{ ...S.card, width: "100%", textAlign: "left", cursor: "pointer", display: "block" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{v?.placa} — {v?.modelo}</div>
                  <div style={{ fontSize: 11, color: TEXT2, marginTop: 2 }}>{m?.nome}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                  <span style={S.badge(a.status === "Aprovado" ? GREEN : AMBER)}>{a.status}</span>
                  {a.gps && <span style={{ fontSize: 10, color: GREEN }}>📍 GPS</span>}
                </div>
              </div>
              <div style={{ fontSize: 12, color: TEXT2, marginBottom: 5 }}>📅 {fmtDate(a.dataHora)}</div>
              <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
                <span style={{ color: GREEN, fontWeight: 600 }}>💧 {fmt(a.litros)} L</span>
                <span style={{ color: AMBER, fontWeight: 600 }}>💰 R$ {fmt(a.valorTotal)}</span>
                {a.gps && <span style={{ color: TEXT3, fontSize: 11 }}>📍 {a.gps.endereco.split(",")[0]}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// DETALHES — com mapa e fotos
// ══════════════════════════════════════════════════════════════════════════
const DetalhesScreen = ({ abastecimento, motoristas, veiculos, abastecimentos, onBack }) => {
  const [imgZoom, setImgZoom] = useState(null);
  const v = veiculos.find(v => v.id === abastecimento.veiculoId);
  const m = motoristas.find(m => m.id === abastecimento.motoristaId);
  const anterior = [...abastecimentos]
    .filter(a => a.veiculoId === abastecimento.veiculoId && new Date(a.dataHora) < new Date(abastecimento.dataHora))
    .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))[0];
  const consumo = anterior && abastecimento.litros > 0 ? (abastecimento.kmAtual - anterior.kmAtual) / abastecimento.litros : null;
  const vl = abastecimento.litros > 0 ? abastecimento.valorTotal / abastecimento.litros : 0;

  const Row = ({ label, value, color }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 13, color: TEXT2 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: color || TEXT }}>{value}</span>
    </div>
  );

  return (
    <div style={S.screen}>
      {imgZoom && (
        <div onClick={() => setImgZoom(null)} style={{ position: "fixed", inset: 0, background: "#000e", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={imgZoom} alt="zoom" style={{ maxWidth: "96vw", maxHeight: "90vh", borderRadius: 8 }} />
        </div>
      )}
      <Topbar title="Detalhes" onBack={onBack} />
      <div style={{ padding: "16px 20px 100px" }}>
        <div style={{ ...S.card, borderLeft: `3px solid ${GREEN}` }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 4 }}>{v?.placa} — {v?.modelo}</div>
          <div style={{ fontSize: 13, color: TEXT2 }}>Motorista: {m?.nome}</div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <span style={S.badge(abastecimento.status === "Aprovado" ? GREEN : AMBER)}>{abastecimento.status}</span>
            {abastecimento.gps && <span style={S.badge(GREEN)}>📍 GPS verificado</span>}
          </div>
        </div>

        {/* MAPA */}
        {abastecimento.gps && <MapaDetalhe gps={abastecimento.gps} />}

        <div style={S.card}>
          <div style={{ fontSize: 12, color: TEXT2, fontWeight: 600, marginBottom: 8 }}>DADOS DO ABASTECIMENTO</div>
          <Row label="Data e Hora" value={fmtDate(abastecimento.dataHora)} />
          <Row label="KM Atual" value={abastecimento.kmAtual.toLocaleString("pt-BR") + " km"} />
          <Row label="Litros Abastecidos" value={fmt(abastecimento.litros) + " L"} color={GREEN} />
          <Row label="Valor Total" value={"R$ " + fmt(abastecimento.valorTotal)} color={AMBER} />
          <Row label="Valor por Litro" value={"R$ " + fmt(vl)} />
          {consumo !== null && <Row label="Consumo Médio" value={fmt(consumo) + " km/L"} color={consumo < 2 ? RED : BLUE} />}
          {consumo !== null && consumo < 2 && (
            <div style={{ background: RED + "22", border: `1px solid ${RED}44`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: RED, marginTop: 8 }}>⚠️ Consumo abaixo do esperado — gestor notificado</div>
          )}
          {abastecimento.obs && <Row label="Observação" value={abastecimento.obs} />}
        </div>

        {/* Fotos ampliáveis */}
        {(abastecimento.fotoHodometro || abastecimento.fotoBomba) && (
          <div style={S.card}>
            <div style={{ fontSize: 12, color: TEXT2, fontWeight: 600, marginBottom: 12 }}>FOTOS REGISTRADAS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[{ label: "Hodômetro", foto: abastecimento.fotoHodometro }, { label: "Bomba", foto: abastecimento.fotoBomba }].map(f => (
                f.foto
                  ? <div key={f.label}>
                      <div style={{ fontSize: 11, color: TEXT2, marginBottom: 6 }}>{f.label}</div>
                      <img src={f.foto} alt={f.label} onClick={() => setImgZoom(f.foto)}
                        style={{ width: "100%", borderRadius: 8, objectFit: "cover", height: 110, border: `1px solid ${BORDER}`, cursor: "zoom-in" }} />
                    </div>
                  : <div key={f.label} style={{ background: BG3, borderRadius: 8, height: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, color: TEXT3 }}>Sem foto</span>
                    </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// VEÍCULOS
// ══════════════════════════════════════════════════════════════════════════
const VeiculosScreen = ({ veiculos, abastecimentos, onBack }) => (
  <div style={S.screen}>
    <Topbar title="Veículos" onBack={onBack} />
    <div style={{ padding: "16px 20px 100px" }}>
      {veiculos.map(v => {
        const abs = abastecimentos.filter(a => a.veiculoId === v.id);
        const ultimo = abs.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))[0];
        const comGPS = abs.filter(a => a.gps).length;
        return (
          <div key={v.id} style={S.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: AMBER + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🚛</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{v.placa}</div>
                <div style={{ fontSize: 12, color: TEXT2 }}>{v.modelo} · {v.tipo}</div>
              </div>
              <span style={{ marginLeft: "auto", ...S.badge(GREEN) }}>Ativo</span>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 12, borderTop: `1px solid ${BORDER}`, paddingTop: 10 }}>
              <span style={{ color: TEXT2 }}>📊 {abs.length} registros</span>
              <span style={{ color: GREEN }}>📍 {comGPS} com GPS</span>
              {ultimo && <span style={{ color: TEXT3 }}>🕐 {new Date(ultimo.dataHora).toLocaleDateString("pt-BR")}</span>}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════
// RELATÓRIOS
// ══════════════════════════════════════════════════════════════════════════
const RelatoriosScreen = ({ user, abastecimentos, veiculos, motoristas, onBack }) => {
  const [filtro, setFiltro] = useState("mes");
  const agora = new Date();
  const filtrar = (a) => {
    const d = new Date(a.dataHora);
    if (filtro === "hoje") return d.toDateString() === agora.toDateString();
    if (filtro === "semana") return (agora - d) <= 7 * 86400000;
    if (filtro === "mes") return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
    return d.getFullYear() === agora.getFullYear();
  };
  const lista = (user.role === "admin" ? abastecimentos : abastecimentos.filter(a => a.motoristaId === user.id)).filter(filtrar);
  const totalLitros = lista.reduce((s, a) => s + a.litros, 0);
  const totalGasto = lista.reduce((s, a) => s + a.valorTotal, 0);
  const comGPS = lista.filter(a => a.gps).length;
  const porVeiculo = veiculos.map(v => ({
    label: v.placa,
    litros: lista.filter(a => a.veiculoId === v.id).reduce((s, a) => s + a.litros, 0),
    gasto: lista.filter(a => a.veiculoId === v.id).reduce((s, a) => s + a.valorTotal, 0),
  })).filter(v => v.litros > 0);

  return (
    <div style={S.screen}>
      <Topbar title="Relatórios" onBack={onBack} />
      <div style={{ padding: "16px 20px 100px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 18, overflowX: "auto", paddingBottom: 4 }}>
          {[{ key: "hoje", label: "Hoje" }, { key: "semana", label: "Semana" }, { key: "mes", label: "Mês" }, { key: "ano", label: "Ano" }].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)} style={{ padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", background: filtro === f.key ? GREEN : BG3, color: filtro === f.key ? "#fff" : TEXT2 }}>{f.label}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Litros", value: totalLitros.toFixed(0) + "L", color: GREEN },
            { label: "Gasto", value: "R$" + (totalGasto >= 1000 ? (totalGasto / 1000).toFixed(1) + "k" : totalGasto.toFixed(0)), color: AMBER },
            { label: "GPS verify", value: comGPS + "/" + lista.length, color: GREEN },
          ].map(s => (
            <div key={s.label} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: TEXT2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {porVeiculo.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: TEXT3 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <div>Sem dados para o período</div>
          </div>
        ) : (
          <>
            <div style={S.card}>
              <div style={{ fontSize: 12, color: TEXT2, fontWeight: 600, marginBottom: 14 }}>LITROS POR VEÍCULO</div>
              <BarChart data={porVeiculo.map(v => ({ label: v.label, value: v.litros }))} color={GREEN} />
            </div>
            <div style={S.card}>
              <div style={{ fontSize: 12, color: TEXT2, fontWeight: 600, marginBottom: 14 }}>GASTO POR VEÍCULO (R$)</div>
              <BarChart data={porVeiculo.map(v => ({ label: v.label, value: v.gasto }))} color={AMBER} />
            </div>
            <div style={S.card}>
              <div style={{ fontSize: 12, color: TEXT2, fontWeight: 600, marginBottom: 12 }}>DETALHAMENTO</div>
              {porVeiculo.map((v, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < porVeiculo.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <span style={{ fontSize: 13, color: TEXT }}>{v.label}</span>
                  <div style={{ display: "flex", gap: 14 }}>
                    <span style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>{v.litros.toFixed(0)}L</span>
                    <span style={{ fontSize: 13, color: AMBER, fontWeight: 600 }}>R${v.gasto.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
            {user.role === "admin" && (
              <button style={{ ...S.btnGreen, background: BG3, color: GREEN, border: `1px solid ${GREEN}44` }}>📥 Exportar Excel / PDF</button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("dashboard");
  const [detalheItem, setDetalheItem] = useState(null);
  const [abastecimentos, setAbastecimentos] = useState(ABASTECIMENTOS_INIT);
  const motoristas = MOTORISTAS_INIT;
  const veiculos = VEICULOS_INIT;

  const handleLogin = (u) => { setUser(u); setScreen("dashboard"); };
  const handleLogout = () => { setUser(null); setScreen("dashboard"); };
  const handleSave = (novo) => { setAbastecimentos(prev => [...prev, novo]); };
  const nav = (s) => setScreen(s);

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  if (screen === "detalhe" && detalheItem) return (
    <DetalhesScreen abastecimento={detalheItem} motoristas={motoristas} veiculos={veiculos} abastecimentos={abastecimentos} onBack={() => setScreen("historico")} />
  );

  const screens = {
    dashboard: <DashboardScreen user={user} abastecimentos={abastecimentos} veiculos={veiculos} onNav={nav} onLogout={handleLogout} />,
    novo: <NovoAbastecimentoScreen user={user} motoristas={motoristas} veiculos={veiculos} abastecimentos={abastecimentos} onSave={handleSave} onBack={() => nav("dashboard")} />,
    historico: <HistoricoScreen user={user} abastecimentos={abastecimentos} motoristas={motoristas} veiculos={veiculos} onBack={() => nav("dashboard")} onDetalhe={a => { setDetalheItem(a); setScreen("detalhe"); }} />,
    veiculos: <VeiculosScreen veiculos={veiculos} abastecimentos={abastecimentos} onBack={() => nav("dashboard")} />,
    relatorios: <RelatoriosScreen user={user} abastecimentos={abastecimentos} veiculos={veiculos} motoristas={motoristas} onBack={() => nav("dashboard")} />,
  };

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", position: "relative" }}>
      {screens[screen] || screens.dashboard}
      {["dashboard", "historico", "veiculos", "relatorios"].includes(screen) && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: BG2, borderTop: `1px solid ${BORDER}`, display: "flex", zIndex: 50 }}>
          {[
            { s: "dashboard", icon: "🏠", label: "Início" },
            { s: "novo", icon: "⛽", label: "Abastecer", highlight: true },
            { s: "historico", icon: "📋", label: "Histórico" },
            { s: "relatorios", icon: "📊", label: "Relatórios" },
          ].map(item => (
            <button key={item.s} onClick={() => nav(item.s)}
              style={{ flex: 1, background: item.highlight ? GREEN : "none", border: "none", padding: "12px 6px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 10, color: item.highlight ? "#fff" : (screen === item.s ? GREEN : TEXT3), fontWeight: item.highlight || screen === item.s ? 700 : 400 }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
