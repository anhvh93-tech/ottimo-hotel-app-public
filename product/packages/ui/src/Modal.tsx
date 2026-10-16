import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { Icon } from './Icon';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface UnsavedLabels {
  title: string;
  body: string;
  keep: string;
  discard: string;
}

export interface ModalProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  meta?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** C14 drawer slides from the right; C15 modal is centred. */
  variant?: 'modal' | 'drawer';
  /** aria-label of the × button; omit to hide it (confirm dialogs). */
  closeLabel?: string;
  role?: 'dialog' | 'alertdialog';
  describedBy?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Form has unsaved input → Esc / × / backdrop ask "Bỏ các thay đổi chưa lưu?" (DS D5). */
  dirty?: boolean;
  unsavedLabels?: UnsavedLabels;
}

/** Accessible modal/drawer: focus moves in, Tab is trapped, Esc closes, focus returns on close. */
export function Modal(props: ModalProps) {
  if (!props.open) return null;
  return createPortal(<ModalInner {...props} />, document.body);
}

function ModalInner({
  title,
  onClose,
  children,
  footer,
  meta,
  size = 'md',
  variant = 'modal',
  closeLabel,
  role = 'dialog',
  describedBy,
  initialFocusRef,
  dirty,
  unsavedLabels,
}: ModalProps) {
  const titleId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [askUnsaved, setAskUnsaved] = useState(false);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const box = boxRef.current;
    const target =
      initialFocusRef?.current ??
      box?.querySelector('.modal-b')?.querySelector<HTMLElement>(FOCUSABLE) ??
      box?.querySelector<HTMLElement>('h2');
    target?.focus();
    return () => previous?.focus?.();
    // Focus once on open only (initialFocusRef is read at mount).
  }, []);

  const requestClose = () => {
    if (dirty && unsavedLabels) setAskUnsaved(true);
    else onClose();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      requestClose();
      return;
    }
    if (e.key !== 'Tab' || !boxRef.current) return;
    const items = Array.from(boxRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const boxClass =
    variant === 'drawer'
      ? 'drawer'
      : ['modal', size === 'md' ? '' : size].filter(Boolean).join(' ');

  return (
    <div
      className={`overlay${variant === 'drawer' ? ' right' : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        ref={boxRef}
        className={boxClass}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        onKeyDown={onKeyDown}
      >
        <div className="modal-h">
          <h2 id={titleId} tabIndex={-1}>
            {title}
          </h2>
          {meta ? <span className="meta">{meta}</span> : null}
          {closeLabel ? (
            <button
              type="button"
              className="btn icon-btn"
              aria-label={closeLabel}
              onClick={requestClose}
            >
              <Icon name="x" />
            </button>
          ) : null}
        </div>
        <div className="modal-b">{children}</div>
        {footer ? <div className="modal-f">{footer}</div> : null}
      </div>
      {askUnsaved && unsavedLabels ? (
        <ConfirmDialog
          title={unsavedLabels.title}
          body={unsavedLabels.body}
          keepLabel={unsavedLabels.keep}
          confirmLabel={unsavedLabels.discard}
          onKeep={() => setAskUnsaved(false)}
          onConfirm={() => {
            setAskUnsaved(false);
            onClose();
          }}
        />
      ) : null}
    </div>
  );
}

export interface ConfirmDialogProps {
  title: ReactNode;
  body: ReactNode;
  /** "Không, quay lại" – safe default, receives focus (US-135 AC). */
  keepLabel: string;
  /** Names the real action, e.g. "Thu hồi". */
  confirmLabel: string;
  onKeep: () => void;
  onConfirm: () => void;
  busy?: boolean;
  danger?: boolean;
  children?: ReactNode;
}

/** C16 confirm for irreversible actions: role=alertdialog, focus on the safe button, Esc = keep. */
export function ConfirmDialog({
  title,
  body,
  keepLabel,
  confirmLabel,
  onKeep,
  onConfirm,
  busy,
  danger = true,
  children,
}: ConfirmDialogProps) {
  const keepRef = useRef<HTMLButtonElement>(null);
  const bodyId = useId();
  return (
    <Modal
      open
      size="sm"
      role="alertdialog"
      title={title}
      describedBy={bodyId}
      onClose={onKeep}
      initialFocusRef={keepRef}
      footer={
        <>
          <Button ref={keepRef} onClick={onKeep}>
            {keepLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'pri'} busy={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p id={bodyId}>{body}</p>
      {children}
    </Modal>
  );
}
