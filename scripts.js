// ============================================================
// STATE
// ============================================================
const state = {
  h: 239, // 0–360
  s: 59, // 0–100
  v: 95, // 0–100
  a: 1.0, // 0.0–1.0
};

// ============================================================
// DOM REFS
// ============================================================
const canvas = document.getElementById("colorBox");
const ctx = canvas.getContext("2d");
const boxCursor = document.getElementById("boxCursor");
const hueSlider = document.getElementById("hueSlider");
const alphaSlider = document.getElementById("alphaSlider");
const alphaGradientTrack = document.getElementById("alphaGradientTrack");

// ============================================================
// COLOR CONVERSIONS
// ============================================================
function hsvToRgb(h, s, v) {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h <= 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h,
    s,
    v = max;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((c) => Math.round(c).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function rgbToCmyk(r, g, b) {
  const rNorm = r / 255,
    gNorm = g / 255,
    bNorm = b / 255;
  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - rNorm - k) / (1 - k)) * 100),
    m: Math.round(((1 - gNorm - k) / (1 - k)) * 100),
    y: Math.round(((1 - bNorm - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function rgbToOklch(r, g, b) {
  const hsl = rgbToHsl(r, g, b);
  const l = hsl.l / 100;
  const c = (hsl.s / 100) * 0.4 * (1 - Math.abs(2 * l - 1));
  return {
    l: l.toFixed(2),
    c: c.toFixed(3),
    h: hsl.h.toFixed(1),
  };
}

function oklchToRgb(l, c, h) {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l_lin = Math.pow(Math.max(0, l_), 3);
  const m_lin = Math.pow(Math.max(0, m_), 3);
  const s_lin = Math.pow(Math.max(0, s_), 3);

  let r_l = 4.0767416621 * l_lin - 3.3077115913 * m_lin + 0.2309699292 * s_lin;
  let g_l = -1.2684380046 * l_lin + 2.6097574011 * m_lin - 0.3413193965 * s_lin;
  let b_l = -0.0041960863 * l_lin - 0.7034186147 * m_lin + 1.707614701 * s_lin;

  const gamma = (x) =>
    x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;

  return {
    r: Math.round(Math.max(0, Math.min(1, gamma(r_l))) * 255),
    g: Math.round(Math.max(0, Math.min(1, gamma(g_l))) * 255),
    b: Math.round(Math.max(0, Math.min(1, gamma(b_l))) * 255),
  };
}

function rgbToRgb565(r, g, b) {
  const r5 = (r >> 3) & 0x1f;
  const g6 = (g >> 2) & 0x3f;
  const b5 = (b >> 3) & 0x1f;
  const val = (r5 << 11) | (g6 << 5) | b5;
  return "0x" + val.toString(16).toUpperCase().padStart(4, "0");
}

function rgbToAnsi256(r, g, b) {
  if (r === g && g === b) {
    if (r < 8) return 16;
    if (r > 248) return 231;
    return Math.round(((r - 8) / 247) * 24) + 232;
  }
  return (
    16 +
    36 * Math.round((r / 255) * 5) +
    6 * Math.round((g / 255) * 5) +
    Math.round((b / 255) * 5)
  );
}

// ============================================================
// CANVAS / UI
// ============================================================
function adjustCanvasDPI() {
  const w = canvas.parentElement.offsetWidth;
  const h = canvas.parentElement.offsetHeight;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  const scale = window.devicePixelRatio || 1;
  canvas.width = w * scale;
  canvas.height = h * scale;
  ctx.scale(scale, scale);
}

function drawColorBox() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);

  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = `hsl(${state.h}, 100%, 50%)`;
  ctx.fillRect(0, 0, w, h);

  const gradW = ctx.createLinearGradient(0, 0, w, 0);
  gradW.addColorStop(0, "rgba(255,255,255,1)");
  gradW.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradW;
  ctx.fillRect(0, 0, w, h);

  const gradB = ctx.createLinearGradient(0, 0, 0, h);
  gradB.addColorStop(0, "rgba(0,0,0,0)");
  gradB.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = gradB;
  ctx.fillRect(0, 0, w, h);
}

function updateCursorCoords() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const x = (state.s / 100) * w;
  const y = (1 - state.v / 100) * h;
  boxCursor.style.left = x + "px";
  boxCursor.style.top = y + "px";
}

function pickCoordinates(x, y) {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const cx = Math.max(0, Math.min(x, w));
  const cy = Math.max(0, Math.min(y, h));
  state.s = Math.round((cx / w) * 100);
  state.v = Math.round((1 - cy / h) * 100);
  updateUI();
}

// ============================================================
// MAIN UI UPDATE
// ============================================================
function updateUI(activeInputId = null) {
  updateCursorCoords();

  const rgb = hsvToRgb(state.h, state.s, state.v);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
  const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);

  const alphaHex = Math.round(state.a * 255)
    .toString(16)
    .toUpperCase()
    .padStart(2, "0");
  const hexText = state.a < 1 ? `${hex}${alphaHex}` : hex;
  const rgbText = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const rgbaText = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${state.a})`;
  const hslText = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  const hslaText = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${state.a})`;
  const oklchText = `oklch(${oklch.l} ${oklch.c} ${oklch.h})`;
  const cmykText = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;

  const imColorText = `ImColor(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.round(state.a * 255)})`;
  const imVec4Text = `ImVec4(${(rgb.r / 255).toFixed(2)}f, ${(rgb.g / 255).toFixed(2)}f, ${(rgb.b / 255).toFixed(2)}f, ${state.a}f)`;
  const imVec3Text = `ImVec3(${(rgb.r / 255).toFixed(2)}f, ${(rgb.g / 255).toFixed(2)}f, ${(rgb.b / 255).toFixed(2)}f)`;
  const unityText = `new Color(${(rgb.r / 255).toFixed(2)}f, ${(rgb.g / 255).toFixed(2)}f, ${(rgb.b / 255).toFixed(2)}f, ${state.a}f)`;
  const flutterText = `Color(0x${alphaHex}${hex.replace("#", "")})`;
  const swiftText = `UIColor(red: ${(rgb.r / 255).toFixed(2)}, green: ${(rgb.g / 255).toFixed(2)}, blue: ${(rgb.b / 255).toFixed(2)}, alpha: ${state.a})`;
  const javaText = `Color.argb(${Math.round(state.a * 255)}, ${rgb.r}, ${rgb.g}, ${rgb.b})`;

  const ansiFgText = `\\x1b[38;2;${rgb.r};${rgb.g};${rgb.b}m`;
  const ansiBgText = `\\x1b[48;2;${rgb.r};${rgb.g};${rgb.b}m`;
  const ansi256Text = `\\x1b[38;5;${rgbToAnsi256(rgb.r, rgb.g, rgb.b)}m`;
  const rgb565Text = rgbToRgb565(rgb.r, rgb.g, rgb.b);

  const fieldMap = {
    inputHex: hexText,
    inputRgb: rgbText,
    inputRgba: rgbaText,
    inputHsl: hslText,
    inputHsla: hslaText,
    inputOklch: oklchText,
    inputCmyk: cmykText,
    inputImColor: imColorText,
    inputImVec4: imVec4Text,
    inputImVec3: imVec3Text,
    inputUnity: unityText,
    inputFlutter: flutterText,
    inputSwift: swiftText,
    inputJava: javaText,
    inputAnsiFg: ansiFgText,
    inputAnsiBg: ansiBgText,
    inputAnsi256: ansi256Text,
    inputRgb565: rgb565Text,
  };

  for (const [id, val] of Object.entries(fieldMap)) {
    const el = document.getElementById(id);
    if (el && id !== activeInputId) {
      el.value = val;
    }
  }

  const solid = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${state.a})`;
  document.getElementById("headerColorPreview").style.backgroundColor = solid;
  document.getElementById("headerColorHex").innerText = hexText;
  document.getElementById("largeColorDisplay").style.backgroundColor = solid;

  alphaGradientTrack.style.background = `linear-gradient(to right, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1))`;
}

// ============================================================
// INPUT EDITING (bidirectional)
// ============================================================
function handleInputEdit(format, val, inputId) {
  let rgb = null;
  let parsedAlpha = 1.0;

  try {
    if (format === "hex") {
      let hex = val.trim().replace(/^#/, "");
      if (hex.length === 3)
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      if (hex.length === 6) {
        rgb = {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
        };
      } else if (hex.length === 8) {
        rgb = {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
        };
        parsedAlpha = parseFloat(
          (parseInt(hex.slice(6, 8), 16) / 255).toFixed(2),
        );
      }
    } else if (format === "rgb" || format === "rgba") {
      const m = val.match(
        /rgba?\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)?/i,
      );
      if (m) {
        rgb = { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) };
        if (m[4] !== undefined) parsedAlpha = parseFloat(m[4]);
      }
    } else if (format === "hsl" || format === "hsla") {
      const m = val.match(
        /hsla?\(?\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*(?:,\s*([\d.]+)\s*)?\)?/i,
      );
      if (m) {
        rgb = hslToRgb(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
        if (m[4] !== undefined) parsedAlpha = parseFloat(m[4]);
      }
    } else if (format === "oklch") {
      const m =
        val.match(/oklch\(?\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)?/i) ||
        val.match(/oklch\(?\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)?/i);
      if (m)
        rgb = oklchToRgb(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
    } else if (format === "cmyk") {
      const m = val.match(
        /cmyk\(?\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)?/i,
      );
      if (m) {
        const c = parseInt(m[1]) / 100,
          m2 = parseInt(m[2]) / 100,
          y = parseInt(m[3]) / 100,
          k = parseInt(m[4]) / 100;
        rgb = {
          r: Math.round(255 * (1 - c) * (1 - k)),
          g: Math.round(255 * (1 - m2) * (1 - k)),
          b: Math.round(255 * (1 - y) * (1 - k)),
        };
      }
    } else if (format === "imcolor") {
      const nums = val.match(/\d+/g);
      if (nums && nums.length >= 3) {
        rgb = {
          r: parseInt(nums[0]),
          g: parseInt(nums[1]),
          b: parseInt(nums[2]),
        };
        if (nums[3] !== undefined)
          parsedAlpha = parseFloat((parseInt(nums[3]) / 255).toFixed(2));
      }
    } else if (
      format === "imvec4" ||
      format === "imvec3" ||
      format === "unity"
    ) {
      const nums = val.match(/[\d.]+/g);
      if (nums && nums.length >= 3) {
        rgb = {
          r: Math.round(parseFloat(nums[0]) * 255),
          g: Math.round(parseFloat(nums[1]) * 255),
          b: Math.round(parseFloat(nums[2]) * 255),
        };
        if (nums[3] !== undefined) parsedAlpha = parseFloat(nums[3]);
      }
    } else if (format === "flutter") {
      const m = val.match(/0x([0-9A-Fa-f]{8})/);
      if (m) {
        const h = m[1];
        parsedAlpha = parseFloat(
          (parseInt(h.slice(0, 2), 16) / 255).toFixed(2),
        );
        rgb = {
          r: parseInt(h.slice(2, 4), 16),
          g: parseInt(h.slice(4, 6), 16),
          b: parseInt(h.slice(6, 8), 16),
        };
      }
    } else if (format === "swift") {
      const nums = val.match(/[\d.]+/g);
      if (nums && nums.length >= 3) {
        rgb = {
          r: Math.round(parseFloat(nums[0]) * 255),
          g: Math.round(parseFloat(nums[1]) * 255),
          b: Math.round(parseFloat(nums[2]) * 255),
        };
        if (nums[3] !== undefined) parsedAlpha = parseFloat(nums[3]);
      }
    } else if (format === "java") {
      const nums = val.match(/\d+/g);
      if (nums && nums.length >= 4) {
        parsedAlpha = parseFloat((parseInt(nums[0]) / 255).toFixed(2));
        rgb = {
          r: parseInt(nums[1]),
          g: parseInt(nums[2]),
          b: parseInt(nums[3]),
        };
      }
    } else if (format === "ansifg" || format === "ansibg") {
      const m = val.match(/(\d+)\s*;\s*(\d+)\s*;\s*(\d+)/);
      if (m) rgb = { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) };
    } else if (format === "ansi256") {
      const m = val.match(/38;5;(\d+)/) || val.match(/(\d+)/);
      if (m) {
        const idx = parseInt(m[1]);
        if (idx >= 16 && idx <= 255) {
          let code = idx - 16;
          const b = code % 6;
          const g = Math.floor(code / 6) % 6;
          const r = Math.floor(code / 36) % 6;
          rgb = { r: r * 51, g: g * 51, b: b * 51 };
        }
      }
    } else if (format === "rgb565") {
      let clean = val.replace(/^0x/i, "").trim();
      if (clean.length === 4) {
        const num = parseInt(clean, 16);
        if (!isNaN(num)) {
          const r5 = (num >> 11) & 0x1f;
          const g6 = (num >> 5) & 0x3f;
          const b5 = num & 0x1f;
          rgb = {
            r: Math.round((r5 * 255) / 31),
            g: Math.round((g6 * 255) / 63),
            b: Math.round((b5 * 255) / 31),
          };
        }
      }
    }

    if (rgb && !isNaN(rgb.r) && !isNaN(rgb.g) && !isNaN(rgb.b)) {
      rgb.r = Math.max(0, Math.min(255, rgb.r));
      rgb.g = Math.max(0, Math.min(255, rgb.g));
      rgb.b = Math.max(0, Math.min(255, rgb.b));

      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      state.h = hsv.h;
      state.s = hsv.s;
      state.v = hsv.v;
      state.a = Math.max(0.0, Math.min(1.0, parsedAlpha));

      hueSlider.value = state.h;
      alphaSlider.value = Math.round(state.a * 100);
      document.getElementById("hueVal").innerText = state.h + "°";
      document.getElementById("alphaVal").innerText = state.a;

      drawColorBox();
      updateUI(inputId);
    }
  } catch (e) {
    console.warn("Parse error:", e);
  }
}

// ============================================================
// CLIPBOARD / TOAST
// ============================================================
function copyToClipboard(inputId, message) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.select();
  el.setSelectionRange(0, 99999);
  try {
    document.execCommand("copy");
    showToast(message);
  } catch (_) {}
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toastMessage").innerText = msg;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2000);
}

// ============================================================
// GITHUB STATS
// ============================================================
function fetchGitHubStats() {
  fetch("https://api.github.com/repos/rafidahmed870/colors-hub")
    .then((res) => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then((data) => {
      if (data.stargazers_count !== undefined)
        document.getElementById("repoStars").innerText = data.stargazers_count;
      if (data.forks_count !== undefined)
        document.getElementById("repoForks").innerText = data.forks_count;
    })
    .catch(() => {
      document.getElementById("repoStars").innerText = "18";
      document.getElementById("repoForks").innerText = "4";
    });
}

// ============================================================
// INTERACTIVE CONTROLS (canvas picker)
// ============================================================
function setupControls() {
  let isDragging = false;

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };

  const onStart = (e) => {
    isDragging = true;
    const p = getPos(e);
    pickCoordinates(p.x, p.y);
  };
  const onMove = (e) => {
    if (!isDragging) return;
    const p = getPos(e);
    pickCoordinates(p.x, p.y);
  };
  const onEnd = () => {
    isDragging = false;
  };

  canvas.addEventListener("mousedown", onStart);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onEnd);

  canvas.addEventListener("touchstart", onStart, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("touchend", onEnd, { passive: true });

  hueSlider.addEventListener("input", () => {
    state.h = parseInt(hueSlider.value);
    document.getElementById("hueVal").innerText = state.h + "°";
    drawColorBox();
    updateUI();
  });

  alphaSlider.addEventListener("input", () => {
    state.a = parseFloat((alphaSlider.value / 100).toFixed(2));
    document.getElementById("alphaVal").innerText = state.a;
    updateUI();
  });
}

// ============================================================
// INIT
// ============================================================
window.onload = function () {
  adjustCanvasDPI();
  drawColorBox();
  updateUI();
  setupControls();
  fetchGitHubStats();
};

window.onresize = function () {
  adjustCanvasDPI();
  drawColorBox();
  updateUI();
};
