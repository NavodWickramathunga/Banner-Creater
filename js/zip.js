/**
 * A minimal ZIP writer, store method only (no compression).
 *
 * Every file going in here is already a compressed image (GIF or PNG), so
 * deflating again would cost CPU and save nothing. Store keeps this to a
 * hundred lines with no dependency, which matters because the whole editor
 * ships as one self-contained HTML file.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/** DOS time/date fields, as required by the ZIP local header. */
function dosStamp(d = new Date()) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

class ByteWriter {
  constructor() { this.parts = []; this.length = 0; }
  bytes(b) { this.parts.push(b); this.length += b.length; return this; }
  u16(v) { return this.bytes(new Uint8Array([v & 0xFF, (v >>> 8) & 0xFF])); }
  u32(v) {
    return this.bytes(new Uint8Array([v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]));
  }
  blob(type) { return new Blob(this.parts, { type }); }
}

/**
 * @param files [{ name, data }] where data is a Uint8Array
 * @returns Blob of a .zip
 */
export function makeZip(files) {
  const enc = new TextEncoder();
  const { time, date } = dosStamp();
  const w = new ByteWriter();
  const central = [];

  files.forEach(f => {
    const nameBytes = enc.encode(f.name);
    const crc = crc32(f.data);
    const offset = w.length;

    w.u32(0x04034B50).u16(20).u16(0).u16(0).u16(time).u16(date);
    w.u32(crc).u32(f.data.length).u32(f.data.length);
    w.u16(nameBytes.length).u16(0).bytes(nameBytes).bytes(f.data);

    central.push({ nameBytes, crc, size: f.data.length, offset });
  });

  const dirStart = w.length;
  central.forEach(e => {
    w.u32(0x02014B50).u16(20).u16(20).u16(0).u16(0).u16(time).u16(date);
    w.u32(e.crc).u32(e.size).u32(e.size);
    w.u16(e.nameBytes.length).u16(0).u16(0).u16(0).u16(0).u32(0).u32(e.offset);
    w.bytes(e.nameBytes);
  });
  const dirSize = w.length - dirStart;

  w.u32(0x06054B50).u16(0).u16(0).u16(central.length).u16(central.length);
  w.u32(dirSize).u32(dirStart).u16(0);

  return w.blob('application/zip');
}
