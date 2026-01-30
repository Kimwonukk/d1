import { getRandomId } from '../utils/domUtils';
import { KEYS } from '../constants';

const TAB = 'data-tab';
const TAB_TRIGGER = 'data-tab-trigger';
const TAB_CONTENT = 'data-tab-content';
const TAB_CONTROLS = 'data-tab-controls';

function activeTab(tab, triggerBtn) {
  const tabControls = tab?.querySelector(`:scope > [${TAB_CONTROLS}]`);

  if (!tabControls) return;
  const tabTriggers = tabControls.querySelectorAll(`[${TAB_TRIGGER}]`);

  tabTriggers.forEach((trigger) => {
    trigger.setAttribute('aria-expanded', 'false');
    trigger.classList.remove('active');
    const _controlId = trigger.getAttribute('aria-controls');
    if (_controlId) {
      const content = document.getElementById(_controlId);
      content?.setAttribute('inert', '');
      content?.setAttribute('aria-hidden', 'true');
      content?.classList.remove('active');
    }
  });
  triggerBtn.setAttribute('aria-expanded', 'true');
  triggerBtn.classList.add('active');
  const controlId = triggerBtn.getAttribute('aria-controls');

  if (!controlId) return;
  const activeContent = document.getElementById(controlId);
  if (!activeContent) return;
  activeContent.removeAttribute('inert');
  activeContent.setAttribute('aria-hidden', 'false');
  activeContent.classList.add('active');
}
function init(tab) {
  const tabContents = tab?.querySelectorAll(`:scope > [${TAB_CONTENT}]`);
  const tabControls = tab?.querySelector(`:scope > [${TAB_CONTROLS}]`);
  if (!tabControls) return;
  const tabTriggers = tabControls.querySelectorAll(`[${TAB_TRIGGER}]`);
  // if (tabTriggers.length !== tabContents.length) return;
  tabTriggers.forEach((trigger, index) => {
    trigger.setAttribute('data-tab-index', index.toString());
    let id = trigger.getAttribute('id');
    const randomId = getRandomId();
    if (id === null) {
      id = 'tab-trigger-' + randomId + index;
      trigger.setAttribute('id', id);
    }
    let tabContent;
    if (tabContents.length === 0) {
      const connectId = trigger.getAttribute('id');
      if (!connectId || connectId === '') {
        throw new Error(`TabContent 컴퍼넌트가 Tab 컨테이너 외부에 있을 경우 
          [${TAB_TRIGGER}] 속성 값은 필수 값입니다. 
          TabTrigger의 [${TAB_TRIGGER}] 값과 연결되는 
          TabContent의 [${TAB_CONTENT}] 값이 일치하는 
          유니크한 문자열이 동일하게 들어가야 합니다.\n`);
      }
      const confirmTriggers = document.querySelectorAll(
        `[${TAB_TRIGGER}="${connectId}"]`
      );
      if (confirmTriggers.length > 1) {
        throw new Error(`TabTrigger의 [${TAB_TRIGGER}] 값은 유니크 해야 합니다.
          TabTrigger의 [${TAB_TRIGGER}] 값은
          연결되는 TabContent 하나만 [${TAB_CONTENT}]의 속성과 일치하며 그 외에는 일치 할수 없습니다. 
        `);
      }
      const confirmContent = document.querySelectorAll(
        `[${TAB_CONTENT}="${connectId}"]`
      );
      if (confirmContent.length > 1) {
        throw new Error(`TabContent의 [${TAB_CONTENT}] 값은 유니크 해야 합니다.
          모든 TabContent의 [${TAB_CONTENT}] 속성은 중복 될 수 없습니다.
        `);
      }

      tabContent = document.querySelector(`[${TAB_CONTENT}="${connectId}"]`);
      if (!tabContent) {
        throw new Error(`[${TAB_CONTENT}="${connectId}"] 선택자를 지닌
          TabContent를 찾을 수 없습니다. TabTrigger의 [${TAB_TRIGGER}] 속성과 일치하는 컴퍼넌트가 필요합니다.
        `);
      }
    } else {
      tabContent = tabContents[index];
    }
    if (!tabContent) return;

    let contentId = tabContent.getAttribute('id');
    if (contentId === null) {
      contentId = 'tab-content-' + randomId + index;
      tabContent.setAttribute('id', contentId);
    }

    trigger.setAttribute('aria-controls', tabContent.id);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('role', 'tab');
    tabContent.setAttribute('role', 'tabpanel');
    tabContent.setAttribute('aria-labelledby', trigger.id);
    tabContent.setAttribute('id', contentId);
  });

  const defaultTrigger =
    tabControls.querySelector(`[${TAB_TRIGGER}].active`) || tabTriggers[0];
  activeTab(tab, defaultTrigger);
}
function initTab() {
  document.querySelectorAll(`[${TAB}]`).forEach((tab) => {
    init(tab);
  });
}

document.addEventListener('DOMContentLoaded', initTab);
document.addEventListener('click', (e) => {
  const triggerBtn = e.target?.closest(`[${TAB_TRIGGER}]`);
  if (triggerBtn) {
    const tab = triggerBtn.closest(`[${TAB}]`);
    if (!tab) return;
    activeTab(tab, triggerBtn);
  }
});

// 접근서 좌우키 순환
document.addEventListener('keydown', (e) => {
  const target = document.activeElement;
  const tab = target.closest(`[${TAB}]`);
  if (!tab) return;
  const activeTarget = target.closest(`[${TAB_TRIGGER}]`);
  const nodes = [
    ...tab.querySelectorAll(`:scope > [${TAB_CONTROLS}] [${TAB_TRIGGER}]`),
  ];
  if (!activeTarget) return;
  const index = nodes.indexOf(activeTarget);
  const len = nodes.length;
  if (e.key === KEYS.ARROW_RIGHT) {
    const nextIndex = (index + 1) % len;
    const nextTarget = nodes[nextIndex];
    e.preventDefault();
    // activeTab(tab, nextTarget);
    nextTarget.focus();
  } else if (e.key === KEYS.ARROW_LEFT) {
    const prevIndex = (index + len - 1) % len;
    const prevTarget = nodes[prevIndex];
    // activeTab(tab, prevTarget);
    prevTarget.focus();
    e.preventDefault();
  }
});

window.initTab = initTab;
