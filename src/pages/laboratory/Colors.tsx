import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { HexColorPicker } from 'react-colorful';
import { type Language } from '../../types';

// Conversion functions
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
}

function rgbToRgb565(r: number, g: number, b: number) {
  const r5 = Math.round((r * 31) / 255);
  const g6 = Math.round((g * 63) / 255);
  const b5 = Math.round((b * 31) / 255);
  return (r5 << 11) | (g6 << 5) | b5;
}

function rgb565ToRgb(rgb565: number) {
  const r5 = (rgb565 >> 11) & 0x1F;
  const g6 = (rgb565 >> 5) & 0x3F;
  const b5 = rgb565 & 0x1F;
  return {
    r: Math.round((r5 * 255) / 31),
    g: Math.round((g6 * 255) / 63),
    b: Math.round((b5 * 255) / 31)
  };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hsvToRgb(h: number, s: number, v: number) {
  h /= 360; s /= 100; v /= 100;
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToCmyk(r: number, g: number, b: number) {
  let c = 1 - (r / 255);
  let m = 1 - (g / 255);
  let y = 1 - (b / 255);
  let k = Math.min(c, Math.min(m, y));
  
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }
  
  c = (c - k) / (1 - k);
  m = (m - k) / (1 - k);
  y = (y - k) / (1 - k);
  
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  };
}

function cmykToRgb(c: number, m: number, y: number, k: number) {
  c /= 100; m /= 100; y /= 100; k /= 100;
  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k))
  };
}

export default function Colors({ lang }: { lang: Language }) {
  const [rgb, setRgb] = useState({ r: 46, g: 105, b: 232 }); // #2e69e8
  const [hex24String, setHex24String] = useState(rgbToHex(rgb.r, rgb.g, rgb.b).replace('#', '').toLowerCase());
  const [hex16String, setHex16String] = useState(rgbToRgb565(rgb.r, rgb.g, rgb.b).toString(16).padStart(4, '0').toLowerCase());

  useEffect(() => {
    setHex24String(rgbToHex(rgb.r, rgb.g, rgb.b).replace('#', '').toLowerCase());
    setHex16String(rgbToRgb565(rgb.r, rgb.g, rgb.b).toString(16).padStart(4, '0').toLowerCase());
  }, [rgb]);

  const handleRgbChange = (r: number, g: number, b: number) => {
    setRgb({ r: Math.max(0, Math.min(255, r)), g: Math.max(0, Math.min(255, g)), b: Math.max(0, Math.min(255, b)) });
  };

  const handleHexChange = (val: string) => {
    const cleanVal = val.replace('#', '');
    setHex24String(cleanVal);
    if (/^[0-9A-F]{6}$/i.test(cleanVal)) {
      setRgb(hexToRgb('#' + cleanVal));
    }
  };

  const handleHex16Change = (val: string) => {
    const cleanVal = val.replace('0x', '');
    setHex16String(cleanVal);
    if (/^[0-9A-F]{1,4}$/i.test(cleanVal)) {
      const num = parseInt(cleanVal, 16);
      if (!isNaN(num)) {
        setRgb(rgb565ToRgb(Math.max(0, Math.min(65535, num))));
      }
    } else if (cleanVal === '') {
      setRgb(rgb565ToRgb(0));
    }
  };

  const handleRgb565Change = (val: number) => {
    setRgb(rgb565ToRgb(Math.max(0, Math.min(65535, val))));
  };

  const handleHslChange = (h: number, s: number, l: number) => {
    setRgb(hslToRgb(Math.max(0, Math.min(360, h)), Math.max(0, Math.min(100, s)), Math.max(0, Math.min(100, l))));
  };

  const handleHsvChange = (h: number, s: number, v: number) => {
    setRgb(hsvToRgb(Math.max(0, Math.min(360, h)), Math.max(0, Math.min(100, s)), Math.max(0, Math.min(100, v))));
  };

  const handleCmykChange = (c: number, m: number, y: number, k: number) => {
    setRgb(cmykToRgb(Math.max(0, Math.min(100, c)), Math.max(0, Math.min(100, m)), Math.max(0, Math.min(100, y)), Math.max(0, Math.min(100, k))));
  };

  const setRandomColor = () => {
    setRgb({
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256)
    });
  };

  const hex24 = rgbToHex(rgb.r, rgb.g, rgb.b);
  const rgb565 = rgbToRgb565(rgb.r, rgb.g, rgb.b);
  const hex16 = rgb565.toString(16).padStart(4, '0').toLowerCase();
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

  return (
    <>
      {/* Full screen background */}
      <div 
        className="fixed inset-0 transition-colors duration-500 pointer-events-none" 
        style={{ backgroundColor: hex24, zIndex: 0 }} 
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] p-8 -mx-8 -mt-8 rounded-3xl"
      >
      <div className="bg-[#2c2c2c] text-white p-6 sm:p-12 rounded-[2rem] shadow-2xl w-full max-w-5xl flex flex-col gap-12">
        
        {/* Main Content */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-12">
          
          {/* Left */}
          <div className="flex flex-col gap-10 w-64">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-400 font-semibold tracking-wider uppercase">HEX 24bit</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-lg">#</span>
                <input 
                  value={hex24String} 
                  onChange={e => handleHexChange(e.target.value)}
                  className="bg-white text-black pl-8 pr-4 py-3 rounded-lg text-lg font-mono w-full outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-400 font-semibold tracking-wider uppercase">HEX 16bit</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-lg">0x</span>
                <input 
                  value={hex16String} 
                  onChange={e => handleHex16Change(e.target.value)}
                  className="bg-white text-black pl-10 pr-4 py-3 rounded-lg text-lg font-mono w-full outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Center - Color Picker */}
          <div className="flex-shrink-0">
            <style>{`
              .custom-layout .react-colorful {
                width: 320px;
                height: 320px;
              }
              .custom-layout .react-colorful__pointer {
                width: 24px;
                height: 24px;
                border: 3px solid white;
                box-shadow: 0 0 0 1px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,0,0,0.3);
              }
              .custom-layout .react-colorful__saturation {
                border-radius: 16px;
                margin-bottom: 20px;
              }
              .custom-layout .react-colorful__hue {
                height: 24px;
                border-radius: 12px;
              }
            `}</style>
            <div className="custom-layout">
              <HexColorPicker color={hex24} onChange={handleHexChange} />
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-10 w-64">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-400 font-semibold tracking-wider uppercase">RGB 24bit</label>
              <div className="flex gap-2">
                <input 
                  value={rgb.r} 
                  onChange={e => handleRgbChange(parseInt(e.target.value)||0, rgb.g, rgb.b)}
                  className="bg-white text-black px-2 py-3 rounded-lg text-lg font-mono w-full text-center outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  value={rgb.g} 
                  onChange={e => handleRgbChange(rgb.r, parseInt(e.target.value)||0, rgb.b)}
                  className="bg-white text-black px-2 py-3 rounded-lg text-lg font-mono w-full text-center outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  value={rgb.b} 
                  onChange={e => handleRgbChange(rgb.r, rgb.g, parseInt(e.target.value)||0)}
                  className="bg-white text-black px-2 py-3 rounded-lg text-lg font-mono w-full text-center outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-400 font-semibold tracking-wider uppercase">RGB 16bit</label>
              <input 
                value={rgb565} 
                onChange={e => handleRgb565Change(parseInt(e.target.value) || 0)}
                className="bg-white text-black px-4 py-3 rounded-lg text-lg font-mono w-full outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

        </div>

        {/* Bottom Row - Single Line */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-4 mt-4 w-full">
          
          {/* HSL */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400 font-semibold tracking-wider uppercase">HSL</label>
            <div className="flex items-center gap-1 sm:gap-2 text-white font-bold text-base sm:text-lg">
              <input value={hsl.h} onChange={e => handleHslChange(parseInt(e.target.value)||0, hsl.s, hsl.l)} className="bg-white text-black px-1 sm:px-2 py-2 rounded-lg w-12 sm:w-14 text-center font-mono outline-none focus:ring-2 focus:ring-blue-500" />
              <span>,</span>
              <input value={hsl.s} onChange={e => handleHslChange(hsl.h, parseInt(e.target.value)||0, hsl.l)} className="bg-white text-black px-1 sm:px-2 py-2 rounded-lg w-12 sm:w-14 text-center font-mono outline-none focus:ring-2 focus:ring-blue-500" />
              <span>,</span>
              <input value={hsl.l} onChange={e => handleHslChange(hsl.h, hsl.s, parseInt(e.target.value)||0)} className="bg-white text-black px-1 sm:px-2 py-2 rounded-lg w-12 sm:w-14 text-center font-mono outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* HSV */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400 font-semibold tracking-wider uppercase">HSV</label>
            <div className="flex items-center gap-1 sm:gap-2 text-white font-bold text-base sm:text-lg">
              <input value={hsv.h} onChange={e => handleHsvChange(parseInt(e.target.value)||0, hsv.s, hsv.v)} className="bg-white text-black px-1 sm:px-2 py-2 rounded-lg w-12 sm:w-14 text-center font-mono outline-none focus:ring-2 focus:ring-blue-500" />
              <span>,</span>
              <input value={hsv.s} onChange={e => handleHsvChange(hsv.h, parseInt(e.target.value)||0, hsv.v)} className="bg-white text-black px-1 sm:px-2 py-2 rounded-lg w-12 sm:w-14 text-center font-mono outline-none focus:ring-2 focus:ring-blue-500" />
              <span>,</span>
              <input value={hsv.v} onChange={e => handleHsvChange(hsv.h, hsv.s, parseInt(e.target.value)||0)} className="bg-white text-black px-1 sm:px-2 py-2 rounded-lg w-12 sm:w-14 text-center font-mono outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* CMYK */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400 font-semibold tracking-wider uppercase">CMYK</label>
            <div className="flex items-center gap-1 sm:gap-2 text-white font-bold text-base sm:text-lg">
              <input value={cmyk.c} onChange={e => handleCmykChange(parseInt(e.target.value)||0, cmyk.m, cmyk.y, cmyk.k)} className="bg-white text-black px-1 sm:px-2 py-2 rounded-lg w-10 sm:w-14 text-center font-mono outline-none focus:ring-2 focus:ring-blue-500" />
              <span>,</span>
              <input value={cmyk.m} onChange={e => handleCmykChange(cmyk.c, parseInt(e.target.value)||0, cmyk.y, cmyk.k)} className="bg-white text-black px-1 sm:px-2 py-2 rounded-lg w-10 sm:w-14 text-center font-mono outline-none focus:ring-2 focus:ring-blue-500" />
              <span>,</span>
              <input value={cmyk.y} onChange={e => handleCmykChange(cmyk.c, cmyk.m, parseInt(e.target.value)||0, cmyk.k)} className="bg-white text-black px-1 sm:px-2 py-2 rounded-lg w-10 sm:w-14 text-center font-mono outline-none focus:ring-2 focus:ring-blue-500" />
              <span>,</span>
              <input value={cmyk.k} onChange={e => handleCmykChange(cmyk.c, cmyk.m, cmyk.y, parseInt(e.target.value)||0)} className="bg-white text-black px-1 sm:px-2 py-2 rounded-lg w-10 sm:w-14 text-center font-mono outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

        </div>

        {/* Random Button */}
        <div className="flex justify-center mt-4">
          <button 
            onClick={setRandomColor}
            className="bg-[#1e88e5] hover:bg-[#1976d2] text-white px-8 py-3 rounded-xl font-medium transition-colors"
          >
            Random color
          </button>
        </div>

      </div>
      </motion.div>
    </>
  );
}
