// bloom-deps:

export function naturalCompare(a: string, b: string): number {
  if (typeof a !== 'string' || typeof b !== 'string') {
    throw new TypeError('arguments must be strings');
  }

  function splitChunks(s: string): Array<{ isNum: boolean; value: string }> {
    const chunks: Array<{ isNum: boolean; value: string }> = [];
    let i = 0;
    while (i < s.length) {
      const isNum = s[i] >= '0' && s[i] <= '9';
      let j = i + 1;
      while (j < s.length && (s[j] >= '0' && s[j] <= '9') === isNum) {
        j++;
      }
      chunks.push({ isNum, value: s.slice(i, j) });
      i = j;
    }
    return chunks;
  }

  const aChunks = splitChunks(a);
  const bChunks = splitChunks(b);

  const len = Math.max(aChunks.length, bChunks.length);

  for (let i = 0; i < len; i++) {
    if (i >= aChunks.length) return -1;
    if (i >= bChunks.length) return 1;

    const ac = aChunks[i];
    const bc = bChunks[i];

    if (ac.isNum && bc.isNum) {
      const an = parseInt(ac.value, 10);
      const bn = parseInt(bc.value, 10);
      if (an !== bn) return an - bn;
    } else {
      const al = ac.value.toLowerCase();
      const bl = bc.value.toLowerCase();
      if (al < bl) return -1;
      if (al > bl) return 1;
    }
  }

  return 0;
}