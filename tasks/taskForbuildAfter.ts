/**
 * 빌드 후 불필요한 파일 제거
 * 
 * renderers.mjs: Astro가 생성하는 서버 렌더링 관련 파일로,
 * 정적 빌드에서는 필요하지 않아 제거합니다.
 */
import fs from 'fs';
import path from 'path';

const file1 = path.resolve('dist/renderers.mjs');
if (fs.existsSync(file1)) fs.unlinkSync(file1);

const file2 = path.resolve('standalone/renderers.mjs');
if (fs.existsSync(file2)) fs.unlinkSync(file2);
