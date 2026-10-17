// bloom-deps:

export interface SerializedFilter {
  m: number;
  k: number;
  capacity: number;
  fpRate: number;
  bits: Uint8Array;
}

function fnv1a32(bytes: Uint8Array): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function djb2(bytes: Uint8Array): number {
  let hash = 5381;
  for (let i = 0; i < bytes.length; i++) {
    hash = Math.imul(hash, 33) ^ bytes[i];
  }
  return hash >>> 0;
}

function encodeUTF8(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const buf: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      buf.push(code);
    } else if (code < 0x800) {
      buf.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      buf.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      i++;
      const next = str.charCodeAt(i);
      const cp = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
      buf.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f)
      );
    }
  }
  return new Uint8Array(buf);
}

export class BloomFilter {
  private readonly _m: number;
  private readonly _k: number;
  private readonly _capacity: number;
  private readonly _fpRate: number;
  private _bits: Uint8Array;

  constructor(options: { capacity: number; fpRate?: number }) {
    const { capacity } = options;
    const fpRate = options.fpRate !== undefined ? options.fpRate : 0.01;

    const ln2 = Math.LN2;
    const ln2sq = ln2 * ln2;

    let m = Math.ceil((-capacity * Math.log(fpRate)) / ln2sq);
    if (m < 8) m = 8;

    let k = Math.round((m / capacity) * ln2);
    if (k < 1) k = 1;

    this._m = m;
    this._k = k;
    this._capacity = capacity;
    this._fpRate = fpRate;
    this._bits = new Uint8Array(Math.ceil(m / 8));
  }

  private static _restore(serialized: SerializedFilter): BloomFilter {
    const filter = Object.create(BloomFilter.prototype) as BloomFilter;
    (filter as any)._m = serialized.m;
    (filter as any)._k = serialized.k;
    (filter as any)._capacity = serialized.capacity;
    (filter as any)._fpRate = serialized.fpRate;
    (filter as any)._bits = new Uint8Array(serialized.bits);
    return filter;
  }

  static from(serialized: SerializedFilter): BloomFilter {
    return BloomFilter._restore(serialized);
  }

  private _getHashes(item: string): [number, number] {
    const bytes = encodeUTF8(item);
    const h1 = fnv1a32(bytes);
    const h2 = djb2(bytes);
    return [h1, h2];
  }

  private _getBitIndices(item: string): number[] {
    const [h1, h2] = this._getHashes(item);
    const indices: number[] = [];
    for (let i = 0; i < this._k; i++) {
      const idx = ((h1 + i * h2) >>> 0) % this._m;
      indices.push(idx);
    }
    return indices;
  }

  add(item: string): void {
    const indices = this._getBitIndices(item);
    for (const idx of indices) {
      const byteIdx = Math.floor(idx / 8);
      const bitIdx = idx % 8;
      this._bits[byteIdx] |= (1 << bitIdx);
    }
  }

  has(item: string): boolean {
    const indices = this._getBitIndices(item);
    for (const idx of indices) {
      const byteIdx = Math.floor(idx / 8);
      const bitIdx = idx % 8;
      if ((this._bits[byteIdx] & (1 << bitIdx)) === 0) {
        return false;
      }
    }
    return true;
  }

  addAll(items: string[]): void {
    for (const item of items) {
      this.add(item);
    }
  }

  get estimatedSize(): number {
    const setBits = this._countSetBits();
    const m = this._m;
    const k = this._k;
    if (setBits === 0) return 0;
    if (setBits >= m) return m;
    return Math.round((-m / k) * Math.log(1 - setBits / m));
  }

  get fillRatio(): number {
    return this._countSetBits() / this._m;
  }

  private _countSetBits(): number {
    let count = 0;
    for (let i = 0; i < this._bits.length; i++) {
      let byte = this._bits[i];
      while (byte) {
        count += byte & 1;
        byte >>>= 1;
      }
    }
    return count;
  }

  serialize(): SerializedFilter {
    return {
      m: this._m,
      k: this._k,
      capacity: this._capacity,
      fpRate: this._fpRate,
      bits: new Uint8Array(this._bits),
    };
  }

  merge(other: BloomFilter): BloomFilter {
    if (other._m !== this._m || other._k !== this._k) {
      throw new Error(
        `BloomFilter.merge: incompatible filters (m: ${this._m} vs ${other._m}, k: ${this._k} vs ${other._k})`
      );
    }
    const merged = BloomFilter._restore({
      m: this._m,
      k: this._k,
      capacity: this._capacity,
      fpRate: this._fpRate,
      bits: new Uint8Array(this._bits.length),
    });
    for (let i = 0; i < this._bits.length; i++) {
      (merged as any)._bits[i] = this._bits[i] | other._bits[i];
    }
    return merged;
  }

  clear(): void {
    this._bits.fill(0);
  }
}