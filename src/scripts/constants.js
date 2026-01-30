/**
 * 전역 상수
 */

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

export const ACTIVE_CLASS = 'active';
export const DEACTIVE_CLASS = 'deactive';

// 애니메이션 지속 시간 (밀리초)
export const ANIMATION_DURATION = {
  fast: 150,   // 빠른 전환 (0.15초)
  base: 250,   // 기본 전환 (0.25초)
  slow: 350,   // 느린 전환 (0.35초)
};

export const KEYS = {
  TAB: 'Tab',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
};
