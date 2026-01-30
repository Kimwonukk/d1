import path from 'node:path';
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  cpSync,
  rmSync,
  existsSync,
} from 'node:fs';

const distRoot = './dist';
const standaloneRoot = './standalone';

// standalone 폴더 초기화
if (existsSync(standaloneRoot)) {
  rmSync(standaloneRoot, { recursive: true });
}
cpSync(distRoot, standaloneRoot, { recursive: true });
console.log('📦 Copied dist → standalone');

/**
 * 파일 목록 재귀적으로 가져오기
 */
function walkFiles(dir: string, ext: string): string[] {
  const files: string[] = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...walkFiles(fullPath, ext));
    } else if (fullPath.endsWith(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * HTML 경로 변환: 절대경로 → 상대경로
 */
function rewriteHtml(html: string, htmlPath: string, rootDir: string): string {
  const htmlDir = path.dirname(htmlPath);

  /**
   * 절대경로를 상대경로로 변환하는 헬퍼 함수
   */
  function toRelative(absPath: string): string {
    // 외부 링크, 앵커, mailto 등은 그대로 유지
    if (
      absPath.startsWith('http://') ||
      absPath.startsWith('https://') ||
      absPath.startsWith('mailto:') ||
      absPath.startsWith('tel:') ||
      absPath.startsWith('#')
    ) {
      return absPath;
    }

    // 절대경로가 아니면 그대로 반환
    if (!absPath.startsWith('/')) {
      return absPath;
    }

    // 루트(/)는 index.html로 변환
    if (absPath === '/') {
      const rel = path.relative(htmlDir, path.join(rootDir, 'index.html'));
      return rel || './index.html';
    }

    // /kr/ta/ta-0000 같은 경로를 /kr/ta/ta-0000.html로 변환
    let targetPath = absPath;

    // 이미 .html이 있거나, 파일 확장자가 있으면 그대로 사용
    if (!path.extname(targetPath)) {
      targetPath = targetPath + '.html';
    }

    const absTargetPath = path.join(rootDir, targetPath);
    const rel = path.relative(htmlDir, absTargetPath);

    // 같은 디렉토리면 파일명만, 아니면 상대경로
    // 빈 문자열인 경우 './'를 반환 (현재 디렉토리 명시)
    return rel.replace(/\\/g, '/') || './';
  }

  // 1. href="/" 또는 src="/" → 상대경로
  // 정규식: href 또는 src 속성에서 절대경로 찾기
  // 예: href="/assets/image.png", src="/js/script.js"
  html = html.replace(/(href|src)="\/([^"]*)"/g, (_match, attr, targetPath) => {
    // http://, https://, //, # 제외
    if (
      targetPath.startsWith('http://') ||
      targetPath.startsWith('https://') ||
      targetPath.startsWith('//') ||
      targetPath.startsWith('#')
    ) {
      return `${attr}="/${targetPath}"`;
    }
    return `${attr}="${toRelative('/' + targetPath)}"`;
  });

  // 2. srcset="/" → 상대경로 (반응형 이미지)
  // srcset 형식: "/path/image.jpg 1x, /path/image@2x.jpg 2x"
  // 각 경로를 개별적으로 상대경로로 변환
  html = html.replace(/srcset="([^"]*)"/g, (_match, srcsetValue) => {
    const rewritten = srcsetValue.replace(/\/([^\s,]+)/g, (_m: string, imagePath: string) => {
      if (
        imagePath.startsWith('http://') ||
        imagePath.startsWith('https://') ||
        imagePath.startsWith('//')
      ) {
        return `/${imagePath}`;
      }
      return toRelative('/' + imagePath);
    });
    return `srcset="${rewritten}"`;
  });

  // 3. poster="/" → 상대경로 (비디오 포스터)
  html = html.replace(/poster="\/([^"]+)"/g, (_match, targetPath) => {
    if (
      targetPath.startsWith('http://') ||
      targetPath.startsWith('https://') ||
      targetPath.startsWith('//')
    ) {
      return `poster="/${targetPath}"`;
    }
    return `poster="${toRelative('/' + targetPath)}"`;
  });

  // 4. data-*="/" → 상대경로 (data 속성)
  html = html.replace(/data-[a-z-]+="\/([^"]+)"/g, (match, targetPath) => {
    if (
      targetPath.startsWith('http://') ||
      targetPath.startsWith('https://') ||
      targetPath.startsWith('//')
    ) {
      return match;
    }
    const attr = match.substring(0, match.indexOf('='));
    return `${attr}="${toRelative('/' + targetPath)}"`;
  });

  // 5. content="/" → 상대경로 (OG 이미지 등)
  html = html.replace(/content="\/([^"]+)"/g, (_match, targetPath) => {
    // http://, https:// 제외
    if (
      targetPath.startsWith('http://') ||
      targetPath.startsWith('https://') ||
      targetPath.startsWith('//')
    ) {
      return `content="/${targetPath}"`;
    }
    return `content="${toRelative('/' + targetPath)}"`;
  });

  return html;
}

/**
 * CSS 경로 변환: url(/...) → url(../...)
 */
function rewriteCss(css: string, cssPath: string, rootDir: string): string {
  const cssDir = path.dirname(cssPath);

  /**
   * 절대경로를 상대경로로 변환하는 헬퍼 함수
   */
  const toRelative = (absolutePath: string): string => {
    const targetFullPath = path.join(rootDir, absolutePath);
    const relativePath = path.relative(cssDir, targetFullPath);
    return relativePath.replace(/\\/g, '/');
  };

  // 1. url(/...) → 상대경로
  css = css.replace(/url\(["']?\/([^"')]+)["']?\)/g, (_match, targetPath) => {
    // http://, https://, //, data: 제외
    if (
      targetPath.startsWith('http://') ||
      targetPath.startsWith('https://') ||
      targetPath.startsWith('//') ||
      targetPath.startsWith('data:')
    ) {
      return `url(/${targetPath})`;
    }
    return `url(${toRelative(targetPath)})`;
  });

  return css;
}

/**
 * 메인 실행 함수
 */
function run() {
  console.log('🔄 Rewriting paths to relative...');

  // HTML 파일 처리
  const htmlFiles = walkFiles(standaloneRoot, '.html');
  for (const htmlFile of htmlFiles) {
    let html = readFileSync(htmlFile, 'utf-8');
    // 빌드 시 type="module" → type="text/javascript"로 변경 : CORS 문제 해결
    html = html.split('type="module"').join('type="text/javascript"');
    const rewritten = rewriteHtml(html, htmlFile, standaloneRoot);
    writeFileSync(htmlFile, rewritten, 'utf-8');
    const relativePath = path.relative(standaloneRoot, htmlFile);
    console.log(`  ✓ ${relativePath}`);
  }

  // CSS 파일 처리
  const cssFiles = walkFiles(standaloneRoot, '.css');
  for (const cssFile of cssFiles) {
    const css = readFileSync(cssFile, 'utf-8');
    const rewritten = rewriteCss(css, cssFile, standaloneRoot);
    writeFileSync(cssFile, rewritten, 'utf-8');
    const relativePath = path.relative(standaloneRoot, cssFile);
    console.log(`  ✓ ${relativePath}`);
  }

  console.log(`✅ Standalone rewrite complete! (${htmlFiles.length} HTML, ${cssFiles.length} CSS)`);
}

run();
