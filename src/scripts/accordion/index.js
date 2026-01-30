import { getRandomId } from '../utils/domUtils';
import { KEYS, ACTIVE_CLASS } from '../constants';

const ACCORDION = 'data-accordion';
const ACCORDION_TRIGGER = 'data-accordion-trigger';
const ACCORDION_ITEM = 'data-accordion-item';
const ACCORDION_WRAPPER = 'data-accordion-wrapper';
const ACCORDION_CONTENT = 'data-accordion-content';

function ariaSet(accordionItem) {
  const accordionTrigger = accordionItem.querySelector(`[${ACCORDION_TRIGGER}]`);
  const accordionContent = accordionItem.querySelector(`[${ACCORDION_WRAPPER}]`);
  accordionTrigger?.setAttribute(
    'aria-expanded',
    accordionItem.classList.contains(ACTIVE_CLASS) ? 'true' : 'false'
  );
  let triggerId = accordionTrigger?.getAttribute('id');
  let contentId = accordionContent?.getAttribute('id');
  const randomId = getRandomId();
  if (triggerId === null) {
    triggerId = 'accordion-trigger-' + randomId;
    accordionTrigger?.setAttribute('id', triggerId);
  }
  if (contentId === null) {
    contentId = 'accordion-content-' + randomId;
    accordionContent?.setAttribute('id', contentId);
  }

  accordionTrigger?.setAttribute('aria-controls', contentId);
  accordionContent?.setAttribute('aria-labelledby', triggerId);
}
function activeSet(type, activeTrigger) {
  const activeItem = activeTrigger.closest(`[${ACCORDION_ITEM}]`);
  const itemParent = activeItem.parentElement;
  if (type === 'multiple') {
    activeItem?.classList.toggle(ACTIVE_CLASS);
    activeTrigger.setAttribute(
      'aria-expanded',
      activeItem?.classList.contains(ACTIVE_CLASS) ? 'true' : 'false'
    );

    transitionSet(activeItem);
  } else {
    itemParent
      ?.querySelectorAll(`:scope  > [${ACCORDION_ITEM}] > [${ACCORDION_TRIGGER}]`)
      .forEach((trigger) => {
        //   trigger.classList.remove(ACTIVE_CLASS);
        const item = trigger.closest(`[${ACCORDION_ITEM}]`);
        item?.classList.remove(ACTIVE_CLASS);
        const wrapper = item?.querySelector(`[${ACCORDION_WRAPPER}]`);
        wrapper?.style.removeProperty('height');
        trigger.setAttribute('aria-expanded', 'false');
      });
    activeItem?.classList.add(ACTIVE_CLASS);
    activeTrigger.setAttribute('aria-expanded', 'true');
    transitionSet(activeItem);
  }

  itemParent?.querySelectorAll(`:scope > [${ACCORDION_ITEM}]`).forEach((item) => {
    const content = item.querySelector(`[${ACCORDION_WRAPPER}]`);
    if (item?.classList.contains(ACTIVE_CLASS)) {
      content?.removeAttribute('inert');
    } else {
      content?.setAttribute('inert', '');
    }
  });
}
function transitionSet(activeItem) {
  const contentWrapper = activeItem.querySelector(`[${ACCORDION_WRAPPER}]`);

  const content = contentWrapper.querySelector(`[${ACCORDION_CONTENT}]`);
  const currentlyOpen = activeItem.classList.contains(ACTIVE_CLASS);
  if (currentlyOpen) {
    const scrollHeight = content.scrollHeight;
    contentWrapper.style.height = `${scrollHeight}px`;
  } else {
    contentWrapper.style.height = '0px';
  }
}
function clickHandler(e) {
  const target = e.target;
  const accordion = target.closest(`[${ACCORDION}]`);
  if (!accordion) return;
  const accordionTrigger = target.closest(`[${ACCORDION_TRIGGER}]`);
  if (!accordionTrigger) return;
  const accordionItem = accordionTrigger.closest(`[${ACCORDION_ITEM}]`);
  if (!accordionItem) return;
  const multiple = accordion?.getAttribute(ACCORDION);
  activeSet(multiple, accordionTrigger);
}
function resizeObjHandler(item) {
  const content = item?.querySelector(`[${ACCORDION_CONTENT}]`);
  const contentWrapper = item.querySelector(`[${ACCORDION_WRAPPER}]`);
  const ro = new ResizeObserver(() => {
    if (item?.classList.contains(ACTIVE_CLASS)) {
      contentWrapper.style.height = `${content.scrollHeight}px`;
    }
  });
  ro.observe(content);
}

function initAccordion() {
  const accodions = document.querySelectorAll(`[${ACCORDION_ITEM}]`);
  accodions.forEach((accordion) => {
    ariaSet(accordion);
    resizeObjHandler(accordion);
  });
}

// 접근성 상하키 순환
document.addEventListener('keydown', (e) => {
  const target = document.activeElement;
  const accordion = target.closest(`[${ACCORDION}]`);
  if (!accordion) return;
  const activeTarget = target.closest(`[${ACCORDION_TRIGGER}]`);
  const nodes = [
    ...accordion.querySelectorAll(
      `:scope > [${ACCORDION_WRAPPER}]  > [${ACCORDION_ITEM}] > [${ACCORDION_TRIGGER}]`
    ),
  ];

  if (!activeTarget) return;
  const index = nodes.indexOf(activeTarget);
  const len = nodes.length;
  if (e.key === KEYS.ARROW_DOWN) {
    const nextIndex = (index + 1) % len;
    const nextTarget = nodes[nextIndex];
    e.preventDefault();
    // activeTab(tab, nextTarget);
    nextTarget.focus();
  } else if (e.key === KEYS.ARROW_UP) {
    const prevIndex = (index + len - 1) % len;
    const prevTarget = nodes[prevIndex];
    // activeTab(tab, prevTarget);
    prevTarget.focus();
    e.preventDefault();
  }
});

document.addEventListener('DOMContentLoaded', initAccordion);
document.addEventListener('click', clickHandler);

window.initAccordion = initAccordion;
