import { getIncrementZ } from '../utils/domUtils';
import { a11yAttribute } from '../modal';

const DATA_MODAL = 'data-modal';
const DATA_DIALOG_ACTION = 'data-dialog-action';
const DIALOG_MARKUP = `
<div role="{{role}}" class="modal active {{animation}}" data-modal aria-modal="true">
  <div class="modal-wrap">
  <h2 tabindex="0" class="modal-header">{{title}}</h2>
  <div class="modal-content">
    <p>{{message}}</p>
  </div>
  <div class="modal-footer right">
    {{footer}}
  </div>
  </div>
</div>
`;
const BUTTON_MARKUP = `
<button type="button" data-dialog-action="{{action}}" data-modal-close="true" class="button {{variant}} md">{{children}}</button>
`;
let resolveFn = null;

function onConfirm(e) {
  resolveFn?.(true);
  const target = e.currentTarget;
  const modal = target.closest(`[${DATA_MODAL}]`);
  if (modal) destroyDialog(modal);
}

function onCancel(e) {
  resolveFn?.(false);
  const target = e.currentTarget;
  const modal = target.closest(`[${DATA_MODAL}]`);
  if (modal) destroyDialog(modal);
}

function makeDoms({ title, message, animation, btnLabel, btnLabelCancel }) {
  let temp = DIALOG_MARKUP;
  temp = temp.replace('{{title}}', title);
  temp = temp.replace('{{message}}', message);
  temp = temp.replace('{{role}}', 'alertdialog');
  const animationClass = animation ? 'animation' : '';
  temp = temp.replace('{{animation}}', animationClass);

  let footer = '';
  if (btnLabelCancel) {
    let cancelBtn = BUTTON_MARKUP;
    cancelBtn = cancelBtn.replace('{{children}}', btnLabelCancel);
    cancelBtn = cancelBtn.replace('{{variant}}', 'secondary');
    cancelBtn = cancelBtn.replace('{{action}}', 'cancel');
    footer += cancelBtn;
  }
  let confirmBtn = BUTTON_MARKUP;
  confirmBtn = confirmBtn.replace('{{children}}', btnLabel);
  confirmBtn = confirmBtn.replace('{{variant}}', 'primary');
  confirmBtn = confirmBtn.replace('{{action}}', 'confirm');
  footer += confirmBtn;

  temp = temp.replace('{{footer}}', footer);
  return temp;
}
function destroyDialog(modal) {
  removeEvent(modal);
  if (modal.classList.contains('animation')) {
    modal.addEventListener(
      'animationend',
      () => {
        modal.remove();
      },
      { once: true }
    );
  } else {
    modal.remove();
  }
}
function eventSet(modal) {
  a11yAttribute(modal);
  modal.querySelector(`.modal-header`)?.focus();
  modal.querySelector(`[${DATA_DIALOG_ACTION}="confirm"]`)?.addEventListener('click', onConfirm);
  modal.querySelector(`[${DATA_DIALOG_ACTION}="cancel"]`)?.addEventListener('click', onCancel);
}
function removeEvent(modal) {
  modal.querySelector(`[${DATA_DIALOG_ACTION}="confirm"]`)?.removeEventListener('click', onConfirm);
  modal.querySelector(`[${DATA_DIALOG_ACTION}="cancel"]`)?.removeEventListener('click', onCancel);
}

export class Dialog {
  static Alert({ title, message, animation = true, btnLabel = 'OK' }) {
    const markup = makeDoms({
      title,
      message,
      animation,
      btnLabel,
    });
    return new Promise((resolve) => {
      resolveFn = resolve;
      const div = document.createElement('div');
      div.innerHTML = markup;
      div.querySelector('.modal')?.setAttribute('id', div.id);
      if (div.querySelector('.modal')) {
        const modal = div.querySelector('.modal');
        document.body.appendChild(modal);
        modal.style.zIndex = getIncrementZ().toString();
        eventSet(modal);
      }
    });
  }
  static Confirm({ title, message, animation = true, btnLabel = 'OK', btnLabelCancel = 'Cancel' }) {
    const markup = makeDoms({
      title,
      message,
      animation,
      btnLabel,
      btnLabelCancel,
    });
    return new Promise((resolve) => {
      resolveFn = resolve;
      const div = document.createElement('div');
      div.innerHTML = markup;
      div.querySelector('.modal')?.setAttribute('id', div.id);
      if (div.querySelector('.modal')) {
        const modal = div.querySelector('.modal');
        document.body.appendChild(modal);
        modal.style.zIndex = getIncrementZ().toString();
        eventSet(modal);
      }
    });
  }
}

window.Dialog = Dialog;
