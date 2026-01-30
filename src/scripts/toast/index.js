import { KEYS } from '../constants';

const TOAST_ROOT = 'data-toast-root';
const TOAST_CONTAINER = 'data-toast-container';
const TOAST_INSTANCE = 'data-toast-instance';
const TOAST_TIMEOUT = 5000;

const TOAST_STACK = 'toast-stack';
const DATA_TOAST_INSTANCE = 'data-toast-instance';
const DATA_TOAST_CLOSE_BTN = 'data-toast-close-btn';
const CLASS_TOAST_OUT = 'toast-out';

// RESPONSE MESSAGE
const RESPONSE_MESSAGE = {
  TIMEOUT: 'timeout',
  MANUAL: 'manual',
  CLOSE_BUTTON: 'close-button',
  OVERFLOW: 'overflow',
  HIDE_ALL_TOAST: 'hideAllToast',
};

export class Toast {
  static animate = true;
  static maxLen = 4;

  static show(
    message,
    variant = 'primary',
    size = 'md',
    animate = this.animate,
    duration = TOAST_TIMEOUT,
    hasClosing = false
  ) {
    return new Promise((resolve) => {
      const containerDom = `
        <div ${TOAST_ROOT} aria-atomic="false">
          <div ${TOAST_CONTAINER}>
            <div class="${TOAST_STACK}"></div>
          </div>
        </div>
      `;

      let container = document.querySelector(`[${TOAST_CONTAINER}]`);
      if (!container) {
        const root = document.createElement('div');
        root.innerHTML = containerDom;
        document.body.appendChild(root.children[0]);
        container = document.querySelector(`[${TOAST_CONTAINER}]`);
      }

      let _animate = animate;
      // 민감 사용자 애니메이션 의존성을 제거
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        _animate = false;
      }

      const toastDom = `
        <div role="status" ${TOAST_INSTANCE} class="toast toast-${variant} toast-${size} ${_animate ? 'toast-animate' : ''}">
          <p>
            ${message}
          </p>
          ${
            hasClosing
              ? `<button type="button" class="toast-close-btn" ${DATA_TOAST_CLOSE_BTN} aria-label="알림 닫기" >
                   닫기
                   <i class="icon icon-close" aria-hidden="true"></i>
                 </button>`
              : ''
          }
        </div>
      `;

      const instanceDom = document.createElement('div');
      instanceDom.innerHTML = toastDom;
      const toast = instanceDom.children[0];

      const remains = document.querySelectorAll(`[${TOAST_INSTANCE}]:not(.${CLASS_TOAST_OUT})`);
      remains.forEach((remain) => {
        remain.removeAttribute('aria-live');
      });
      toast.setAttribute('aria-live', 'polite');

      container.querySelector(`.${TOAST_STACK}`).appendChild(toast);

      let resolved = false;
      const done = (reason) => {
        if (resolved) return;
        resolved = true;
        resolve({ reason });
      };

      // ===== 제거 로직 =====
      toast.removeToast = function (reason = RESPONSE_MESSAGE.MANUAL) {
        if (toast.classList.contains(CLASS_TOAST_OUT)) return;

        if (_animate) {
          toast.addEventListener(
            'animationend',
            () => {
              removeToast(reason);
            },
            { once: true }
          );
          toast.classList.add(CLASS_TOAST_OUT);
        } else {
          removeToast(reason);
        }
      };

      function removeToast(reason) {
        toast.remove();
        done(reason);

        const remain = document.querySelectorAll(`[${TOAST_INSTANCE}]:not(.${CLASS_TOAST_OUT})`);

        if (remain.length === 0) {
          document.querySelector(`[${TOAST_ROOT}]`)?.remove();
          container = null;
        }
      }

      // ===== 자동 닫힘 =====
      const timer = setTimeout(() => {
        toast.removeToast(RESPONSE_MESSAGE.TIMEOUT);
      }, duration);
      toast.timer = timer;

      // ===== maxLen 초과 처리 =====
      const allToast = document.querySelectorAll(`[${TOAST_INSTANCE}]:not(.${CLASS_TOAST_OUT})`);
      if (allToast.length > this.maxLen) {
        allToast[0].removeToast('overflow');
      }

      // ===== 닫기 버튼 =====
      toast.querySelector(`[${DATA_TOAST_CLOSE_BTN}]`)?.addEventListener(
        'click',
        () => {
          clearTimeout(timer);
          toast.removeToast(RESPONSE_MESSAGE.CLOSE_BUTTON);
        },
        { once: true }
      );
    });
  }

  static hideLastToast() {
    const allToast = document.querySelectorAll(`[${TOAST_INSTANCE}]:not(.${CLASS_TOAST_OUT})`);
    const last = allToast[allToast.length - 1];
    last?.removeToast(RESPONSE_MESSAGE.HIDE_LAST_TOAST);
  }

  static hideAllToast() {
    const allToast = document.querySelectorAll(`[${TOAST_INSTANCE}]:not(.${CLASS_TOAST_OUT})`);
    allToast.forEach((toast) => toast.removeToast(RESPONSE_MESSAGE.HIDE_ALL_TOAST));
  }
}

// 전역 이벤트 (아이콘 클릭 등)
document.addEventListener('click', (e) => {
  const closeBtn = e.target.closest(`[${DATA_TOAST_CLOSE_BTN}]`);
  if (!closeBtn) return;
  const toast = closeBtn.closest(`[${TOAST_INSTANCE}]`);
  toast?.removeToast(RESPONSE_MESSAGE.CLOSE_BUTTON);
});
document.addEventListener(
  'focus',
  (e) => {
    const toast = e.target.closest(`[${TOAST_INSTANCE}]`);
    if (!toast) return;
    const timer = toast.timer;
    clearTimeout(timer);
  },
  { capture: true }
);
document.addEventListener(
  'focusout',
  (e) => {
    const toast = e.target.closest(`[${TOAST_INSTANCE}]`);
    if (!toast) return;
    const timer = setTimeout(() => {
      toast.removeToast(RESPONSE_MESSAGE.TIMEOUT);
    }, TOAST_TIMEOUT);
    toast.timer = timer;
  },
  { capture: true }
);
document.addEventListener('keydown', (e) => {
  if (e.key !== KEYS.ESCAPE) return;

  const activeDialog = document.querySelector('[role="dialog"][aria-modal="true"]');
  if (activeDialog && activeDialog.contains(document.activeElement)) {
    // 모달이 활성화되어 있으면 토스트 ESC 처리 중단
    return;
  }

  // 토스트 ESC 처리
  const allToast = document.querySelectorAll(`[${DATA_TOAST_INSTANCE}]:not(.${CLASS_TOAST_OUT})`);
  const lastToast = allToast[0];
  if (lastToast) {
    lastToast.removeToast();
  }
});
window.Toast = Toast;
