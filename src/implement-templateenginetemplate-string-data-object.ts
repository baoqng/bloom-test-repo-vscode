// bloom-deps:

export class RenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RenderError';
  }
}

interface EngineOptions {
  partials?: Record<string, string>;
  helpers?: Record<string, (value: unknown, options: HelperOptions) => string>;
  escape?: (str: string) => string;
  delimiters?: [string, string];
}

interface HelperOptions {
  data: object;
  fn: (ctx?: object) => string;
  inverse: () => string;
  hash: Record<string, unknown>;
}

function defaultEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function lookupPath(data: object, path: string, iterationCtx?: { index: number; key: string | number }): unknown {
  if (path === '@index') {
    return iterationCtx !== undefined ? iterationCtx.index : undefined;
  }
  if (path === '@key') {
    return iterationCtx !== undefined ? iterationCtx.key : undefined;
  }

  const parts = path.split('.');
  let current: unknown = data;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseHashArgs(argsStr: string): { positional: string; hash: Record<string, unknown> } {
  const hash: Record<string, unknown> = {};
  let positional = '';

  const kvRegex = /(\w+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let remaining = argsStr.trim();

  // Extract hash args first
  const kvMatches: Array<{ full: string; key: string; value: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = kvRegex.exec(argsStr)) !== null) {
    kvMatches.push({
      full: m[0],
      key: m[1],
      value: m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4],
    });
    hash[m[1]] = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4];
  }

  // Remove hash args from remaining to get positional
  for (const kv of kvMatches) {
    remaining = remaining.replace(kv.full, '').trim();
  }
  positional = remaining.trim();

  return { positional, hash };
}

function renderTemplate(
  template: string,
  data: object,
  options: EngineOptions,
  depth: number,
  iterationCtx?: { index: number; key: string | number }
): string {
  if (depth > 10) {
    throw new RenderError('Recursive partial depth exceeded limit of 10');
  }

  const escape = options.escape ?? defaultEscape;
  let openDelim = options.delimiters ? options.delimiters[0] : '{{';
  let closeDelim = options.delimiters ? options.delimiters[1] : '}}';

  let result = '';
  let pos = 0;
  const len = template.length;

  while (pos < len) {
    // Build regex for current delimiters
    const openEsc = escapeRegExp(openDelim);
    const closeEsc = escapeRegExp(closeDelim);

    // Find next opening delimiter
    const openIdx = template.indexOf(openDelim, pos);
    if (openIdx === -1) {
      result += template.slice(pos);
      break;
    }

    // Append text before the tag
    result += template.slice(pos, openIdx);
    pos = openIdx;

    // Check for delimiter change tag: {{= [[ ]] =}}
    const delimChangeRegex = new RegExp(
      `^${openEsc}=\\s*(\\S+)\\s+(\\S+)\\s*=${closeEsc}`
    );
    const delimMatch = delimChangeRegex.exec(template.slice(pos));
    if (delimMatch) {
      openDelim = delimMatch[1];
      closeDelim = delimMatch[2];
      pos += delimMatch[0].length;
      continue;
    }

    // Check for triple-stache {{{raw}}}
    if (
      template.startsWith(openDelim + '{', pos) &&
      openDelim === '{{' &&
      closeDelim === '}}'
    ) {
      const tripleClose = '}}}';
      const tripleOpen = '{{{';
      const tripleEnd = template.indexOf(tripleClose, pos + tripleOpen.length);
      if (tripleEnd !== -1) {
        const varName = template.slice(pos + tripleOpen.length, tripleEnd).trim();
        const val = lookupPath(data, varName, iterationCtx);
        result += val !== undefined && val !== null ? String(val) : '';
        pos = tripleEnd + tripleClose.length;
        continue;
      }
    }

    // Find closing delimiter
    const closeIdx = template.indexOf(closeDelim, pos + openDelim.length);
    if (closeIdx === -1) {
      // No closing delimiter found, output rest as literal
      result += template.slice(pos);
      break;
    }

    const tagContent = template.slice(pos + openDelim.length, closeIdx);
    const fullTag = template.slice(pos, closeIdx + closeDelim.length);

    // Comment tag: {{! ... }}
    if (tagContent.startsWith('!')) {
      pos = closeIdx + closeDelim.length;
      continue;
    }

    // Partial tag: {{> partialName}}
    if (tagContent.startsWith('>')) {
      const partialName = tagContent.slice(1).trim();
      const partials = options.partials ?? {};
      if (!(partialName in partials)) {
        throw new RenderError(`Partial not found: ${partialName}`);
      }
      const partialTemplate = partials[partialName];
      result += renderTemplate(partialTemplate, data, options, depth + 1, iterationCtx);
      pos = closeIdx + closeDelim.length;
      continue;
    }

    // Block section: {{#name ...}} or {{^name}}
    if (tagContent.startsWith('#') || tagContent.startsWith('^')) {
      const isInverted = tagContent.startsWith('^');
      const inner = tagContent.slice(1).trim();

      // Parse name and args
      const spaceIdx = inner.search(/\s/);
      let sectionName: string;
      let argsStr: string = '';
      if (spaceIdx === -1) {
        sectionName = inner;
      } else {
        sectionName = inner.slice(0, spaceIdx);
        argsStr = inner.slice(spaceIdx + 1).trim();
      }

      // Find matching closing tag
      const closeTag = `${openDelim}/${sectionName}${closeDelim}`;
      const elseTag = `${openDelim}else${closeDelim}`;

      // We need to find the matching close, accounting for nesting
      let innerStart = closeIdx + closeDelim.length;
      let nesting = 1;
      let searchPos = innerStart;
      let blockEnd = -1;

      while (searchPos < template.length) {
        const nextOpen = template.indexOf(`${openDelim}#${sectionName}`, searchPos);
        const nextClose = template.indexOf(closeTag, searchPos);

        if (nextClose === -1) {
          throw new RenderError(`Unclosed section: ${sectionName}`);
        }

        if (nextOpen !== -1 && nextOpen < nextClose) {
          nesting++;
          searchPos = nextOpen + openDelim.length + 1 + sectionName.length;
        } else {
          nesting--;
          if (nesting === 0) {
            blockEnd = nextClose;
            break;
          }
          searchPos = nextClose + closeTag.length;
        }
      }

      if (blockEnd === -1) {
        throw new RenderError(`Unclosed section: ${sectionName}`);
      }

      const blockContent = template.slice(innerStart, blockEnd);

      // Split on {{else}} (only at top level of this block)
      let mainBlock = blockContent;
      let elseBlock = '';

      // Find else at nesting level 0
      {
        let eNesting = 0;
        let ePos = 0;
        let elseIdx = -1;
        while (ePos < blockContent.length) {
          const eNextOpen = blockContent.indexOf(`${openDelim}#`, ePos);
          const eNextClose = blockContent.indexOf(`${openDelim}/`, ePos);
          const eNextElse = blockContent.indexOf(elseTag, ePos);

          const candidates = [
            eNextOpen !== -1 ? eNextOpen : Infinity,
            eNextClose !== -1 ? eNextClose : Infinity,
            eNextElse !== -1 ? eNextElse : Infinity,
          ];
          const minPos = Math.min(...candidates);

          if (minPos === Infinity) break;

          if (eNextElse !== -1 && minPos === eNextElse && eNesting === 0) {
            elseIdx = eNextElse;
            break;
          } else if (eNextOpen !== -1 && minPos === eNextOpen) {
            eNesting++;
            ePos = eNextOpen + openDelim.length + 1;
          } else if (eNextClose !== -1 && minPos === eNextClose) {
            eNesting--;
            ePos = eNextClose + openDelim.length + 1;
          } else {
            ePos = minPos + 1;
          }
        }

        if (elseIdx !== -1) {
          mainBlock = blockContent.slice(0, elseIdx);
          elseBlock = blockContent.slice(elseIdx + elseTag.length);
        }
      }

      pos = blockEnd + closeTag.length;

      if (isInverted) {
        // {{^section}}
        const val = lookupPath(data, sectionName, iterationCtx);
        const isFalsy = !val || (Array.isArray(val) && val.length === 0);
        if (isFalsy) {
          result += renderTemplate(mainBlock, data, options, depth, iterationCtx);
        }
        continue;
      }

      // Check if it's a helper
      const helpers = options.helpers ?? {};
      if (sectionName in helpers) {
        const { positional, hash } = parseHashArgs(argsStr);
        const helperValue = positional ? lookupPath(data, positional, iterationCtx) : undefined;
        const helperOptions: HelperOptions = {
          data,
          fn: (ctx?: object) =>
            renderTemplate(mainBlock, ctx ?? data, options, depth, iterationCtx),
          inverse: () =>
            renderTemplate(elseBlock, data, options, depth, iterationCtx),
          hash,
        };
        result += helpers[sectionName](helperValue, helperOptions);
        continue;
      }

      // Check if argsStr is non-empty but sectionName is not a helper — check if it might be a helper call
      if (argsStr && !(sectionName in helpers)) {
        // Could be an unknown helper
        throw new RenderError(`Unknown helper: ${sectionName}`);
      }

      // Regular section
      const val = lookupPath(data, sectionName, iterationCtx);

      if (typeof val === 'function') {
        const fn = (ctx?: object) =>
          renderTemplate(mainBlock, ctx ?? data, options, depth, iterationCtx);
        result += (val as (fn: (ctx?: object) => string) => string)(fn);
        continue;
      }

      if (Array.isArray(val)) {
        if (val.length === 0) {
          result += renderTemplate(elseBlock, data, options, depth, iterationCtx);
        } else {
          for (let i = 0; i < val.length; i++) {
            const item = val[i];
            const itemCtx = typeof item === 'object' && item !== null ? item : { '.': item };
            result += renderTemplate(mainBlock, itemCtx as object, options, depth, {
              index: i,
              key: i,
            });
          }
        }
        continue;
      }

      const isTruthy = val !== null && val !== undefined && val !== false && val !== 0 && val !== '';
      if (isTruthy) {
        const ctx = typeof val === 'object' && val !== null ? (val as object) : data;
        result += renderTemplate(mainBlock, ctx, options, depth, iterationCtx);
      } else {
        result += renderTemplate(elseBlock, data, options, depth, iterationCtx);
      }
      continue;
    }

    // Closing tag (shouldn't appear at top level normally, skip)
    if (tagContent.startsWith('/')) {
      pos = closeIdx + closeDelim.length;
      continue;
    }

    // Variable interpolation: {{variable}}
    const varName = tagContent.trim();
    const val = lookupPath(data, varName, iterationCtx);
    if (val !== undefined && val !== null) {
      result += escape(String(val));
    }
    pos = closeIdx + closeDelim.length;
  }

  return result;
}

export function templateEngine(template: string, data: object, options?: EngineOptions): string {
  if (typeof template !== 'string') {
    throw new TypeError('template must be a string');
  }
  if (typeof data !== 'object' || data === null) {
    throw new TypeError('data must be a non-null object');
  }

  const opts: EngineOptions = options ?? {};
  return renderTemplate(template, data, opts, 0, undefined);
}