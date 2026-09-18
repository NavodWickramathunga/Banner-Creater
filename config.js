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
//
// Reward copy is tied to QR transactions only, never to opening a savings
// account: 1GB per QR payment, first 3 payments each day, up to 10GB a month.
// Keep account-creation presets free of any prize claim.
export const PRESETS = [
  ["eZ Cash creation",  ["CREATE YOUR", "eZ CASH ACCOUNT", "GET 1GB", "INSTANTLY"], "GET STARTED"],
  ["Just Pay",          ["LINK YOUR", "BANK ACCOUNT", "PAY STRAIGHT FROM", "YOUR OWN BANK"], "LINK NOW"],
  ["Savings creation",  ["OPEN YOUR", "DIGITAL SAVINGS", "ACCOUNT", "RIGHT INSIDE MYDIALOG"], "CREATE NOW"],
  ["QR — first scan",   ["EVERY SCAN", "= 1GB", "FIRST 3 QR PAYMENTS DAILY", "UP TO 10GB A MONTH"], "SCAN & PAY"],
  ["QR — daily habit",  ["3 SCANS.", "3GB. EVERY DAY.", "1GB PER QR PAYMENT", "UP TO 10GB A MONTH"], "START SCANNING"],
  ["QR — win back",     ["YOUR 1GB IS", "ONE SCAN AWAY", "EVERY QR PAYMENT EARNS DATA", "UP TO 10GB A MONTH"], "SCAN NOW"],
  ["QR — heavy user",   ["UP TO", "10GB A MONTH", "1GB PER QR PAYMENT", "FIRST 3 PAYMENTS EACH DAY"], "PAY WITH QR"],
  ["Top up savings",    ["TOP UP YOUR", "SAVINGS ACCOUNT", "READY FOR YOUR", "NEXT QR PAYMENT"], "TOP UP NOW"],
  ["Top up eZ Cash",    ["TOP UP YOUR", "eZ CASH ACCOUNT", "READY FOR YOUR", "NEXT QR PAYMENT"], "TOP UP NOW"]
];

// Defaults for the first four lines, matching the original Small_Splash artwork.
export const BASE_LINES = [
  { size: 25, y: 96,  color: PLUM,    blink: false },
  { size: 25, y: 128, color: PLUM,    blink: false },
  { size: 24, y: 168, color: PLUM,    blink: false },
  { size: 18, y: 201, color: MAGENTA, blink: true }
];

export const BUTTON_DEFAULTS = { size: 22, x: 150, y: 216, w: 240, h: 52, r: 12 };
