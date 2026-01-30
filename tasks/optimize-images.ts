import sharp from 'sharp';
import { readdirSync, statSync, mkdirSync, copyFileSync, existsSync, unlinkSync } from 'fs';
import { watch } from 'chokidar';
import path from 'path';
import { minimatch } from 'minimatch';

/**
 * ========================================
 * 이미지 최적화 설정
 * ========================================
 */
const CONFIG = {
  // 소스 디렉토리
  sourceDirs: {
    images: './src/assets/images',
    icons: './src/assets/icons',
  },

  // 출력 디렉토리
  outputDirs: {
    images: './public/assets/images',
    icons: './public/assets/icons',
  },

  // 최적화 제외 패턴 (glob 또는 정확한 파일명)
  exclude: [
    'logo.png', // 특정 파일명 제외 예시
    '**/*.raw.*', // *.raw.png, *.raw.jpg 등
    '**/original/**', // original 폴더 내 모든 파일
    '**/*-original.*', // *-original.png 등
    '**/.DS_Store', // macOS 시스템 파일
  ],

  // JPG/JPEG 최적화 옵션
  jpeg: {
    quality: 80,
    progressive: true,
    mozjpeg: true,
  },

  // PNG 최적화 옵션
  png: {
    quality: 80,
    compressionLevel: 9,
    adaptiveFiltering: true,
  },

  // Astro 개발 서버 설정 (HMR 트리거용)
  astro: {
    host: 'localhost',
    port: 4321, // Astro 기본 포트
  },
};

// 출력 디렉토리 생성
Object.values(CONFIG.outputDirs).forEach((dir) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

/**
 * 파일이 제외 패턴에 매칭되는지 확인
 */
function isExcluded(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return CONFIG.exclude.some((pattern) => {
    // 1. 정확한 파일명 매칭 (예: 'logo.png')
    if (fileName === pattern) return true;
    // 2. Glob 패턴 매칭 (예: '**/*.raw.*')
    return minimatch(filePath, pattern) || minimatch(fileName, pattern);
  });
}

/**
 * Astro HMR 트리거 (개발 서버 새로고침)
 */
async function triggerAstroHMR() {
  try {
    const response = await fetch(`http://${CONFIG.astro.host}:${CONFIG.astro.port}/__refresh`, {
      method: 'POST',
    });
    if (response.ok) {
      console.log('🔄 Astro HMR triggered');
    }
  } catch {
    // Astro 서버가 실행 중이 아니면 무시
  }
}

/**
 * 이미지 최적화 함수
 */
async function optimizeImage(sourcePath: string, outputPath: string): Promise<void> {
  const ext = path.extname(sourcePath).toLowerCase();
  const fileName = path.basename(sourcePath);

  // 제외 패턴 체크
  if (isExcluded(sourcePath)) {
    console.log(`⏭️  Skipped (excluded): ${fileName}`);
    return;
  }

  try {
    if (ext === '.svg') {
      // SVG는 그대로 복사
      copyFileSync(sourcePath, outputPath);
      console.log(`📋 Copied: ${fileName}`);
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      // JPG/JPEG 최적화
      await sharp(sourcePath).jpeg(CONFIG.jpeg).toFile(outputPath);

      console.log(`✨ Optimized (JPEG): ${fileName}`);
    } else if (ext === '.png') {
      // PNG 최적화
      await sharp(sourcePath).png(CONFIG.png).toFile(outputPath);

      console.log(`✨ Optimized (PNG): ${fileName}`);
    } else {
      // 기타 포맷은 그대로 복사
      copyFileSync(sourcePath, outputPath);
      console.log(`📋 Copied (unsupported): ${fileName}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error);
  }
}

/**
 * 디렉토리 내 모든 이미지 처리
 */
async function processDirectory(sourceDir: string, outputDir: string): Promise<void> {
  if (!existsSync(sourceDir)) {
    console.warn(`⚠️  Source directory not found: ${sourceDir}`);
    return;
  }

  const files = readdirSync(sourceDir);

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const outputPath = path.join(outputDir, file);
    const stat = statSync(sourcePath);

    if (stat.isDirectory()) {
      // 하위 디렉토리 처리
      const subOutputDir = path.join(outputDir, file);
      if (!existsSync(subOutputDir)) {
        mkdirSync(subOutputDir, { recursive: true });
      }
      await processDirectory(sourcePath, subOutputDir);
    } else if (stat.isFile()) {
      await optimizeImage(sourcePath, outputPath);
    }
  }
}

/**
 * 모든 이미지 최적화
 */
async function optimizeAll(): Promise<void> {
  console.log('🖼️  Optimizing images...\n');

  for (const [type, sourceDir] of Object.entries(CONFIG.sourceDirs)) {
    const outputDir = CONFIG.outputDirs[type as keyof typeof CONFIG.outputDirs];
    console.log(`📁 Processing ${type}...`);
    await processDirectory(sourceDir, outputDir);
    console.log('');
  }

  console.log('✅ All images optimized!\n');
}

/**
 * 소스 경로에서 출력 경로 계산
 */
function getRelativePath(sourcePath: string): { outputPath: string } | null {
  for (const [type, sourceDir] of Object.entries(CONFIG.sourceDirs)) {
    const resolvedSourceDir = path.resolve(sourceDir);
    if (sourcePath.startsWith(resolvedSourceDir)) {
      const relativePath = path.relative(resolvedSourceDir, sourcePath);
      const outputDir = CONFIG.outputDirs[type as keyof typeof CONFIG.outputDirs];
      const outputPath = path.join(outputDir, relativePath);

      // 출력 디렉토리 생성
      const outputDirPath = path.dirname(outputPath);
      if (!existsSync(outputDirPath)) {
        mkdirSync(outputDirPath, { recursive: true });
      }

      return { outputPath };
    }
  }
  return null;
}

/**
 * Watch 모드
 */
function startWatch(): void {
  console.log('👀 Watching for changes...\n');

  const watcher = watch(Object.values(CONFIG.sourceDirs), {
    persistent: true,
    ignoreInitial: true,
    ignored: CONFIG.exclude,
  });

  watcher.on('add', async (filePath) => {
    console.log(`\n➕ File added: ${path.basename(filePath)}`);
    const relativePath = getRelativePath(filePath);
    if (relativePath) {
      await optimizeImage(filePath, relativePath.outputPath);
      await triggerAstroHMR();
    }
  });

  watcher.on('change', async (filePath) => {
    console.log(`\n🔄 File changed: ${path.basename(filePath)}`);
    const relativePath = getRelativePath(filePath);
    if (relativePath) {
      await optimizeImage(filePath, relativePath.outputPath);
      await triggerAstroHMR();
    }
  });

  watcher.on('unlink', async (filePath) => {
    console.log(`\n🗑️  File removed: ${path.basename(filePath)}`);
    const relativePath = getRelativePath(filePath);
    if (relativePath && existsSync(relativePath.outputPath)) {
      unlinkSync(relativePath.outputPath);
      console.log(`   Deleted output: ${path.basename(relativePath.outputPath)}`);
      await triggerAstroHMR();
    }
  });

  console.log('Press Ctrl+C to stop watching.\n');
}

// 실행
const args = process.argv.slice(2);
const isWatch = args.includes('--watch') || args.includes('-w');

(async () => {
  await optimizeAll();

  if (isWatch) {
    startWatch();
  }
})();
