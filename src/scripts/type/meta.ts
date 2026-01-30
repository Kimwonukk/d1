/**
 * 페이지 메타데이터 타입 정의
 */

export interface Meta {
  /** 페이지 ID (예: ta-0000) */
  id: string;

  /** 페이지 제목 */
  title: string;

  /** 페이지 경로 (내부: /kr/ta/ta-0000, 외부: https://...) */
  path?: string;

  /** 작업자 */
  author?: string;

  /** 작업 상태 ('todo' | 'progress' | 'complete' | 'test') */
  status?: 'todo' | 'progress' | 'complete' | 'test';

  /** 외부 링크 여부 (JSON에서 false면 생략) */
  external?: boolean;
}

export interface PagesData {
  pages: PageItem[];
  generated: string;
}

export interface PageItem {
  id: string;
  title: string;
  path: string;
  author: string;
  status?: 'todo' | 'progress' | 'complete' | 'test';
  external?: boolean;
}
