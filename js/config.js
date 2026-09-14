// Layout is always authored on a 300x300 grid and scaled at export time.
export const GRID = 300;
export const MARGIN = 19;

export const PLUM = "#5D0253";
export const MAGENTA = "#D3064F";
export const BTN_GRADIENT = ["#4C055E", "#BB0149"];

export const LOGO_SRC = "assets/logo.png";
export const LOGO_RATIO = 44 / 167;   // height / width of the supplied logo

// One @font-face per language, so switching language switches the glyphs
// available to the canvas. BannerFont (Poppins Bold) has no Sinhala or Tamil
// glyphs, hence the dedicated Noto Sans subsets.
export const FONTS = { en: "BannerFont", si: "SinhalaFont", ta: "TamilFont" };
export const LANGUAGES = [
  ["en", "English"],
  ["si", "සිංහල"],
  ["ta", "தமிழ்"]
];

// Journey presets: [label, lines, cta]
export const PRESETS = [
  ["eZ Cash creation", ["CREATE YOUR", "eZ CASH ACCOUNT", "SCAN & PAY", "WIN 10GB EVERY MONTH"], "CREATE NOW"],
  ["Just Pay",         ["LINK YOUR", "BANK ACCOUNT", "SCAN & PAY", "WIN 10GB EVERY MONTH"], "LINK NOW"],
  ["1st QR payment",   ["MAKE YOUR", "1ST QR PAYMENT", "SCAN & PAY", "WIN 10GB EVERY MONTH"], "SCAN & PAY NOW"],
  ["Savings creation", ["CREATE YOUR DIGITAL", "SAVINGS ACCOUNT", "SCAN & PAY", "WIN 10GB EVERY MONTH"], "CREATE NOW"],
  ["Top up savings",   ["TOP UP YOUR", "SAVINGS ACCOUNT", "SCAN & PAY", "WIN 10GB EVERY MONTH"], "TOP UP NOW"],
  ["Top up eZ Cash",   ["TOP UP YOUR", "eZ CASH ACCOUNT", "SCAN & PAY", "WIN 10GB EVERY MONTH"], "TOP UP NOW"]
];

// Defaults for the first four lines, matching the original Small_Splash artwork.
export const BASE_LINES = [
  { size: 25, y: 96,  color: PLUM,    blink: false },
  { size: 25, y: 128, color: PLUM,    blink: false },
  { size: 24, y: 168, color: PLUM,    blink: false },
  { size: 18, y: 201, color: MAGENTA, blink: true }
];

export const BUTTON_DEFAULTS = { size: 22, x: 150, y: 216, w: 240, h: 52, r: 12 };
