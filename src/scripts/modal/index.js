import { getIncrementZ } from '../utils/domUtils';
import { getRandomId } from '../utils/domUtils';
import { KEYS, ACTIVE_CLASS, DEACTIVE_CLASS } from '../constants';

const DATA_MODAL_TRIGGER = 'data-modal-trigger';
const DATA_MODAL_CLOSE = 'data-modal-close';
const CLASS_MODAL_HEADER = 'modal-header';
const CLASS_MODAL_CONTENT = 'modal-content';
const DATA_MODEL = 'data-modal';
const CLOSE_EVENT = 'modal-close';
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let focusTarget = null;

function clickHandler(e) {
  const openBtn = e.target?.closest(`[${DATA_MODAL_TRIGGER}]`);
  const closeBtn = e.target?.closest(`[${DATA_MODAL_CLOSE}]`);
  const overlay = e.target?.closest(`[${DATA_MODEL}="overlay"]`);

  if (openBtn) {
    openModal(openBtn.getAttribute(DATA_MODAL_TRIGGER));
    focusTarget = openBtn;
  }

  if (closeBtn) {
    const modal = closeBtn.closest(`[${DATA_MODEL}]`);
    if (modal) closeModal(modal);
  }

  if (overlay && e.target === overlay) {
    closeModal(overlay);
  }
}
function a11yAttribute(modal) {
  // 누적된 모달(모달이 여러개)일 경우 기존의 aria-model 속성들 삭제
  const arialModals = document.querySelectorAll(
    `[${DATA_MODEL}].${ACTIVE_CLASS}[aria-modal="true"]`
  );
  arialModals.forEach((modal) => {
    modal.removeAttribute('aria-modal');
  });
  // 활성화된 모달에 aria-model 속성 추가
  modal.setAttribute('aria-modal', 'true');

  let modalid = modal.getAttribute('id');
  const randomId = getRandomId();
  if (!modalid) {
    modalid = `modal-${randomId}`;
    modal.setAttribute('id', modalid);
  }
  const headerDom = modal.querySelector(`.${CLASS_MODAL_HEADER}`);

  let headerDomId = headerDom?.getAttribute('id');
  if (!headerDomId) {
    headerDomId = `${modalid}-header`;
    headerDom?.setAttribute('id', headerDomId);
  }
  if (modal.getAttribute('aria-labelledby') === null) {
    modal.setAttribute('aria-labelledby', headerDomId);
  }

  const contentDom = modal.querySelector(`.${CLASS_MODAL_CONTENT}`);
  let contentDomId = contentDom?.getAttribute('id');
  if (!contentDomId) {
    contentDomId = `${modalid}-content`;
    contentDom?.setAttribute('id', contentDomId);
  }
  if (modal.getAttribute('aria-describedby') === null) {
    modal.setAttribute('aria-describedby', contentDomId);
  }
}
function keydownHandler(e) {
  const modals = document.querySelectorAll(`[${DATA_MODEL}].${ACTIVE_CLASS}`);

  if (modals.length === 0) return;
  const modal = modals[modals.length - 1];

  if (e.key === KEYS.ESCAPE) {
    closeModal(modal);
  } else if (e.key === KEYS.TAB) {
    const focusableElements = modal.querySelectorAll(FOCUSABLE_SELECTOR);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }
}

function init() {
  document.addEventListener('click', clickHandler);

  // PC 관련 탭 순환 코드
  document.addEventListener('keydown', keydownHandler);
}
init();

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  if (modal.classList.contains(ACTIVE_CLASS)) return;
  modal.classList.add(ACTIVE_CLASS);

  // 모달 팝업 최종 z-index 관리
  modal.style.zIndex = getIncrementZ().toString();

  a11yAttribute(modal);
  // 모달 팝업 헤더에 포커스
  modal.querySelector(`.${CLASS_MODAL_HEADER}`)?.focus();
}

function closeModal(modal) {
  // 모달 클로징 후 관련 접근성 및 z-index 복원
  modal.querySelector('.modal')?.removeAttribute('aria-modal');
  if (modal.classList.contains('animation')) {
    modal.addEventListener(
      'animationend',
      function () {
        modal.classList.remove(ACTIVE_CLASS);
        modal.classList.remove(DEACTIVE_CLASS);
        modal.style.removeProperty('z-index');
      },
      { once: true }
    );
    modal.classList.add(DEACTIVE_CLASS);
  } else {
    if (modal?.classList.contains(ACTIVE_CLASS)) modal.classList.remove(ACTIVE_CLASS);
    modal.style.removeProperty('z-index');
  }
  // 모달 클로징 후 포커스 복귀
  if (focusTarget) focusTarget.focus();

  // 모달이 누적되었을 경우 활성화된 마지막 모달에서만 탭 순환이 돌 수 있도록 수정
  const arialModals = document.querySelectorAll(
    `[${DATA_MODEL}].${ACTIVE_CLASS}[aria-modal="true"]`
  );
  if (arialModals.length > 0) {
    arialModals[arialModals.length - 1].setAttribute('aria-modal', 'true');
  }

  // 모달 클로징 이벤트 발생(다른 동기 이벤트 또는 모달 클로징 후 복귀할 버튼이 특정일 경우 이용)
  modal.dispatchEvent(new CustomEvent(CLOSE_EVENT));
}
export { a11yAttribute };
