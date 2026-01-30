# Astro 정적 HTML 프로젝트

Astro 프레임워크를 활용하여 웹 표준을 준수하는 정적 HTML 산출물을 제작하고 효율적으로 관리하기 위한 프로젝트 템플릿입니다. 대규모 퍼블리싱 프로젝트의 유지보수성을 높이고, 일관된 코드 품질과 안정적인 산출물 전달을 목표로 합니다.

---

## 🚀 주요 기능 (Key Features)

- **Astro 5**: 컴포넌트 기반 아키텍처를 통한 HTML 재사용성 및 빌드 성능 극대화
- **SCSS Architecture**: BEM 방법론 기반의 위계적인 스타일링 및 디자인 토큰 시스템
- **TypeScript**: 빌드 태스크(tasks) 및 Astro 컴포넌트 데이터 정의(frontmatter) 전용 타입 지원
- **Auto-Update Metadata**: `.astro` 파일 수정 시 `pages.json`과 대시보드 실시간 동기화
- **Standalone Build**: 모든 절대 경로를 상대 경로화하여 오프라인 구동이 가능한 패키지 생성
- **Zero-Conf CI/CD**: Git Hook(Husky)을 통한 자동 코드 품질 검토 및 포맷팅 강제

---

## 📂 상세 프로젝트 구조 (Project Structure)

```text
root/
├── public/                # 파비콘 등 최적화가 필요 없는 정적 자산
├── tasks/                 # 빌드 및 자동화 스크립트 (메타데이터 수집, 빌드 후처리 등)
├── src/
│   ├── assets/            # 에셋 원본 데이터
│   │   ├── fonts/         # 핵심 폰트 리소스
│   │   ├── icons/         # UI 아이콘 (SVG)
│   │   ├── images/        # 최적화 대상 이미지 리소스
│   │   └── data/          # pages.json (자동), token.json (디자인 데이터)
│   ├── components/        # Astro 컴포넌트 시스템
│   │   ├── layout/        # Header, Footer, GNB 등 골격 컴포넌트
│   │   ├── structure/     # Container, Grid, Section 등 레이아웃용 컴포넌트
│   │   ├── ui/            # Button, Input, Modal 등 개별 UI 요소
│   │   ├── templates/     # 특정 페이지형 템플릿
│   │   └── guides/        # 퍼블리싱 가이드용 컴포넌트
│   ├── layouts/           # 기초 Document 구조 설정 (.astro)
│   ├── pages/             # 실제 서비스 페이지 엔드포인트
│   ├── scripts/           # 클라이언트 사이드 JavaScript 로직 (Pure JS)
│   └── styles/            # SCSS 마스터 시스템 (전역 설정, 토큰, 믹스인 등)
└── standalone/            # Standalone 빌드 결과물 (배포/전달용 패키지)
```

---

## 🛠 환경 설정 (Setup)

### 1. 권장 VSCode 확장 프로그램

원활한 개발 환경과 린트 연동을 위해 아래 확장 프로그램을 반드시 설치하십시오.

- **Astro**: `.astro` 파일 문법 강조 및 인텔리센스 지원
- **ESlint**: JavaScript/TypeScript 실시간 코드 품질 검사
- **Stylelint**: SCSS/CSS 실시간 컨벤션 검사 (BEM, 중첩 제한 등)
- **Prettier**: 코드 스타일 자동 정렬 (저장 시 자동 포맷팅 설정 권장)

### 2. 설치 및 실행

```bash
pnpm install  # 의존성 설치
pnpm dev      # 로컬 개발 서버 (URL: http://localhost:4321)
```

---

## 📦 배포 및 전달 가이드

| 빌드 대상         | 실행 명령어       | 배포 위치     | 특징                                                |
| :---------------- | :---------------- | :------------ | :-------------------------------------------------- |
| **운영 서버**     | `pnpm build`      | `dist/`       | `/assets/...` 식의 절대 경로 배포                   |
| **배포용 패키지** | `pnpm standalone` | `standalone/` | `./assets/...` 식의 상대 경로 배포 (로컬 구동 가능) |

---

## 💻 개발 워크플로우 (Development Workflow)

### 1. 신규 페이지 작성 가이드

모든 작업 페이지는 `src/pages/` 하위에 위치하며, 파일 상단에 반드시 `pageMeta`를 선언해야 합니다.

```astro
---
// src/pages/category/sub-page.astro
import type { Meta } from '@scripts/type/meta';
import Layout from '@layouts/Layout.astro';

export const pageMeta: Meta = {
  id: 'PG-2000', // 페이지 고유 ID
  title: '페이지 제목', // 브라우저 타이틀 및 대시보드 표기명
  author: '홍길동', // 작업 담당자
  status: 'progress', // 현재 상태 (todo | progress | complete | test)
};
---

<Layout pageMeta={pageMeta}>
  <main>
    <!-- 본문 컨텐츠 -->
  </main>
</Layout>
```

### 2. 스타일 작성 규칙 (Kebab-case BEM)

이 프로젝트는 BEM의 구조적 위계는 따르되, 코드의 간결함을 위해 `__`나 `--` 같은 기호 대신 **kebab-case**와 **클래스 결합(Multi-class)** 방식을 사용합니다.

- **명명 규칙**: 모든 클래스명, SCSS 변수, 믹스인은 **kebab-case**를 사용합니다.
- **Block의 고유성**: 각 컴포넌트의 최상위 단위인 **Block** 클래스명은 프로젝트 전역에서 중복되지 않는 **고유한(Unique) 이름**을 가져야 합니다. 이는 예기치 않은 스타일 오염(Style Pollution)을 방지하고 컴포넌트 간의 완벽한 독립성을 보장하기 위함입니다.
- **중첩 제한**: 명시도 관리와 가독성을 위해 **최대 2단계**까지만 중첩을 허용합니다. (Stylelint 강제)
- **Modifier 사용**: `&--modifier` 형태 대신 `&.modifier`와 같이 클래스를 결합하여 스타일을 정의합니다.

```scss
.button {
  display: inline-flex;
  align-items: center;

  .button-icon {
    width: 20px;
    height: 20px;
  }

  &.primary {
    background-color: blue;
    color: #fff;
  }
}
```

---

## 🔍 코드 품질 관리 (Linting & QA Policy)

Git Commit 시 자동으로 수행되는 검사 항목입니다. 위반 사항 발생 시 커밋이 차단됩니다.

### 상세 린트 체크 항목 (Linting Standards)

협업 시 코드의 일관성과 품질을 유지하기 위해 아래 규칙들이 엄격하게 적용됩니다.

#### 1. ESLint (Script & Logic)

| 규칙명              | 체크 내용                                      | 위반 시 조치 |
| :------------------ | :--------------------------------------------- | :----------: |
| `no-console`        | `console.log` 사용 금지 (전체 영역 공통)       |  오류 차단   |
| `@ts-es/no-any`     | `any` 타입 사용 금지 (Frontmatter, Tasks 전용) |  오류 차단   |
| `no-unused-vars`    | 사용하지 않는 변수 금지 (\_ 시작 예외)         |  오류 차단   |
| `astro/recommended` | Astro 컴포넌트 모범 사례 및 문법 검사          |  오류 차단   |

#### 2. Stylelint (SCSS & CSS)

| 규칙명                                           | 체크 내용                                  | 위반 시 조치 |
| :----------------------------------------------- | :----------------------------------------- | :----------: |
| `max-nesting-depth`                              | **중첩 깊이 2단계 제한** (BEM 준수 필수)   |  오류 차단   |
| `selector-max-id`                                | **ID 선택자(`#`) 사용 절대 금지**          |  오류 차단   |
| `selector-class-pattern`                         | 클래스명은 반드시 **kebab-case** 준수      |  오류 차단   |
| `scss/at-rule-no-unknown`                        | 알 수 없는 `@` 규칙(at-rule) 사용 금지     |  오류 차단   |
| `color-named`                                    | 키워드 색상명(`red`, `blue` 등) 사용 금지  |  오류 차단   |
| `color-hex-length`                               | HEX 코드는 **단축형**(`short`) 사용 강제   |  오류 차단   |
| `length-zero-no-unit`                            | 값이 0인 경우 단위(`px`, `%` 등) 생략 필수 |  오류 차단   |
| `no-duplicate-properties`                        | 동일 블록 내 중복 속성 선언 금지           |  오류 차단   |
| `declaration-block-single-line-max-declarations` | 한 줄에 1개의 속성만 선언 (가독성 확보)    |  오류 차단   |

#### 3. Prettier (Formatting)

| 항목               | 설정값             | 비고                             |
| :----------------- | :----------------- | :------------------------------- |
| **Tab Width**      | 2 Space            | 들여쓰기 깊이 통일               |
| **Quotes**         | Single Quote (`'`) | JS/TS(Single), SCSS/HTML(Double) |
| **Semicolon**      | Always (`true`)    | 문장 끝 세미콜론 필수            |
| **Trailing Comma** | `es5`              | 객체/배열 마지막 항목 콤마 유지  |
| **Whitespace**     | `ignore`           | HTML 공백 민감도 최적화          |
| **Astro Parsing**  | Enabled            | `.astro` 전용 구문 포맷팅        |

## 🌐 브라우저 지원 (Browser Support)

| 브라우저   | 최소 지원 버전 | 출시일     |
| :--------- | :------------- | :--------- |
| Chrome     | 80+            | 2020년 2월 |
| Edge       | 80+            | 2020년 2월 |
| Safari     | 13.1+          | 2020년 3월 |
| iOS Safari | 13.4+          | 2020년 3월 |
