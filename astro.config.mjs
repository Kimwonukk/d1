// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// 빌드 모드 구분
// - unified: 모든 CSS/JS를 하나의 파일로 통합 (납품용)
// - default: 일반 빌드 (개발/배포용)
const isUnifiedBuild = process.env.BUILD_MODE === 'unified';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://your-domain.com',
  devToolbar: {
    enabled: false,
  },

  build: {
    format: 'file', // 페이지를 .html 파일로 생성 (예: page.html)
    inlineStylesheets: 'never', // CSS 파일 분리
    assets: isUnifiedBuild ? 'assets' : '_astro',
  },

  compressHTML: false, // HTML 압축 비활성화
  trailingSlash: 'never',

  server: {
    open: true, // 개발 서버 시작 시 브라우저 자동 열기
  },

  integrations: [mdx()],

  image: {
    // Sharp 서비스 사용 (PNG 원본 포맷 유지하며 압축)
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // 모든 SCSS 파일에 자동 import (@use 사용)
          additionalData: `
            @use "src/styles/mixins" as *;
          `,
        },
      },
    },

    build: {
      // Unified 빌드 시 설정
      ...(isUnifiedBuild && {
        // 모든 에셋을 외부 파일로 (인라인 안 함)
        assetsInlineLimit: 0,

        rollupOptions: {
          output: {
            // 모든 JS를 하나의 파일로 통합
            manualChunks: () => 'common',

            // 파일 타입별 폴더 분리
            assetFileNames: (assetInfo) => {
              const name = assetInfo.name || '';

              // CSS 파일
              if (name.endsWith('.css')) {
                return 'css/common.css';
              }

              // 이미지 파일 - 소스 경로에 따라 분리
              if (name.match(/\.(png|jpe?g|gif|svg|webp|avif)$/i)) {
                // assetInfo.source를 통해 원본 경로 확인
                // src/assets/images/ → assets/images/
                // src/assets/icons/ → assets/icons/
                if (assetInfo.originalFileName?.includes('/images/')) {
                  return 'assets/images/[name][extname]';
                } else if (assetInfo.originalFileName?.includes('/icons/')) {
                  return 'assets/icons/[name][extname]';
                }
                // 기본값 (assets/images로 분류)
                return 'assets/images/[name][extname]';
              }

              // 폰트, 기타 파일
              return 'assets/[name][extname]';
            },

            // JS 파일명
            entryFileNames: 'js/common.js',
            chunkFileNames: 'js/common.js',
          },
        },

        // CSS 코드 스플리팅 비활성화 (하나로 통합)
        cssCodeSplit: false,

        // 압축 비활성화 (읽기 쉽게)
        minify: false,
      }),
    },

    resolve: {
      alias: {
        '@': '/src',
        '@ui': '/src/components/ui',
        '@structure': '/src/components/structure',
        '@layout': '/src/components/layout',
        '@templates': '/src/components/templates',
        '@layouts': '/src/layouts',
        '@styles': '/src/styles',
        '@scripts': '/src/scripts',
        '@assets': '/src/assets',
        '@images': '/assets/images',
        '@icons': '/assets/icons',
        '@fonts': '/src/assets/fonts',
        '@data': '/src/assets/data',
        '@tasks': '/tasks',
        '@components': '/src/components',
      },
    },
  },
});
