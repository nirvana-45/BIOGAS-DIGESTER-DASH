import React, { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import {
  Flame,
  Gauge,
  Droplets,
  Wind,
  AlertTriangle,
  Activity,
  Zap,
  CircleDot,
  Radio,
  ShieldCheck,
  HeartPulse,
  ChevronRight,
  Settings2,
  Ruler,
  Loader2,
  CheckCircle2,
  ArrowRight,
  AlertOctagon,
  Download,
  History,
  Power,
  Utensils,
  TrendingUp,
  Wrench,
  Stethoscope,
  Plus,
  Trash2,
  Wifi,
  WifiOff,
  Clock,
  PauseCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Palette / tokens
// ---------------------------------------------------------------------------
const C = {
  bg: "#101B16",
  panel: "#17241D",
  panelAlt: "#1D2C23",
  line: "#2B3D32",
  lineSoft: "#213028",
  text: "#EEF1EA",
  textDim: "#93A599",
  textFaint: "#5E7167",
  amber: "#E3A23C",
  amberSoft: "rgba(227,162,60,0.14)",
  green: "#79C06C",
  greenSoft: "rgba(121,192,108,0.14)",
  red: "#D96257",
  redSoft: "rgba(217,98,87,0.16)",
};

const monoFont =
  "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const sansFont =
  "'Inter', 'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, sans-serif";

// ---------------------------------------------------------------------------
// Sensor definitions — sourced from the biogas system research doc
// ---------------------------------------------------------------------------
const SENSORS = [
  {
    id: "temp",
    label: "Slurry Temperature",
    short: "Temp",
    unit: "°C",
    category: "process",
    idealMin: 35,
    idealMax: 38,
    hazardLow: 20,
    hazardHigh: null,
    baseline: 36.5,
    noise: 0.25,
    revert: 0.15,
    icon: Flame,
    hardware: "DS18B20 digital waterproof probe",
    note: "Fluctuation >2°C/day or a drop below 20°C signals digester stress.",
  },
  {
    id: "pressure",
    label: "System Gas Pressure",
    short: "Pressure",
    unit: "mbar",
    category: "gas",
    idealMin: 10,
    idealMax: 50,
    hazardLow: 0,
    hazardHigh: 60,
    baseline: 28,
    noise: 2.2,
    revert: 0.2,
    icon: Gauge,
    hardware: "HX710B / MPX5010DP transducer",
    note: "Drops to 0 mbar suggest a leak; spikes above 60 mbar risk the seal.",
  },
  {
    id: "ph",
    label: "Slurry pH",
    short: "pH",
    unit: "pH",
    category: "process",
    idealMin: 6.8,
    idealMax: 7.8,
    hazardLow: 6.5,
    hazardHigh: 8.2,
    baseline: 7.3,
    noise: 0.05,
    revert: 0.1,
    icon: Droplets,
    hardware: "Analog BNC glass pH electrode",
    note: "Below 6.5 is acidification risk; above 8.2 disrupts methanogens.",
  },
  {
    id: "ch4",
    label: "Methane Concentration",
    short: "CH₄",
    unit: "%",
    category: "gas",
    idealMin: 55,
    idealMax: 70,
    hazardLow: 50,
    hazardHigh: null,
    baseline: 62,
    noise: 1.4,
    revert: 0.15,
    icon: Flame,
    hardware: "MH-Z19 / NDIR sensor or MQ-4",
    note: "Below 50% points to weak energy output or digester failure.",
  },
  {
    id: "co2",
    label: "Carbon Dioxide Concentration",
    short: "CO₂",
    unit: "%",
    category: "gas",
    idealMin: 30,
    idealMax: 40,
    hazardLow: null,
    hazardHigh: 45,
    baseline: 35,
    noise: 1.2,
    revert: 0.15,
    icon: Wind,
    hardware: "SCD30 or MH-Z19B NDIR sensor",
    note: "Above 45% indicates incomplete digestion.",
  },
  {
    id: "h2s",
    label: "Hydrogen Sulfide Concentration",
    short: "H₂S",
    unit: "ppm",
    category: "safety",
    idealMin: 0,
    idealMax: 200,
    hazardLow: null,
    hazardHigh: 500,
    baseline: 90,
    noise: 12,
    revert: 0.2,
    icon: AlertTriangle,
    hardware: "ZE03-H2S module or MQ-136",
    note: "Above 500 ppm is a severe corrosion and toxicity hazard.",
  },
  {
    id: "leak",
    label: "Ambient Gas Leak (CH₄)",
    short: "Leak",
    unit: "% LEL",
    category: "safety",
    idealMin: 0,
    idealMax: 0,
    hazardLow: null,
    hazardHigh: 10,
    baseline: 0.3,
    noise: 0.15,
    revert: 0.4,
    icon: AlertTriangle,
    hardware: "MQ-2 or MQ-5 gas sensor",
    note: "Above 10% LEL is explosion risk near appliances — evacuate and vent.",
  },
  {
    id: "ec",
    label: "Digestate Electrical Conductivity",
    short: "EC",
    unit: "mS/cm",
    category: "process",
    idealMin: 2.0,
    idealMax: 6.0,
    hazardLow: null,
    hazardHigh: 10.0,
    baseline: 4.0,
    noise: 0.2,
    revert: 0.12,
    icon: Zap,
    hardware: "Analog BNC EC probe module",
    note: "Above 10 mS/cm risks salt burn if digestate is applied to soil.",
  },
  {
    id: "flow",
    label: "Gas Flow Rate / Volume",
    short: "Flow",
    unit: "m³/day",
    category: "gas",
    idealMin: 6,
    idealMax: 10,
    hazardLow: 1,
    hazardHigh: null,
    baseline: 8,
    noise: 0.5,
    revert: 0.12,
    icon: Activity,
    hardware: "Pulse-output diaphragm gas meter",
    note: "A sudden drop to 0 or an unexplained sustained spike both need review.",
  },
  {
    id: "o2",
    label: "Oxygen Concentration in Gas",
    short: "O₂",
    unit: "%",
    category: "safety",
    idealMin: 0,
    idealMax: 0.5,
    hazardLow: null,
    hazardHigh: 1.0,
    baseline: 0.25,
    noise: 0.06,
    revert: 0.25,
    icon: Wind,
    hardware: "Electrochemical O₂ module (ME2-O2)",
    note: "Above 1.0% suggests air ingress — explosive risk and can kill methanogens.",
  },
  {
    id: "orp",
    label: "Oxidation-Reduction Potential",
    short: "ORP",
    unit: "mV",
    category: "process",
    idealMin: -400,
    idealMax: -300,
    hazardLow: null,
    hazardHigh: -200,
    baseline: -350,
    noise: 6,
    revert: 0.15,
    icon: CircleDot,
    hardware: "Industrial ORP probe with BNC module",
    note: "Rising above -200 mV means an oxidizing environment that halts methanogens.",
  },
];

const CATEGORIES = [
  { id: "safety", label: "Safety", icon: ShieldCheck, color: C.red },
  { id: "process", label: "Process health", icon: HeartPulse, color: C.green },
  { id: "gas", label: "Gas composition & output", icon: Flame, color: C.amber },
];

const HISTORY_LEN = 36;

// ---------------------------------------------------------------------------
// Feeding log
// ---------------------------------------------------------------------------
const FEED_TYPES = ["Cow manure", "Chicken litter", "Food waste", "Crop residue", "Mixed slurry", "Other"];
const QUALITY_FLAGS = [
  { id: "good", label: "Good ratio", color: C.green },
  { id: "overfed", label: "Overfed", color: C.red },
  { id: "underfed", label: "Underfed", color: C.amber },
];

// ---------------------------------------------------------------------------
// Maintenance log — the failure modes sensors don't catch (desludging, seals,
// PPE) get their own recommended-interval tracking, same as a sensor hazard.
// ---------------------------------------------------------------------------
const MAINTENANCE_TASKS = [
  { id: "desludging", label: "Desludging", intervalDays: 180, note: "Removing accumulated sludge restores working volume and prevents outlet blockages." },
  { id: "seal", label: "Seal / gasket check", intervalDays: 30, note: "Worn seals are a common source of the small leaks ambient sensors catch late." },
  { id: "ppe", label: "PPE check", intervalDays: 14, note: "Gas masks, gloves and gauges in working order before anyone opens the system." },
  { id: "prv", label: "Pressure relief valve check", intervalDays: 90, note: "A stuck PRV turns a normal pressure spike into a real hazard." },
  { id: "inspection", label: "General inspection", intervalDays: 30, note: "Visual check of pipework, digester structure and surrounding area." },
];
const MAINTENANCE_STATUS_COLOR = { ok: C.green, due: C.amber, overdue: C.red };
const MAINTENANCE_STATUS_LABEL = { ok: "OK", due: "Due soon", overdue: "Overdue" };

// ---------------------------------------------------------------------------
// Simulation helpers
// ---------------------------------------------------------------------------
function nextValue(def, prev) {
  const mid = (def.idealMin + def.idealMax) / 2 || def.baseline;
  const pull = (mid - prev) * def.revert;
  const jitter = (Math.random() - 0.5) * 2 * def.noise;
  let v = prev + pull + jitter;
  // rare small excursion so hazard states are visible in a demo
  if (Math.random() < 0.015) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    v += dir * def.noise * 8;
  }
  return Math.round(v * 100) / 100;
}

function statusOf(def, v) {
  if (def.hazardHigh != null && v >= def.hazardHigh) return "critical";
  if (def.hazardLow != null && v <= def.hazardLow) return "critical";
  if (def.idealMax != null && v > def.idealMax) return "warning";
  if (def.idealMin != null && v < def.idealMin) return "warning";
  return "normal";
}

const STATUS_COLOR = { normal: C.green, warning: C.amber, critical: C.red };
const STATUS_LABEL = { normal: "Normal", warning: "Watch", critical: "Alert" };
const RANK = { normal: 0, warning: 1, critical: 2 };

function initHistory(def) {
  const arr = [];
  let v = def.baseline;
  for (let i = 0; i < HISTORY_LEN; i++) {
    v = nextValue(def, v);
    arr.push({ t: i, v });
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Daily rollups for the History / Trends tab. Generated once per sensor to
// stand in for what would otherwise be months of real logged readings —
// each day simulates 24 hourly samples and keeps their avg/min/max.
// ---------------------------------------------------------------------------
const ROLLUP_DAYS = 180;

function genDailyRollup(def) {
  const days = [];
  let v = def.baseline;
  const now = Date.now();
  for (let d = ROLLUP_DAYS - 1; d >= 0; d--) {
    let dayMin = Infinity;
    let dayMax = -Infinity;
    let sum = 0;
    for (let h = 0; h < 24; h++) {
      v = nextValue(def, v);
      dayMin = Math.min(dayMin, v);
      dayMax = Math.max(dayMax, v);
      sum += v;
    }
    days.push({
      date: now - d * 86400000,
      avg: round2(sum / 24),
      min: round2(dayMin),
      max: round2(dayMax),
    });
  }
  return days;
}

function aggregateRollup(daily, bucketDays) {
  const buckets = [];
  for (let i = 0; i < daily.length; i += bucketDays) {
    const slice = daily.slice(i, i + bucketDays);
    if (slice.length === 0) continue;
    const avg = round2(slice.reduce((a, d) => a + d.avg, 0) / slice.length);
    const min = round2(Math.min(...slice.map((d) => d.min)));
    const max = round2(Math.max(...slice.map((d) => d.max)));
    buckets.push({ date: slice[slice.length - 1].date, startDate: slice[0].date, avg, min, max });
  }
  return buckets;
}

function fmtShortDate(ms) {
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// % → estimated volume conversion (uses the gas storage / headspace volume
// entered on the calibration page: volume = headspace × (percent / 100))
// ---------------------------------------------------------------------------
function round2(n) {
  return Math.round(n * 100) / 100;
}

function canShowAsVolume(def) {
  return def.unit === "%";
}

function toVolumeDef(def, headspaceVolume) {
  const scale = headspaceVolume / 100;
  return {
    ...def,
    unit: "m³",
    label: def.label.replace(/Concentration( in Gas)?/, "Volume"),
    idealMin: def.idealMin != null ? round2(def.idealMin * scale) : def.idealMin,
    idealMax: def.idealMax != null ? round2(def.idealMax * scale) : def.idealMax,
    hazardLow: def.hazardLow != null ? round2(def.hazardLow * scale) : def.hazardLow,
    hazardHigh: def.hazardHigh != null ? round2(def.hazardHigh * scale) : def.hazardHigh,
    note: `${def.note} Estimated from a ${headspaceVolume} m³ gas storage volume.`,
  };
}

function scaleHistory(history, headspaceVolume) {
  const scale = headspaceVolume / 100;
  return history.map((p) => ({ t: p.t, v: round2(p.v * scale) }));
}

// ---------------------------------------------------------------------------
// CSV export of the current in-memory reading history
// ---------------------------------------------------------------------------
function historiesToCSV(histories, calibration) {
  const cols = SENSORS.filter((s) => isSensorEnabled(s, calibration));
  const header = ["tick", ...cols.map((s) => `${s.short} (${s.unit})`)];
  const rows = [header.join(",")];
  for (let i = 0; i < HISTORY_LEN; i++) {
    const tick = histories[cols[0]?.id]?.[i]?.t ?? i;
    const row = [tick, ...cols.map((s) => histories[s.id][i]?.v ?? "")];
    rows.push(row.join(","));
  }
  return rows.join("\n");
}

function downloadCSV(histories, siteName, calibration) {
  const csv = historiesToCSV(histories, calibration);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(siteName || "digester").trim().replace(/\s+/g, "_").toLowerCase()}_readings_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Refresh interval options for the calibration page
// ---------------------------------------------------------------------------

const REFRESH_OPTIONS = [
  { id: 1000, label: "Fast (1s)" },
  { id: 1800, label: "Normal (1.8s)" },
  { id: 3000, label: "Slow (3s)" },
  { id: 5000, label: "Very slow (5s)" },
];
const DEFAULT_TICK_MS = 1800;

function isSensorEnabled(def, calibration) {
  if (!calibration?.enabledSensors) return true;
  return calibration.enabledSensors.includes(def.id);
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
function StatusDot({ status }) {
  return (
    <span
      className="inline-block rounded-full"
      style={{
        width: 8,
        height: 8,
        background: STATUS_COLOR[status],
        boxShadow: status !== "normal" ? `0 0 8px ${STATUS_COLOR[status]}` : "none",
      }}
    />
  );
}

function Sparkline({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height={44}>
      <LineChart data={data} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function SensorCard({ def, history, selected, onSelect }) {
  const latest = history[history.length - 1]?.v ?? def.baseline;
  const status = statusOf(def, latest);
  const Icon = def.icon;
  return (
    <button
      onClick={() => onSelect(def.id)}
      className="text-left rounded-lg p-4 transition-colors"
      style={{
        background: selected ? C.panelAlt : C.panel,
        border: `1px solid ${selected ? C.textFaint : status === "normal" ? C.line : STATUS_COLOR[status]}`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={15} color={C.textDim} strokeWidth={1.75} />
          <span className="text-xs" style={{ color: C.textDim, fontFamily: sansFont }}>
            {def.label}
          </span>
        </div>
        <StatusDot status={status} />
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-2xl" style={{ color: C.text, fontFamily: monoFont, fontWeight: 500 }}>
          {latest}
        </span>
        <span className="text-xs" style={{ color: C.textFaint, fontFamily: monoFont }}>
          {def.unit}
        </span>
      </div>
      <Sparkline data={history} color={STATUS_COLOR[status]} />
      <div className="text-[11px] mt-1" style={{ color: C.textFaint, fontFamily: sansFont }}>
        target {def.idealMin === def.idealMax ? def.idealMin : `${def.idealMin}–${def.idealMax}`} {def.unit}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Overview tab — overall system health only, no per-sensor cards
// ---------------------------------------------------------------------------
function categoryStatus(catId, histories, calibration) {
  const sensors = SENSORS.filter((s) => s.category === catId && isSensorEnabled(s, calibration));
  let worst = "normal";
  const counts = { normal: 0, warning: 0, critical: 0 };
  sensors.forEach((def) => {
    const h = histories[def.id];
    const latest = h[h.length - 1]?.v ?? def.baseline;
    const status = statusOf(def, latest);
    counts[status] += 1;
    if (RANK[status] > RANK[worst]) worst = status;
  });
  return { worst, counts, total: sensors.length };
}

const EVENT_STYLE = {
  critical: { color: C.red, icon: AlertTriangle },
  warning: { color: C.amber, icon: AlertTriangle },
  info: { color: C.textDim, icon: CheckCircle2 },
  shutoff: { color: C.red, icon: AlertOctagon },
};

function OverviewTab({ histories, onJump, events, calibration, onAcknowledge }) {
  const catSummaries = CATEGORIES.map((cat) => ({
    ...cat,
    ...categoryStatus(cat.id, histories, calibration),
  }));
  const overall = catSummaries.reduce(
    (acc, c) => (c.total > 0 && RANK[c.worst] > RANK[acc] ? c.worst : acc),
    "normal"
  );
  const attention = SENSORS.filter((def) => isSensorEnabled(def, calibration))
    .map((def) => {
      const h = histories[def.id];
      const latest = h[h.length - 1]?.v ?? def.baseline;
      return { def, latest, status: statusOf(def, latest) };
    })
    .filter((s) => s.status !== "normal");

  const overallCopy = {
    normal: "All monitored systems are within target range.",
    warning: "One or more readings have drifted outside their ideal range.",
    critical: "A hazard threshold has been crossed — check the flagged sensor now.",
  };

  return (
    <div className="space-y-6">
      {/* big overall status */}
      <div
        className="rounded-lg p-6 flex items-center justify-between"
        style={{ background: C.panel, border: `1px solid ${overall === "normal" ? C.line : STATUS_COLOR[overall]}` }}
      >
        <div className="flex items-center gap-4">
          <span
            className="inline-flex items-center justify-center rounded-full shrink-0"
            style={{
              width: 46,
              height: 46,
              background: overall === "normal" ? C.greenSoft : overall === "warning" ? C.amberSoft : C.redSoft,
            }}
          >
            <span className="inline-block rounded-full" style={{ width: 14, height: 14, background: STATUS_COLOR[overall] }} />
          </span>
          <div>
            <div className="text-xs mb-1" style={{ color: C.textFaint, fontFamily: sansFont }}>
              System status
            </div>
            <div className="text-xl" style={{ color: C.text, fontFamily: sansFont, fontWeight: 500 }}>
              {STATUS_LABEL[overall] === "Normal" ? "Healthy" : STATUS_LABEL[overall] === "Watch" ? "Needs attention" : "Alert"}
            </div>
          </div>
        </div>
        <div className="text-right max-w-xs">
          <p className="text-xs" style={{ color: C.textDim, fontFamily: sansFont }}>
            {overallCopy[overall]}
          </p>
        </div>
      </div>

      {/* category summaries */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {catSummaries.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => onJump(cat.id)}
              className="text-left rounded-lg p-5 transition-colors"
              style={{ background: C.panel, border: `1px solid ${cat.total === 0 || cat.worst === "normal" ? C.line : STATUS_COLOR[cat.worst]}` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon size={16} color={cat.color} strokeWidth={1.75} />
                  <span className="text-sm" style={{ color: C.text, fontFamily: sansFont, fontWeight: 500 }}>
                    {cat.label}
                  </span>
                </div>
                <ChevronRight size={15} color={C.textFaint} />
              </div>
              {cat.total === 0 ? (
                <div className="text-xs" style={{ color: C.textFaint, fontFamily: sansFont }}>
                  No sensors enabled
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusDot status={cat.worst} />
                    <span className="text-xs" style={{ color: STATUS_COLOR[cat.worst], fontFamily: sansFont }}>
                      {STATUS_LABEL[cat.worst]}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: C.textFaint, fontFamily: monoFont }}>
                    {cat.counts.normal}/{cat.total} sensors normal
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* needs attention list */}
      <div className="rounded-lg p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="text-xs mb-3" style={{ color: C.textFaint, fontFamily: sansFont }}>
          Needs attention
        </div>
        {attention.length === 0 ? (
          <p className="text-sm" style={{ color: C.textDim, fontFamily: sansFont }}>
            Nothing flagged right now — every sensor is inside its target range.
          </p>
        ) : (
          <div className="space-y-2">
            {attention.map(({ def, latest, status }) => (
              <button
                key={def.id}
                onClick={() => onJump(def.category, def.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors"
                style={{ background: C.panelAlt }}
              >
                <div className="flex items-center gap-2.5">
                  <StatusDot status={status} />
                  <span className="text-sm" style={{ color: C.text, fontFamily: sansFont }}>
                    {def.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ color: STATUS_COLOR[status], fontFamily: monoFont, fontSize: 13 }}>
                    {latest} {def.unit}
                  </span>
                  <ChevronRight size={14} color={C.textFaint} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* alert history with acknowledgment */}
      <div className="rounded-lg p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History size={13} color={C.textFaint} />
            <span className="text-xs" style={{ color: C.textFaint, fontFamily: sansFont }}>
              Alert history
            </span>
          </div>
          {events.length > 0 && (
            <span className="text-[11px]" style={{ color: C.textFaint, fontFamily: monoFont }}>
              {events.filter((e) => !e.acknowledged).length} unacknowledged
            </span>
          )}
        </div>
        {events.length === 0 ? (
          <p className="text-sm" style={{ color: C.textDim, fontFamily: sansFont }}>
            No events logged yet this session.
          </p>
        ) : (
          <div className="space-y-2" style={{ maxHeight: 320, overflowY: "auto" }}>
            {events.slice(0, 20).map((e) => (
              <EventRow key={e.id} event={e} onAcknowledge={onAcknowledge} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventRow({ event: e, onAcknowledge }) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const style = EVENT_STYLE[e.type] || EVENT_STYLE.info;
  const Icon = style.icon;

  return (
    <div className="rounded-md px-3 py-2" style={{ background: C.panelAlt, opacity: e.acknowledged ? 0.65 : 1 }}>
      <div className="flex items-start gap-2.5">
        <Icon size={13} color={style.color} style={{ marginTop: 2 }} />
        <div className="flex-1">
          <div className="text-xs" style={{ color: C.textDim, fontFamily: sansFont }}>
            {e.message}
          </div>
          {e.acknowledged && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px]" style={{ color: C.green, fontFamily: sansFont }}>
              <CheckCircle2 size={11} />
              Acknowledged{e.note ? `: ${e.note}` : ""}
            </div>
          )}
        </div>
        <span className="text-[11px] shrink-0" style={{ color: C.textFaint, fontFamily: monoFont }}>
          {new Date(e.time).toLocaleTimeString()}
        </span>
      </div>

      {!e.acknowledged && !editing && (
        <button
          onClick={() => setEditing(true)}
          className="text-[11px] mt-1.5 ml-[22px]"
          style={{ color: C.amber, fontFamily: sansFont }}
        >
          Acknowledge
        </button>
      )}

      {!e.acknowledged && editing && (
        <div className="flex items-center gap-2 mt-2 ml-[22px]">
          <input
            autoFocus
            value={note}
            onChange={(ev) => setNote(ev.target.value)}
            placeholder="Optional note, e.g. checked, was a feeding gap"
            className="flex-1"
            style={{ ...smallInputStyle, padding: "6px 9px", fontFamily: sansFont, fontSize: 12 }}
          />
          <button
            onClick={() => {
              onAcknowledge(e.id, note.trim());
              setEditing(false);
            }}
            className="text-[11px] px-2.5 py-1.5 rounded-md"
            style={{ background: C.amber, color: C.bg, fontFamily: sansFont, fontWeight: 500 }}
          >
            Save
          </button>
          <button onClick={() => setEditing(false)} className="text-[11px]" style={{ color: C.textFaint, fontFamily: sansFont }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category tab — card grid for that group + detail chart for the selection
// ---------------------------------------------------------------------------
function CategoryTab({ catId, selected, setSelected, histories, calibration }) {
  const sensors = SENSORS.filter((s) => s.category === catId && isSensorEnabled(s, calibration));

  const hasVolumeToggle = catId === "gas" && sensors.some(canShowAsVolume);
  const [unitMode, setUnitMode] = useState("percent");
  const headspaceVolume = calibration?.headspaceVolume;
  const useVolume = hasVolumeToggle && unitMode === "volume" && headspaceVolume > 0;

  if (sensors.length === 0) {
    return (
      <div className="rounded-lg p-8 text-center" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <p className="text-sm mb-1" style={{ color: C.textDim, fontFamily: sansFont }}>
          No sensors enabled for this group.
        </p>
        <p className="text-xs" style={{ color: C.textFaint, fontFamily: sansFont }}>
          Turn some on from Recalibrate → Advanced settings.
        </p>
      </div>
    );
  }

  const rawDef = sensors.find((s) => s.id === selected) || sensors[0];

  const displayFor = (s) => {
    if (useVolume && canShowAsVolume(s)) {
      return { def: toVolumeDef(s, headspaceVolume), history: scaleHistory(histories[s.id], headspaceVolume) };
    }
    return { def: s, history: histories[s.id] };
  };

  const { def, history } = displayFor(rawDef);
  const latest = history[history.length - 1]?.v ?? def.baseline;
  const status = statusOf(def, latest);
  const values = history.map((h) => h.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  const yPad = (def.idealMax - def.idealMin || Math.abs(def.baseline) * 0.3) * 1.6 || 1;
  const domainMin = Math.min(min, def.idealMin ?? min, def.hazardLow ?? min) - yPad * 0.3;
  const domainMax = Math.max(max, def.idealMax ?? max, def.hazardHigh ?? max) + yPad * 0.3;

  return (
    <div className="space-y-5">
      {hasVolumeToggle && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
            {[
              { id: "percent", label: "% concentration" },
              { id: "volume", label: "Estimated volume (m³)" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setUnitMode(opt.id)}
                disabled={opt.id === "volume" && !(headspaceVolume > 0)}
                className="px-3 py-1.5 text-xs transition-colors"
                style={{
                  fontFamily: sansFont,
                  background: unitMode === opt.id ? C.panelAlt : "transparent",
                  color: unitMode === opt.id ? C.text : opt.id === "volume" && !(headspaceVolume > 0) ? C.textFaint : C.textDim,
                  opacity: opt.id === "volume" && !(headspaceVolume > 0) ? 0.5 : 1,
                  cursor: opt.id === "volume" && !(headspaceVolume > 0) ? "not-allowed" : "pointer",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {!(headspaceVolume > 0) && (
            <span className="text-[11px]" style={{ color: C.textFaint, fontFamily: sansFont }}>
              Add a gas storage volume on the calibration page to enable volume estimates.
            </span>
          )}
          {useVolume && (
            <span className="text-[11px]" style={{ color: C.textFaint, fontFamily: sansFont }}>
              Estimated as {headspaceVolume} m³ gas storage × concentration
            </span>
          )}
        </div>
      )}

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {sensors.map((s) => {
          const d = displayFor(s);
          return (
            <SensorCard key={s.id} def={d.def} history={d.history} selected={s.id === rawDef.id} onSelect={setSelected} />
          );
        })}
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div className="rounded-lg p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-base" style={{ color: C.text, fontFamily: sansFont, fontWeight: 500 }}>
                {def.label}
              </h2>
              <p className="text-xs mt-1" style={{ color: C.textFaint, fontFamily: sansFont, maxWidth: 480 }}>
                {def.note}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <StatusDot status={status} />
              <span className="text-xs" style={{ color: STATUS_COLOR[status], fontFamily: sansFont }}>
                {STATUS_LABEL[status]}
              </span>
            </div>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid stroke={C.lineSoft} vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis
                  domain={[domainMin, domainMax]}
                  tick={{ fill: C.textFaint, fontSize: 11, fontFamily: monoFont }}
                  axisLine={{ stroke: C.line }}
                  tickLine={false}
                  width={48}
                />
                {def.idealMin != null && def.idealMax != null && def.idealMin !== def.idealMax && (
                  <ReferenceArea y1={def.idealMin} y2={def.idealMax} fill={C.greenSoft} fillOpacity={1} />
                )}
                {def.hazardHigh != null && <ReferenceLine y={def.hazardHigh} stroke={C.red} strokeDasharray="4 3" strokeWidth={1} />}
                {def.hazardLow != null && <ReferenceLine y={def.hazardLow} stroke={C.red} strokeDasharray="4 3" strokeWidth={1} />}
                <Tooltip
                  contentStyle={{ background: C.panelAlt, border: `1px solid ${C.line}`, borderRadius: 6, fontFamily: monoFont, fontSize: 12 }}
                  labelFormatter={() => ""}
                  formatter={(v) => [`${v} ${def.unit}`, def.short]}
                />
                <Line type="monotone" dataKey="v" stroke={STATUS_COLOR[status]} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <div className="text-4xl mb-1" style={{ color: C.text, fontFamily: monoFont, fontWeight: 500 }}>
              {latest}
              <span className="text-base ml-1.5" style={{ color: C.textFaint }}>
                {def.unit}
              </span>
            </div>
            <div className="text-xs mb-4" style={{ color: C.textFaint, fontFamily: sansFont }}>
              current reading
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[["min", min], ["avg", Math.round(avg * 100) / 100], ["max", max]].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs" style={{ color: C.textFaint, fontFamily: sansFont }}>
                    {k}
                  </div>
                  <div style={{ color: C.textDim, fontFamily: monoFont, fontSize: 14 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2 mb-2">
              <Radio size={13} color={C.textFaint} />
              <span className="text-xs" style={{ color: C.textFaint, fontFamily: sansFont }}>
                Sensor hardware
              </span>
            </div>
            <div className="text-sm" style={{ color: C.textDim, fontFamily: sansFont }}>
              {def.hardware}
            </div>
          </div>

          <div className="rounded-lg p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <div className="text-xs mb-2" style={{ color: C.textFaint, fontFamily: sansFont }}>
              Target range
            </div>
            <div style={{ color: C.textDim, fontFamily: monoFont, fontSize: 14 }}>
              {def.idealMin === def.idealMax ? `${def.idealMin} ${def.unit}` : `${def.idealMin} – ${def.idealMax} ${def.unit}`}
            </div>
            <div className="text-xs mt-3 mb-2" style={{ color: C.textFaint, fontFamily: sansFont }}>
              Hazard threshold
            </div>
            <div style={{ color: C.red, fontFamily: monoFont, fontSize: 14 }}>
              {def.hazardLow != null && `< ${def.hazardLow}`}
              {def.hazardLow != null && def.hazardHigh != null && "  /  "}
              {def.hazardHigh != null && `> ${def.hazardHigh}`} {def.unit}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const smallInputStyle = {
  background: C.panelAlt,
  border: `1px solid ${C.line}`,
  borderRadius: 6,
  padding: "8px 10px",
  color: C.text,
  fontFamily: monoFont,
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  width: "100%",
};

function nowLocalInputValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// ---------------------------------------------------------------------------
// Feeding log — without this, nothing else on the dashboard can be explained.
// ---------------------------------------------------------------------------
function FeedingTab({ feedingLog, onAdd, onDelete }) {
  const [form, setForm] = useState({
    time: nowLocalInputValue(),
    quantity: "",
    unit: "kg",
    feedType: FEED_TYPES[0],
    quality: "good",
  });
  const [error, setError] = useState("");

  const submit = () => {
    if (!(parseFloat(form.quantity) > 0)) {
      setError("Enter a quantity greater than 0.");
      return;
    }
    setError("");
    onAdd({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      time: new Date(form.time).getTime() || Date.now(),
      quantity: parseFloat(form.quantity),
      unit: form.unit,
      feedType: form.feedType,
      quality: form.quality,
    });
    setForm((f) => ({ ...f, quantity: "" }));
  };

  const sorted = [...feedingLog].sort((a, b) => b.time - a.time);

  return (
    <div className="space-y-5">
      <div className="rounded-lg p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2 mb-4">
          <Utensils size={15} color={C.textDim} />
          <h2 className="text-sm" style={{ color: C.text, fontFamily: sansFont, fontWeight: 500 }}>
            Log a feeding
          </h2>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: "1.3fr 0.8fr 0.6fr 1fr 1fr auto" }}>
          <Field label="Date / time">
            <input
              type="datetime-local"
              style={{ ...smallInputStyle, fontFamily: sansFont }}
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            />
          </Field>
          <Field label="Quantity">
            <input
              type="number"
              min="0"
              step="0.1"
              style={smallInputStyle}
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              placeholder="e.g. 25"
            />
          </Field>
          <Field label="Unit">
            <select style={{ ...smallInputStyle, fontFamily: sansFont }} value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
              <option value="kg">kg</option>
              <option value="L">L</option>
            </select>
          </Field>
          <Field label="Feed type">
            <select style={{ ...smallInputStyle, fontFamily: sansFont }} value={form.feedType} onChange={(e) => setForm((f) => ({ ...f, feedType: e.target.value }))}>
              {FEED_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quality flag">
            <select style={{ ...smallInputStyle, fontFamily: sansFont }} value={form.quality} onChange={(e) => setForm((f) => ({ ...f, quality: e.target.value }))}>
              {QUALITY_FLAGS.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <button
              onClick={submit}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs"
              style={{ background: C.amber, color: C.bg, fontFamily: sansFont, fontWeight: 500 }}
            >
              <Plus size={13} />
              Add
            </button>
          </div>
        </div>
        {error && <p className="text-[11px] mt-2" style={{ color: C.red }}>{error}</p>}
      </div>

      <div className="rounded-lg p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="text-xs mb-3" style={{ color: C.textFaint, fontFamily: sansFont }}>
          Feeding history ({sorted.length})
        </div>
        {sorted.length === 0 ? (
          <p className="text-sm" style={{ color: C.textDim, fontFamily: sansFont }}>
            No feedings logged yet — add the first one above.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                  {["Date / time", "Quantity", "Feed type", "Quality", ""].map((h) => (
                    <th key={h} className="text-left py-2 px-2 text-[11px]" style={{ color: C.textFaint, fontFamily: sansFont, fontWeight: 500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((e) => {
                  const q = QUALITY_FLAGS.find((f) => f.id === e.quality) || QUALITY_FLAGS[0];
                  return (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                      <td className="py-2 px-2 text-xs" style={{ color: C.textDim, fontFamily: monoFont }}>
                        {new Date(e.time).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-2 px-2 text-xs" style={{ color: C.text, fontFamily: monoFont }}>
                        {e.quantity} {e.unit}
                      </td>
                      <td className="py-2 px-2 text-xs" style={{ color: C.textDim, fontFamily: sansFont }}>
                        {e.feedType}
                      </td>
                      <td className="py-2 px-2 text-xs">
                        <span className="flex items-center gap-1.5" style={{ color: q.color, fontFamily: sansFont }}>
                          <StatusDot status={q.id === "good" ? "normal" : q.id === "overfed" ? "critical" : "warning"} />
                          {q.label}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <button onClick={() => onDelete(e.id)} style={{ color: C.textFaint }} title="Remove entry">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// History / Trends — weekly or monthly rollups so drift is visible without
// scrolling a live chart looking for a slope.
// ---------------------------------------------------------------------------
function HistoryTab({ dailyRollups, calibration }) {
  const enabled = SENSORS.filter((s) => isSensorEnabled(s, calibration));
  const [selected, setSelected] = useState(enabled[0]?.id);
  const [granularity, setGranularity] = useState("weekly");

  if (enabled.length === 0) {
    return (
      <div className="rounded-lg p-8 text-center" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <p className="text-sm" style={{ color: C.textDim, fontFamily: sansFont }}>
          No sensors enabled — there's nothing to show trends for yet.
        </p>
      </div>
    );
  }

  const def = enabled.find((s) => s.id === selected) || enabled[0];
  const daily = dailyRollups[def.id] || [];
  const buckets = aggregateRollup(daily, granularity === "weekly" ? 7 : 30);

  const allVals = buckets.flatMap((b) => [b.min, b.max]);
  const domainMin = Math.min(...allVals, def.idealMin ?? Infinity, def.hazardLow ?? Infinity);
  const domainMax = Math.max(...allVals, def.idealMax ?? -Infinity, def.hazardHigh ?? -Infinity);
  const pad = (domainMax - domainMin) * 0.1 || 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <select style={{ ...inputStyle, width: "auto", minWidth: 220 }} value={def.id} onChange={(e) => setSelected(e.target.value)}>
          {CATEGORIES.map((cat) => (
            <optgroup key={cat.id} label={cat.label}>
              {enabled
                .filter((s) => s.category === cat.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
          {[
            { id: "weekly", label: "Weekly" },
            { id: "monthly", label: "Monthly" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setGranularity(opt.id)}
              className="px-3 py-1.5 text-xs transition-colors"
              style={{
                fontFamily: sansFont,
                background: granularity === opt.id ? C.panelAlt : "transparent",
                color: granularity === opt.id ? C.text : C.textDim,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <h2 className="text-base mb-1" style={{ color: C.text, fontFamily: sansFont, fontWeight: 500 }}>
          {def.label}
        </h2>
        <p className="text-xs mb-4" style={{ color: C.textFaint, fontFamily: sansFont }}>
          {granularity === "weekly" ? "Last 26 weeks" : "Last 6 months"}, showing daily avg / min / max rolled up per {granularity === "weekly" ? "week" : "month"}.
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={buckets} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={C.lineSoft} vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtShortDate} tick={{ fill: C.textFaint, fontSize: 11, fontFamily: monoFont }} axisLine={{ stroke: C.line }} tickLine={false} />
              <YAxis
                domain={[domainMin - pad, domainMax + pad]}
                tick={{ fill: C.textFaint, fontSize: 11, fontFamily: monoFont }}
                axisLine={{ stroke: C.line }}
                tickLine={false}
                width={48}
              />
              {def.idealMin != null && def.idealMax != null && def.idealMin !== def.idealMax && (
                <ReferenceArea y1={def.idealMin} y2={def.idealMax} fill={C.greenSoft} fillOpacity={1} />
              )}
              {def.hazardHigh != null && <ReferenceLine y={def.hazardHigh} stroke={C.red} strokeDasharray="4 3" strokeWidth={1} />}
              {def.hazardLow != null && <ReferenceLine y={def.hazardLow} stroke={C.red} strokeDasharray="4 3" strokeWidth={1} />}
              <Tooltip
                contentStyle={{ background: C.panelAlt, border: `1px solid ${C.line}`, borderRadius: 6, fontFamily: monoFont, fontSize: 12 }}
                labelFormatter={fmtShortDate}
                formatter={(v, name) => [`${v} ${def.unit}`, name]}
              />
              <Line type="monotone" dataKey="max" name="max" stroke={C.textFaint} strokeWidth={1} dot={false} strokeDasharray="3 3" isAnimationActive={false} />
              <Line type="monotone" dataKey="min" name="min" stroke={C.textFaint} strokeWidth={1} dot={false} strokeDasharray="3 3" isAnimationActive={false} />
              <Line type="monotone" dataKey="avg" name="avg" stroke={C.amber} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="text-xs mb-3" style={{ color: C.textFaint, fontFamily: sansFont }}>
          Rollup detail
        </div>
        <div style={{ maxHeight: 260, overflowY: "auto" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Period", "Avg", "Min", "Max"].map((h) => (
                  <th key={h} className="text-left py-2 px-2 text-[11px]" style={{ color: C.textFaint, fontFamily: sansFont, fontWeight: 500 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...buckets].reverse().map((b) => (
                <tr key={b.date} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  <td className="py-2 px-2 text-xs" style={{ color: C.textDim, fontFamily: monoFont }}>
                    {fmtShortDate(b.startDate)} – {fmtShortDate(b.date)}
                  </td>
                  <td className="py-2 px-2 text-xs" style={{ color: C.text, fontFamily: monoFont }}>
                    {b.avg} {def.unit}
                  </td>
                  <td className="py-2 px-2 text-xs" style={{ color: C.textFaint, fontFamily: monoFont }}>
                    {b.min} {def.unit}
                  </td>
                  <td className="py-2 px-2 text-xs" style={{ color: C.textFaint, fontFamily: monoFont }}>
                    {b.max} {def.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Maintenance log — the failure modes no sensor catches (desludging, seals,
// PPE), tracked with the same overdue/due-soon/OK language as sensor status.
// ---------------------------------------------------------------------------
function MaintenanceTab({ maintenanceLog, onAdd }) {
  const [form, setForm] = useState({ taskId: MAINTENANCE_TASKS[0].id, date: nowLocalInputValue().slice(0, 10), notes: "", loggedBy: "" });

  const taskStats = MAINTENANCE_TASKS.map((task) => {
    const entries = maintenanceLog.filter((e) => e.taskId === task.id).sort((a, b) => b.date - a.date);
    const last = entries[0];
    const daysSince = last ? (Date.now() - last.date) / 86400000 : null;
    let status = "overdue";
    if (daysSince != null) {
      if (daysSince <= task.intervalDays * 0.8) status = "ok";
      else if (daysSince <= task.intervalDays) status = "due";
    }
    return { task, last, daysSince, status };
  });

  const logNow = (taskId) => {
    onAdd({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      taskId,
      date: Date.now(),
      notes: "",
      loggedBy: "",
    });
  };

  const submitForm = () => {
    onAdd({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      taskId: form.taskId,
      date: new Date(form.date).getTime() || Date.now(),
      notes: form.notes,
      loggedBy: form.loggedBy,
    });
    setForm((f) => ({ ...f, notes: "" }));
  };

  const sortedLog = [...maintenanceLog].sort((a, b) => b.date - a.date);

  return (
    <div className="space-y-5">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {taskStats.map(({ task, last, daysSince, status }) => (
          <div key={task.id} className="rounded-lg p-4" style={{ background: C.panel, border: `1px solid ${status === "ok" ? C.line : MAINTENANCE_STATUS_COLOR[status]}` }}>
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs" style={{ color: C.text, fontFamily: sansFont, fontWeight: 500 }}>
                {task.label}
              </span>
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: MAINTENANCE_STATUS_COLOR[status], fontFamily: sansFont }}>
                <StatusDot status={status === "ok" ? "normal" : status === "due" ? "warning" : "critical"} />
                {MAINTENANCE_STATUS_LABEL[status]}
              </span>
            </div>
            <p className="text-[11px] mb-3" style={{ color: C.textFaint, fontFamily: sansFont }}>
              {task.note}
            </p>
            <div className="text-xs mb-3" style={{ color: C.textDim, fontFamily: monoFont }}>
              {last ? `Last: ${fmtShortDate(last.date)} (${Math.floor(daysSince)}d ago)` : "Never logged"}
              <span style={{ color: C.textFaint }}> · every {task.intervalDays}d</span>
            </div>
            <button
              onClick={() => logNow(task.id)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md"
              style={{ background: C.panelAlt, color: C.textDim, fontFamily: sansFont }}
            >
              <CheckCircle2 size={12} />
              Log completed today
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-lg p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2 mb-4">
          <Wrench size={15} color={C.textDim} />
          <h2 className="text-sm" style={{ color: C.text, fontFamily: sansFont, fontWeight: 500 }}>
            Log a maintenance entry
          </h2>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 0.8fr 1.6fr 1fr auto" }}>
          <Field label="Task">
            <select style={{ ...smallInputStyle, fontFamily: sansFont }} value={form.taskId} onChange={(e) => setForm((f) => ({ ...f, taskId: e.target.value }))}>
              {MAINTENANCE_TASKS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" style={{ ...smallInputStyle, fontFamily: sansFont }} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Notes">
            <input style={smallInputStyle} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
          </Field>
          <Field label="Logged by">
            <input style={smallInputStyle} value={form.loggedBy} onChange={(e) => setForm((f) => ({ ...f, loggedBy: e.target.value }))} placeholder="Optional" />
          </Field>
          <div className="flex items-end">
            <button
              onClick={submitForm}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs"
              style={{ background: C.amber, color: C.bg, fontFamily: sansFont, fontWeight: 500 }}
            >
              <Plus size={13} />
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="text-xs mb-3" style={{ color: C.textFaint, fontFamily: sansFont }}>
          Maintenance history ({sortedLog.length})
        </div>
        {sortedLog.length === 0 ? (
          <p className="text-sm" style={{ color: C.textDim, fontFamily: sansFont }}>
            Nothing logged yet.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedLog.map((e) => {
              const task = MAINTENANCE_TASKS.find((t) => t.id === e.taskId);
              return (
                <div key={e.id} className="flex items-start justify-between px-3 py-2 rounded-md" style={{ background: C.panelAlt }}>
                  <div>
                    <div className="text-xs" style={{ color: C.text, fontFamily: sansFont }}>
                      {task?.label}
                      {e.loggedBy && <span style={{ color: C.textFaint }}> · {e.loggedBy}</span>}
                    </div>
                    {e.notes && (
                      <div className="text-[11px] mt-0.5" style={{ color: C.textFaint, fontFamily: sansFont }}>
                        {e.notes}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] shrink-0" style={{ color: C.textFaint, fontFamily: monoFont }}>
                    {fmtShortDate(e.date)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sensor diagnostics — turns "stopped updating" into its own visible state
// instead of a silently flat line that looks like stability.
// ---------------------------------------------------------------------------
const DIAG_STATUS = {
  reporting: { label: "Reporting", color: C.green, icon: Wifi },
  stale: { label: "Stale", color: C.red, icon: WifiOff },
  paused: { label: "Paused", color: C.amber, icon: PauseCircle },
  not_installed: { label: "Not installed", color: C.textFaint, icon: WifiOff },
};

function DiagnosticsTab({ calibration, lastUpdate, staleInfo, shutoff }) {
  return (
    <div className="rounded-lg p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2 mb-4">
        <Stethoscope size={15} color={C.textDim} />
        <h2 className="text-sm" style={{ color: C.text, fontFamily: sansFont, fontWeight: 500 }}>
          Sensor diagnostics
        </h2>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Sensor", "Category", "Status", "Last updated", "Last calibrated"].map((h) => (
                <th key={h} className="text-left py-2 px-2 text-[11px]" style={{ color: C.textFaint, fontFamily: sansFont, fontWeight: 500 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SENSORS.map((def) => {
              const enabled = isSensorEnabled(def, calibration);
              let key = "reporting";
              if (!enabled) key = "not_installed";
              else if (shutoff) key = "paused";
              else if (staleInfo?.[def.id]) key = "stale";
              const status = DIAG_STATUS[key];
              const Icon = status.icon;
              const updated = lastUpdate?.[def.id];
              return (
                <tr key={def.id} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  <td className="py-2 px-2 text-xs" style={{ color: enabled ? C.text : C.textFaint, fontFamily: sansFont }}>
                    {def.label}
                  </td>
                  <td className="py-2 px-2 text-xs" style={{ color: C.textFaint, fontFamily: sansFont }}>
                    {CATEGORIES.find((c) => c.id === def.category)?.label}
                  </td>
                  <td className="py-2 px-2 text-xs">
                    <span className="flex items-center gap-1.5" style={{ color: status.color, fontFamily: sansFont }}>
                      <Icon size={12} />
                      {status.label}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-xs" style={{ color: C.textFaint, fontFamily: monoFont }}>
                    {enabled && updated ? new Date(updated).toLocaleTimeString() : "—"}
                  </td>
                  <td className="py-2 px-2 text-xs" style={{ color: C.textFaint, fontFamily: monoFont }}>
                    {enabled && calibration?.calibratedAt ? new Date(calibration.calibratedAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] mt-4" style={{ color: C.textFaint, fontFamily: sansFont }}>
        "Stale" means a sensor stopped sending new readings — treat it as a fault to check, not a flat, stable value.
        Recalibrate under Advanced settings to change which sensors are installed.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calibration page — shown first. Captures digester sizing, then simulates
// connecting to each sensor before handing off to the dashboard.
// ---------------------------------------------------------------------------
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="text-xs block mb-1.5" style={{ color: C.textDim, fontFamily: sansFont }}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] mt-1.5" style={{ color: C.textFaint, fontFamily: sansFont }}>
          {hint}
        </p>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: C.panelAlt,
  border: `1px solid ${C.line}`,
  borderRadius: 6,
  padding: "9px 11px",
  color: C.text,
  fontFamily: monoFont,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const DIGESTER_TYPES = ["Fixed-dome", "Floating-drum", "Balloon / bag", "Plug-flow"];

function CalibrationPage({ onComplete, initial }) {
  const [form, setForm] = useState({
    siteName: initial?.siteName || "",
    digesterType: initial?.digesterType || DIGESTER_TYPES[0],
    digesterVolume: initial?.digesterVolume ?? "",
    headspaceVolume: initial?.headspaceVolume ?? "",
    enabledSensors: initial?.enabledSensors || SENSORS.map((s) => s.id),
    tickMs: initial?.tickMs || DEFAULT_TICK_MS,
  });
  const [errors, setErrors] = useState({});
  const [stage, setStage] = useState("form"); // form | connecting | ready
  const [connected, setConnected] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleSensor = (id) => {
    setForm((f) => ({
      ...f,
      enabledSensors: f.enabledSensors.includes(id)
        ? f.enabledSensors.filter((x) => x !== id)
        : [...f.enabledSensors, id],
    }));
  };

  const setCategorySensors = (catId, enable) => {
    const catIds = SENSORS.filter((s) => s.category === catId).map((s) => s.id);
    setForm((f) => ({
      ...f,
      enabledSensors: enable
        ? Array.from(new Set([...f.enabledSensors, ...catIds]))
        : f.enabledSensors.filter((id) => !catIds.includes(id)),
    }));
  };

  const validate = () => {
    const errs = {};
    const dv = parseFloat(form.digesterVolume);
    const hv = parseFloat(form.headspaceVolume);
    if (!form.siteName.trim()) errs.siteName = "Give the system a name.";
    if (!(dv > 0)) errs.digesterVolume = "Enter the total digester volume in m³.";
    if (!(hv > 0)) errs.headspaceVolume = "Enter the gas storage volume in m³.";
    if (dv > 0 && hv > 0 && hv > dv) errs.headspaceVolume = "Gas storage can't exceed total digester volume.";
    if (form.enabledSensors.length === 0) errs.enabledSensors = "Enable at least one sensor.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const startConnecting = () => {
    if (!validate()) return;
    setStage("connecting");
    setConnected([]);
    const toConnect = SENSORS.filter((s) => form.enabledSensors.includes(s.id));
    toConnect.forEach((s, i) => {
      setTimeout(() => {
        setConnected((prev) => [...prev, s.id]);
        if (i === toConnect.length - 1) setStage("ready");
      }, 220 * (i + 1));
    });
  };

  const handleEnter = () => {
    onComplete({
      siteName: form.siteName.trim(),
      digesterType: form.digesterType,
      digesterVolume: parseFloat(form.digesterVolume),
      headspaceVolume: parseFloat(form.headspaceVolume),
      enabledSensors: form.enabledSensors,
      tickMs: form.tickMs,
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-10" style={{ background: C.bg, fontFamily: sansFont }}>
      <div className="w-full" style={{ maxWidth: 520 }}>
        <div className="flex items-center gap-2.5 mb-1.5">
          <Flame size={20} color={C.amber} strokeWidth={2} />
          <h1 className="text-lg" style={{ color: C.text, fontWeight: 500 }}>
            Digester Monitor
          </h1>
        </div>
        <p className="text-xs mb-7" style={{ color: C.textFaint }}>
          Set up your digester once — this is used to calibrate readings and estimate gas volumes.
        </p>

        <div className="rounded-lg p-6" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          {stage === "form" && (
            <div className="space-y-4">
              <Field label="System / site name">
                <input style={inputStyle} value={form.siteName} onChange={set("siteName")} placeholder="e.g. Mbezi Farm Digester" />
                {errors.siteName && <p className="text-[11px] mt-1.5" style={{ color: C.red }}>{errors.siteName}</p>}
              </Field>

              <Field label="Digester type">
                <select style={{ ...inputStyle, fontFamily: sansFont }} value={form.digesterType} onChange={set("digesterType")}>
                  {DIGESTER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Total digester volume (m³)">
                  <input style={inputStyle} type="number" min="0" step="0.1" value={form.digesterVolume} onChange={set("digesterVolume")} placeholder="e.g. 10" />
                  {errors.digesterVolume && <p className="text-[11px] mt-1.5" style={{ color: C.red }}>{errors.digesterVolume}</p>}
                </Field>
                <Field label="Gas storage volume (m³)" hint="Used to convert gas % readings into estimated volumes.">
                  <input style={inputStyle} type="number" min="0" step="0.1" value={form.headspaceVolume} onChange={set("headspaceVolume")} placeholder="e.g. 3" />
                  {errors.headspaceVolume && <p className="text-[11px] mt-1.5" style={{ color: C.red }}>{errors.headspaceVolume}</p>}
                </Field>
              </div>

              <button
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-1.5 text-xs transition-colors"
                style={{ color: C.textDim, fontFamily: sansFont }}
              >
                <Settings2 size={13} />
                Advanced settings
                <ChevronRight size={13} style={{ transform: showAdvanced ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
              </button>

              {showAdvanced && (
                <div className="rounded-md p-4 space-y-5" style={{ background: C.panelAlt, border: `1px solid ${C.line}` }}>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: C.textDim, fontFamily: sansFont }}>
                        Installed sensors
                      </span>
                      <span className="text-[11px]" style={{ color: C.textFaint, fontFamily: monoFont }}>
                        {form.enabledSensors.length}/{SENSORS.length} enabled
                      </span>
                    </div>
                    <p className="text-[11px] mb-3" style={{ color: C.textFaint, fontFamily: sansFont }}>
                      Turn off anything you haven't physically installed — the dashboard will only show connected sensors.
                    </p>
                    {errors.enabledSensors && <p className="text-[11px] mb-2" style={{ color: C.red }}>{errors.enabledSensors}</p>}

                    <div className="space-y-3">
                      {CATEGORIES.map((cat) => {
                        const catSensors = SENSORS.filter((s) => s.category === cat.id);
                        const allOn = catSensors.every((s) => form.enabledSensors.includes(s.id));
                        return (
                          <div key={cat.id}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px]" style={{ color: C.textFaint, fontFamily: sansFont }}>
                                {cat.label}
                              </span>
                              <button
                                onClick={() => setCategorySensors(cat.id, !allOn)}
                                className="text-[11px] transition-colors"
                                style={{ color: C.amber, fontFamily: sansFont }}
                              >
                                {allOn ? "Deselect all" : "Select all"}
                              </button>
                            </div>
                            <div className="space-y-1">
                              {catSensors.map((s) => {
                                const on = form.enabledSensors.includes(s.id);
                                return (
                                  <label
                                    key={s.id}
                                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md cursor-pointer"
                                    style={{ background: C.panel }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={on}
                                      onChange={() => toggleSensor(s.id)}
                                      style={{ accentColor: C.amber }}
                                    />
                                    <span className="text-xs" style={{ color: on ? C.text : C.textFaint, fontFamily: sansFont }}>
                                      {s.label}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Field label="Sensor refresh rate" hint="How often simulated readings update. Slower is easier to read; faster feels more live.">
                    <select
                      style={{ ...inputStyle, fontFamily: sansFont }}
                      value={form.tickMs}
                      onChange={(e) => setForm((f) => ({ ...f, tickMs: Number(e.target.value) }))}
                    >
                      {REFRESH_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}

              <button
                onClick={startConnecting}
                className="w-full flex items-center justify-center gap-2 rounded-md py-2.5 mt-2 transition-colors"
                style={{ background: C.amber, color: C.bg, fontFamily: sansFont, fontWeight: 500, fontSize: 14 }}
              >
                Save &amp; connect to sensors
                <ArrowRight size={15} />
              </button>
            </div>
          )}

          {stage !== "form" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                {stage === "connecting" ? (
                  <Loader2 size={15} color={C.amber} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={15} color={C.green} />
                )}
                <span className="text-sm" style={{ color: C.text, fontFamily: sansFont }}>
                  {stage === "connecting" ? "Connecting to sensor network…" : "All sensors connected"}
                </span>
              </div>

              <div className="space-y-1.5 mb-5" style={{ maxHeight: 280, overflowY: "auto" }}>
                {SENSORS.filter((s) => form.enabledSensors.includes(s.id)).map((s) => {
                  const isConnected = connected.includes(s.id);
                  return (
                    <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-md" style={{ background: C.panelAlt }}>
                      <span className="text-xs" style={{ color: isConnected ? C.text : C.textFaint, fontFamily: sansFont }}>
                        {s.label}
                      </span>
                      {isConnected ? (
                        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: C.green, fontFamily: monoFont }}>
                          <CheckCircle2 size={12} /> connected
                        </span>
                      ) : (
                        <span className="text-[11px]" style={{ color: C.textFaint, fontFamily: monoFont }}>
                          pending
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {stage === "ready" && (
                <button
                  onClick={handleEnter}
                  className="w-full flex items-center justify-center gap-2 rounded-md py-2.5 transition-colors"
                  style={{ background: C.amber, color: C.bg, fontFamily: sansFont, fontWeight: 500, fontSize: 14 }}
                >
                  Open dashboard
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Emergency shutoff confirmation
// ---------------------------------------------------------------------------
function ShutoffConfirmModal({ onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-6"
      style={{ background: "rgba(6,10,8,0.72)", zIndex: 50 }}
      onClick={onCancel}
    >
      <div
        className="rounded-lg p-6 w-full"
        style={{ background: C.panel, border: `1px solid ${C.red}`, maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <AlertOctagon size={19} color={C.red} />
          <h3 style={{ color: C.text, fontFamily: sansFont, fontWeight: 500, fontSize: 15 }}>
            Confirm emergency shutoff
          </h3>
        </div>
        <p className="text-sm mb-6" style={{ color: C.textDim, fontFamily: sansFont, lineHeight: 1.5 }}>
          This simulates closing the gas valve and halting feed to the digester. Sensor readings will
          pause until you resume the system. Only proceed if there is an active safety concern.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-sm transition-colors"
            style={{ color: C.textDim, fontFamily: sansFont, border: `1px solid ${C.line}`, background: "transparent" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm transition-colors"
            style={{ background: C.red, color: C.text, fontFamily: sansFont, fontWeight: 500 }}
          >
            <Power size={14} />
            Shut off system
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
export default function BiogasDashboard() {
  const [phase, setPhase] = useState("calibration"); // calibration | dashboard
  const [calibration, setCalibration] = useState(null);
  const [tab, setTab] = useState("overview");
  const [selectedByCat, setSelectedByCat] = useState({
    safety: "h2s",
    process: "temp",
    gas: "ch4",
  });
  const [histories, setHistories] = useState(() => {
    const h = {};
    SENSORS.forEach((s) => (h[s.id] = initHistory(s)));
    return h;
  });
  const [shutoff, setShutoff] = useState(false);
  const [shutoffAt, setShutoffAt] = useState(null);
  const [showShutoffConfirm, setShowShutoffConfirm] = useState(false);
  const [events, setEvents] = useState([]);
  const [feedingLog, setFeedingLog] = useState([]);
  const [maintenanceLog, setMaintenanceLog] = useState([]);
  const [dailyRollups] = useState(() => {
    const r = {};
    SENSORS.forEach((s) => (r[s.id] = genDailyRollup(s)));
    return r;
  });
  const [staleInfo, setStaleInfo] = useState({});
  const [lastUpdate, setLastUpdate] = useState(() => {
    const now = Date.now();
    const u = {};
    SENSORS.forEach((s) => (u[s.id] = now));
    return u;
  });
  const tickRef = useRef(HISTORY_LEN);
  const prevStatusRef = useRef({});

  const addEvent = (type, message) => {
    setEvents((prev) =>
      [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, time: Date.now(), type, message }, ...prev].slice(0, 40)
    );
  };

  useEffect(() => {
    if (shutoff) return; // simulation paused while shut off
    const id = setInterval(() => {
      tickRef.current += 1;
      const currentTick = tickRef.current;
      const now = Date.now();
      const updatedIds = [];

      setStaleInfo((prevStale) => {
        const nextStale = { ...prevStale };
        SENSORS.forEach((def) => {
          if (nextStale[def.id]) {
            // small chance a stale sensor recovers each tick
            if (Math.random() < 0.12) delete nextStale[def.id];
          } else if (isSensorEnabled(def, calibration) && Math.random() < 0.003) {
            // rare random fault: sensor stops reporting for a while
            nextStale[def.id] = true;
          }
        });

        setHistories((prev) => {
          const next = {};
          SENSORS.forEach((def) => {
            const arr = prev[def.id];
            if (nextStale[def.id]) {
              next[def.id] = arr; // frozen — no new sample while stale
              return;
            }
            const last = arr[arr.length - 1].v;
            const v = nextValue(def, last);
            next[def.id] = [...arr.slice(1), { t: currentTick, v }];
            updatedIds.push(def.id);

            if (isSensorEnabled(def, calibration)) {
              const newStatus = statusOf(def, v);
              const oldStatus = prevStatusRef.current[def.id] ?? "normal";
              if (newStatus !== oldStatus) {
                if (newStatus === "critical") addEvent("critical", `${def.label} crossed its hazard threshold (${v} ${def.unit})`);
                else if (newStatus === "warning") addEvent("warning", `${def.label} drifted outside target range (${v} ${def.unit})`);
                else addEvent("info", `${def.label} returned to normal (${v} ${def.unit})`);
              }
              prevStatusRef.current[def.id] = newStatus;
            }
          });
          return next;
        });

        return nextStale;
      });

      if (updatedIds.length > 0) {
        setLastUpdate((prev) => {
          const next = { ...prev };
          updatedIds.forEach((id) => (next[id] = now));
          return next;
        });
      }
    }, calibration?.tickMs || DEFAULT_TICK_MS);
    return () => clearInterval(id);
  }, [shutoff, calibration]);

  const handleShutoffConfirm = () => {
    setShutoff(true);
    setShutoffAt(Date.now());
    setShowShutoffConfirm(false);
    addEvent("shutoff", "Emergency shutoff activated — valve closed and feed halted (simulated)");
  };

  const handleResume = () => {
    setShutoff(false);
    setShutoffAt(null);
    addEvent("info", "System resumed by operator");
  };

  const acknowledgeEvent = (id, note) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, acknowledged: true, note, resolvedAt: Date.now() } : e)));
  };

  const addFeeding = (entry) => setFeedingLog((prev) => [...prev, entry]);
  const deleteFeeding = (id) => setFeedingLog((prev) => prev.filter((e) => e.id !== id));
  const addMaintenance = (entry) => setMaintenanceLog((prev) => [...prev, entry]);

  const alertCount = SENSORS.filter((def) => {
    if (!isSensorEnabled(def, calibration)) return false;
    const h = histories[def.id];
    const latest = h[h.length - 1]?.v ?? def.baseline;
    return statusOf(def, latest) !== "normal";
  }).length;

  const jumpTo = (catId, sensorId) => {
    if (sensorId) setSelectedByCat((prev) => ({ ...prev, [catId]: sensorId }));
    setTab(catId);
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
    { id: "feeding", label: "Feeding" },
    { id: "trends", label: "History" },
    { id: "maintenance", label: "Maintenance" },
    { id: "diagnostics", label: "Diagnostics" },
  ];

  if (phase === "calibration") {
    return (
      <CalibrationPage
        initial={calibration}
        onComplete={(cal) => {
          setCalibration({ ...cal, calibratedAt: Date.now() });
          setPhase("dashboard");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ background: C.bg, fontFamily: sansFont }}>
      {showShutoffConfirm && <ShutoffConfirmModal onConfirm={handleShutoffConfirm} onCancel={() => setShowShutoffConfirm(false)} />}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <Flame size={20} color={C.amber} strokeWidth={2} />
              <h1 className="text-lg" style={{ color: C.text, fontWeight: 500 }}>
                Digester Monitor
              </h1>
            </div>
            <p className="text-xs mt-1" style={{ color: C.textFaint }}>
              {calibration?.siteName || "Anaerobic digester"} · {calibration?.digesterType} · {calibration?.digesterVolume} m³ ·{" "}
              {calibration?.enabledSensors?.length ?? SENSORS.length}/{SENSORS.length} sensors
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block rounded-full"
                style={{ width: 7, height: 7, background: shutoff ? C.red : C.green }}
              />
              <span className="text-xs" style={{ color: C.textDim, fontFamily: monoFont }}>
                {shutoff ? "OFFLINE" : "LIVE"}
              </span>
            </div>
            {!shutoff && alertCount > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={13} color={C.amber} />
                <span className="text-xs" style={{ color: C.amber, fontFamily: monoFont }}>
                  {alertCount} needs attention
                </span>
              </div>
            )}
            <button
              onClick={() => downloadCSV(histories, calibration?.siteName, calibration)}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: C.textFaint, fontFamily: sansFont }}
              title="Export current readings as CSV"
            >
              <Download size={13} />
              Export data
            </button>
            <button
              onClick={() => setPhase("calibration")}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: C.textFaint, fontFamily: sansFont }}
              title="Recalibrate"
            >
              <Settings2 size={13} />
              Recalibrate
            </button>
            {!shutoff && (
              <button
                onClick={() => setShowShutoffConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors"
                style={{ color: C.red, border: `1px solid ${C.red}`, fontFamily: sansFont, fontWeight: 500 }}
              >
                <AlertOctagon size={13} />
                Emergency shutoff
              </button>
            )}
          </div>
        </div>

        {shutoff && (
          <div
            className="rounded-lg p-4 mb-6 flex items-center justify-between flex-wrap gap-3"
            style={{ background: C.redSoft, border: `1px solid ${C.red}` }}
          >
            <div className="flex items-center gap-2.5">
              <AlertOctagon size={17} color={C.red} />
              <div>
                <div style={{ color: C.text, fontFamily: sansFont, fontSize: 13, fontWeight: 500 }}>
                  System shut off
                </div>
                <div style={{ color: C.textDim, fontFamily: sansFont, fontSize: 11 }}>
                  Valve closed and feed halted (simulated) at {shutoffAt ? new Date(shutoffAt).toLocaleTimeString() : "—"}.
                  Sensor readings are frozen.
                </div>
              </div>
            </div>
            <button
              onClick={handleResume}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors"
              style={{ background: C.green, color: C.bg, fontFamily: sansFont, fontWeight: 500 }}
            >
              <Power size={13} />
              Resume system
            </button>
          </div>
        )}

        {/* main tabs */}
        <div className="flex gap-1 mb-7 flex-wrap" style={{ borderBottom: `1px solid ${C.line}` }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-sm"
              style={{
                color: tab === t.id ? C.text : C.textFaint,
                borderBottom: `2px solid ${tab === t.id ? C.amber : "transparent"}`,
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <OverviewTab histories={histories} onJump={jumpTo} events={events} calibration={calibration} onAcknowledge={acknowledgeEvent} />
        )}
        {CATEGORIES.some((c) => c.id === tab) && (
          <CategoryTab
            catId={tab}
            selected={selectedByCat[tab]}
            setSelected={(id) => setSelectedByCat((prev) => ({ ...prev, [tab]: id }))}
            histories={histories}
            calibration={calibration}
          />
        )}
        {tab === "feeding" && <FeedingTab feedingLog={feedingLog} onAdd={addFeeding} onDelete={deleteFeeding} />}
        {tab === "trends" && <HistoryTab dailyRollups={dailyRollups} calibration={calibration} />}
        {tab === "maintenance" && <MaintenanceTab maintenanceLog={maintenanceLog} onAdd={addMaintenance} />}
        {tab === "diagnostics" && <DiagnosticsTab calibration={calibration} lastUpdate={lastUpdate} staleInfo={staleInfo} shutoff={shutoff} />}
      </div>
    </div>
  );
}
