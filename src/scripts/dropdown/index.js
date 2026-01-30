import { getRandomId } from '../utils/domUtils';
import { KEYS, ACTIVE_CLASS } from '../constants';

const DROPDOWN = 'data-dropdown';
const DROPDOWN_TRIGGER = 'data-dropdown-trigger';
const DROPDOWN_LIST = 'data-dropdown-list';
const DROPDOWN_ITEM = 'data-dropdown-item';

const ALIGN_DYNAMIC = 'dynamic';
const ALIGN_DYNAMIC_HUG = 'dynamic-hug';
const ALIGN_CLASSES = [
  'bottom-left',
  'bottom-right',
  'bottom-center',
  'top-left',
  'top-right',
  'top-center',
  'top-hug',
  'off-right',
];
(function () {
  function clickHandler(e) {
    const trigger = e.target?.closest(`[${DROPDOWN_TRIGGER}]`);
    document.querySelectorAll(`[${DROPDOWN_TRIGGER}]`).forEach((mem) => {
      if (trigger !== mem) {
        mem.classList.remove(ACTIVE_CLASS);
        mem.setAttribute('aria-expanded', 'false');
      }
    });

    if (trigger) {
      const dropdown = trigger?.closest(`[${DROPDOWN}]`);
      layoutSet(dropdown);
      trigger.classList.toggle(ACTIVE_CLASS);

      trigger?.setAttribute(
        'aria-expanded',
        trigger.classList.contains(ACTIVE_CLASS) ? 'true' : 'false'
      );
      dynamicAlignSet(dropdown, trigger);
    }
  }
  document.addEventListener('click', clickHandler);
})();
function ariaSet(dropdown) {
  const randomId = getRandomId();
  const trigger = dropdown.querySelector(`[${DROPDOWN_TRIGGER}]`);
  const menubox = dropdown.querySelector(`[${DROPDOWN_LIST}]`);
  if (!trigger || !menubox) return;
  let id = trigger.getAttribute('id');
  trigger.setAttribute('aria-expanded', 'false');
  if (!id) {
    id = `dropdown-trigger-${randomId}`;
    trigger.setAttribute('id', id);
  }

  let menuId = menubox?.getAttribute('id');
  if (!menuId) {
    menuId = `dropdown-menu-${randomId}`;
    menubox?.setAttribute('id', menuId);
  }
  if (
    !trigger.getAttribute('aria-controls') ||
    trigger.getAttribute('aria-controls') === ''
  ) {
    trigger.setAttribute('aria-controls', menuId);
  }
  if (
    !menubox?.getAttribute('aria-labelledby') ||
    menubox?.getAttribute('aria-labelledby') === ''
  ) {
    menubox?.setAttribute('aria-labelledby', id);
  }
}
function dynamicAlignSet(dropdown) {
  if (
    !(
      dropdown.classList.contains(ALIGN_DYNAMIC) ||
      dropdown.classList.contains(ALIGN_DYNAMIC_HUG)
    )
  )
    return;
  const lists = dropdown.querySelector(`[${DROPDOWN_LIST}]`);
  ALIGN_CLASSES.forEach((align) => {
    if (dropdown.classList.contains(align)) {
      dropdown.classList.remove(align);
    }
  });
  const prevClass = dropdown.getAttribute('class');
  const len = ALIGN_CLASSES.length;
  for (let i = 0; i < len; i++) {
    const align = ALIGN_CLASSES[i];
    dropdown.classList.add(align);

    const rect = lists.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    if (
      rect.right <= viewportWidth &&
      rect.left >= 0 &&
      rect.bottom <= viewportHeight &&
      rect.top >= 0
    ) {
      return;
    } else {
      dropdown.setAttribute('class', prevClass);
    }
  }
}
function layoutSet(dropdown) {
  const GAP = 4;
  const trigger = dropdown.querySelector(`[${DROPDOWN_TRIGGER}]`);
  const menubox = dropdown.querySelector(`[${DROPDOWN_LIST}]`);
  if (!trigger || !menubox) return;
  menubox.style.removeProperty('margin-left');
  if (dropdown.classList.contains('off-right')) {
    menubox.style.marginLeft = `${trigger.offsetWidth + GAP}px`;
  }
}
function initDropdown() {
  document.querySelectorAll(`[${DROPDOWN}]`).forEach((dropdown) => {
    ariaSet(dropdown);
  });
}
document.addEventListener('DOMContentLoaded', initDropdown);

// 접근성 드랍다운 순환 처리
document.addEventListener('keydown', (e) => {
  const target = document.activeElement;

  const activeTarget = target.closest(`[${DROPDOWN_TRIGGER}]`);
  const activeItem = target.closest(`[${DROPDOWN_ITEM}]`);
  if (activeTarget) {
    const dropdown = activeTarget.closest(`[${DROPDOWN}]`);
    const lists = dropdown.querySelectorAll(`[${DROPDOWN_ITEM}]`);
    if (!dropdown) return;
    const len = lists.length;
    if (e.key === KEYS.ARROW_DOWN) {
      activeTarget.classList.add(ACTIVE_CLASS);

      //   (activeTarget.nextElementSibling as HTMLElement).focus();
      lists[0].focus();
      activeTarget.setAttribute('aria-expanded', 'true');
      e.preventDefault();
    } else if (e.key === KEYS.ARROW_UP) {
      activeTarget.classList.add(ACTIVE_CLASS);
      lists[len - 1].focus();
      activeTarget.setAttribute('aria-expanded', 'true');
      e.preventDefault();
    } else if (e.key === KEYS.TAB) {
      activeTarget.classList.remove(ACTIVE_CLASS);
      activeTarget.setAttribute('aria-expanded', 'false');
    }
  } else if (activeItem) {
    const dropdown = activeItem.closest(`[${DROPDOWN}]`);
    if (!dropdown) return;
    const nodes = [...dropdown.querySelectorAll(`[${DROPDOWN_ITEM}]`)];
    const index = nodes.indexOf(activeItem);
    const len = nodes.length;
    if (e.key === KEYS.ARROW_DOWN) {
      const nextIndex = index + 1;
      if (nextIndex <= len - 1) {
        const nextTarget = nodes[nextIndex];
        nextTarget.focus();
      }
      e.preventDefault();
    } else if (e.key === KEYS.ARROW_UP) {
      const prevIndex = index - 1;
      if (prevIndex >= 0) {
        const prevTarget = nodes[prevIndex];
        prevTarget.focus();
      }
      e.preventDefault();
    } else if (e.key === KEYS.HOME) {
      const nextTarget = nodes[0];
      nextTarget.focus();
      e.preventDefault();
    } else if (e.key === KEYS.END) {
      const nextTarget = nodes[len - 1];
      nextTarget.focus();
      e.preventDefault();
    } else if (e.key === KEYS.ESCAPE) {
      const focusTarget = dropdown.querySelector(`[${DROPDOWN_TRIGGER}]`);
      focusTarget.focus();
      focusTarget.classList.remove(ACTIVE_CLASS);
      focusTarget.setAttribute('aria-expanded', 'false');
      e.preventDefault();
    } else if (e.key === KEYS.TAB) {
      const focusTarget = dropdown.querySelector(`[${DROPDOWN_TRIGGER}]`);
      focusTarget.classList.remove(ACTIVE_CLASS);
      focusTarget.setAttribute('aria-expanded', 'false');
    }
  }
});
window.initDropdown = initDropdown;
