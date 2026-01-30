// tokenforFigma.ts
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import chokidar from 'chokidar';

const ROOT = process.cwd();

const INPUT_PATH = path.join(ROOT, 'src/assets/data/token.json');
const TOKEN_OUTPUT_PATH = path.join(ROOT, 'src/styles/figma/_tokens.scss');
const MIXINS_OUTPUT_PATH = path.join(ROOT, 'src/styles/figma/_mixins.scss');
const TYPO_OUTPUT_PATH = path.join(ROOT, 'src/styles/figma/_typo.scss');

const environment = process.env.NODE_ENV ?? 'development';

/* ==================================================
 * 1. 타입 정의 (핵심)
 * ================================================== */

type Primitive = string | number;

/** token의 최종 leaf */
interface TokenLeaf {
  value: Primitive | Record<string, unknown> | Array<Record<string, unknown>>;
  type: string;
}

/** token의 중간 노드 */
interface TokenNode {
  [key: string]: TokenNode | TokenLeaf;
}

/* ==================================================
 * 2. 타입 가드
 * ================================================== */

function isTokenLeaf(v: unknown): v is TokenLeaf {
  if (typeof v !== 'object' || v === null) return false;
  if (!('value' in v) || !('type' in v)) return false;
  return true;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/* ==================================================
 * 3. 설정
 * ================================================== */

const MIXINS_TYPE = new Set(['typo']);

/* ==================================================
 * 4. 유틸
 * ================================================== */

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function distributionType(obj: TokenNode): {
  token: TokenNode;
  mixin: TokenNode;
} {
  const token: TokenNode = {};
  const mixin: TokenNode = {};

  for (const key of Object.keys(obj)) {
    if (MIXINS_TYPE.has(key)) {
      mixin[key] = obj[key];
    } else {
      token[key] = obj[key];
    }
  }

  return { token, mixin };
}

/* ==================================================
 * 5. 값 포맷터 (TS 안전)
 * ================================================== */

function formatValue(token: TokenLeaf): string {
  const { value, type } = token;

  if (typeof value === 'number') {
    return `${value}px`;
  }

  if (typeof value === 'string') {
    return value;
  }

  // boxShadow
  if (type === 'boxShadow') {
    if (Array.isArray(value)) {
      return value
        .map((v) => {
          if (!isRecord(v)) return '';
          const { x, y, blur, spread, color } = v;
          return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
        })
        .join(', ');
    }

    if (isRecord(value)) {
      const css: string[] = [];
      for (const [k, v] of Object.entries(value)) {
        if (k === 'type') {
          if (v === 'innerShadow') {
            css.unshift('inset');
          }
        } else {
          css.push(v as string);
        }
      }
      return css.join(' ');
    }
  }

  // typography
  if (type === 'typography' && isRecord(value)) {
    const out: string[] = [];

    if (value.fontFamily) out.push(`  font-family: ${value.fontFamily};`);
    if (value.textTransform)
      out.push(`  text-transform: ${value.textTransform};`);
    if (value.fontWeight) out.push(`  font-weight: ${value.fontWeight};`);
    if (value.fontSize) out.push(`  font-size: ${value.fontSize};`);
    if (value.lineHeight) out.push(`  line-height: ${value.lineHeight};`);
    if (value.letterSpacing)
      out.push(`  letter-spacing: ${value.letterSpacing};`);
    if (value.textDecoration)
      out.push(`  text-decoration: ${value.textDecoration};`);

    return out.join('\n');
  }

  return String(value);
}

/* ==================================================
 * 6. 토큰 순회 (가장 중요)
 * ================================================== */

function walkTokens(
  node: TokenNode,
  paths: string[] = [],
  result: string[] = [],
  mode: 'token' | 'mixins' | 'mixins-typo' = 'token'
): string[] {
  for (const key of Object.keys(node)) {
    const current = node[key];
    const nextPath = [...paths, toKebabCase(key)];

    if (isTokenLeaf(current)) {
      const cssKey = nextPath.join('-');
      const cssValue = formatValue(current);

      if (mode === 'mixins') {
        result.push(`@mixin ${cssKey} {\n${changeVariantToVar(cssValue)}\n}\n`);
      } else if (mode === 'mixins-typo') {
        result.push(`.${cssKey} {\n  @include ${cssKey};\n}\n`);
      } else {
        result.push(`  --${cssKey}: ${cssValue};`);
      }
    } else {
      walkTokens(current, nextPath, result, mode);
    }
  }

  return result;
}

/* ==================================================
 * 7. CSS 변수 치환
 * ================================================== */

function changeVariantToVar(input: string): string {
  let out = input;
  let start = out.indexOf('{');

  while (start !== -1) {
    const end = out.indexOf('}', start + 1);
    if (end === -1) break;

    const key = out.slice(start + 1, end);
    out = out.replace(`{${key}}`, `var(--${key.split('.').join('-')})`);

    start = out.indexOf('{', end + 1);
  }

  return out.replace(/--global/g, '-');
}

/* ==================================================
 * 8. CSS 생성
 * ================================================== */

function tokensToCSS(token: TokenNode): string {
  return `:root {\n${changeVariantToVar(walkTokens(token).join('\n'))}\n}`;
}

function mixinsToCSS(mixin: TokenNode, mode: 'mixins' | 'mixins-typo'): string {
  return walkTokens(mixin, [], [], mode).join('\n');
}

/* ==================================================
 * 9. 실행
 * ================================================== */

async function init(): Promise<void> {
  const raw = await readFile(INPUT_PATH, 'utf8');
  const json = JSON.parse(raw) as { global: TokenNode };

  const { token, mixin } = distributionType(json.global);

  await mkdir(path.dirname(TOKEN_OUTPUT_PATH), { recursive: true });
  await mkdir(path.dirname(MIXINS_OUTPUT_PATH), { recursive: true });
  await mkdir(path.dirname(TYPO_OUTPUT_PATH), { recursive: true });

  const typo_class_mix = '@use "./mixins" as *;\n\n';

  await writeFile(TOKEN_OUTPUT_PATH, tokensToCSS(token));
  await writeFile(MIXINS_OUTPUT_PATH, mixinsToCSS(mixin, 'mixins'));
  await writeFile(
    TYPO_OUTPUT_PATH,
    typo_class_mix + mixinsToCSS(mixin, 'mixins-typo')
  );
}

if (environment === 'production') {
  void init();
} else {
  void init();
  chokidar.watch('src/assets/data/token.json').on('all', () => void init());
}
