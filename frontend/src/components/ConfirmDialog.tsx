import { Modal } from './Modal';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = 'Excluir', busy = false, onConfirm, onCancel }: Props) {
  return (
    <Modal titleId="confirm-title" onClose={busy ? () => {} : onCancel} maxWidth="max-w-sm">
      <h2 id="confirm-title" className="font-display text-xl tracking-wide uppercase">
        {title}
      </h2>
      <p className="mt-2 text-sm text-ink-300">{message}</p>
      <div className="mt-6 flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          autoFocus
          className="px-2 py-2 text-ink-300 transition-colors hover:text-ink-100 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="bg-rust-500 px-4 py-2 font-medium text-board-950 transition-colors hover:bg-rust-400 disabled:opacity-50"
        >
          {busy ? 'Excluindo…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
