/**
 * 페이지 메타 정보 자동 수집 및 pages.json 생성
 *
 * 실행 방법:
 *   pnpm tsx tasks/generate-pages.ts
 *
 * 생성 파일:
 *   src/assets/data/pages.json
 */

import { writeFile, readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import chokidar from 'chokidar';
import type { Meta, PagesData, PageItem } from '../src/scripts/type/meta';

/**
 * .astro 파일에서 pageMeta export 추출
 */
async function extractMeta(filePath: string): Promise<Meta | null> {
  try {
    const content = await readFile(filePath, 'utf-8');

    // export const pageMeta = {...} 찾기
    // 정규식 설명:
    // - export\s+const\s+pageMeta: export const pageMeta 선언 찾기
    // - [:\s]*Meta\s*=: 타입 선언 (선택적, ': Meta' 또는 생략 가능)
    // - ({[\s\S]*?}): 객체 리터럴 캡처 (non-greedy, 여러 줄 포함)
    const metaMatch = content.match(
      /export\s+const\s+pageMeta[:\s]*Meta\s*=\s*({[\s\S]*?});/
    );

    if (!metaMatch) return null;

    // TypeScript 객체 리터럴을 JSON으로 변환
    // 1. 작은따옴표를 큰따옴표로 변환
    // 2. 키를 따옴표로 감싸기 (JSON 형식 요구사항)
    // 3. trailing comma 제거 (JSON에서 허용 안 됨)
    const metaStr = metaMatch[1]
      .replace(/'/g, '"')
      .replace(/(\w+):/g, '"$1":')
      .replace(/,\s*}/g, '}');

    const meta = JSON.parse(metaStr) as Meta;

    // path 자동 생성 (명시되지 않은 경우)
    // ID 형식: {section}-{number} (예: ta-0000, tb-1001)
    // 생성 경로: /kr/{section}/{id} (예: /kr/ta/ta-0000)
    if (!meta.path) {
      const section = meta.id.match(/^([a-z]+)-/)?.[1] || '';
      meta.path = `/kr/${section}/${meta.id}`;
    }

    // 명시적 필드로 정규화
    return {
      id: meta.id,
      title: meta.title,
      path: meta.path,
      author: meta.author,
      status: meta.status,
      external: meta.external ?? false,
    };
  } catch (error) {
    console.warn(
      `⚠️  Failed to extract meta from ${filePath}:`,
      (error as Error).message
    );
    return null;
  }
}

/**
 * 페이지 목록용 데이터 생성
 */
function generatePagesData(meta: Meta): PageItem {
  const result: PageItem = {
    id: meta.id,
    title: meta.title, // 페이지 제목 사용
    path: meta.path || '',
    author: meta.author || 'unknown',
  };

  // 선택적 필드
  if (meta.status) result.status = meta.status;
  if (meta.external) result.external = meta.external;

  return result;
}

/**
 * 디렉토리 재귀적으로 탐색하여 .astro 파일 찾기
 */
async function findAstroFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        files.push(...(await findAstroFiles(fullPath)));
      } else if (entry.endsWith('.astro')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(
      `⚠️  Failed to read directory ${dir}:`,
      (error as Error).message
    );
  }

  return files;
}

/**
 * 정적 페이지 수집
 */
async function collectStaticPages(): Promise<Meta[]> {
  const pagesDir = join(process.cwd(), 'src/pages');
  const astroFiles = await findAstroFiles(pagesDir);

  const pages: Meta[] = [];

  for (const filePath of astroFiles) {
    // index.astro 제외
    if (filePath.includes('/index.astro')) continue;

    const meta = await extractMeta(filePath);
    if (meta) {
      pages.push(meta);
    }
  }

  return pages;
}

/**
 * 메인 함수
 */
async function main() {
  const isWatch = process.argv.includes('--watch');

  async function run() {
    console.log('🔍 Collecting pages...');
    try {
      // 1. 정적 페이지 수집
      const staticPages = await collectStaticPages();
      console.log(`✅ Found ${staticPages.length} static pages`);

      // 2. ID 기준 정렬
      staticPages.sort((a, b) => a.id.localeCompare(b.id));

      console.log(`✅ Total pages: ${staticPages.length}`);

      // pages.json 생성
      const pagesData: PagesData = {
        pages: staticPages.map(generatePagesData),
        generated: new Date().toISOString(),
      };

      await writeFile(
        join(process.cwd(), 'src/assets/data/pages.json'),
        JSON.stringify(pagesData, null, 2)
      );

      console.log('✅ Generated pages.json');
    } catch (error) {
      console.error('❌ Error during generation:', error);
    }
  }

  await run();

  if (isWatch) {
    console.log('👀 Watching for changes in src/pages...');
    const watcher = chokidar.watch('src/pages', {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on('all', async (event, path) => {
      if (path.endsWith('.astro')) {
        console.log(`📄 File ${path} changed (${event}), regenerating...`);
        await run();
      }
    });
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
