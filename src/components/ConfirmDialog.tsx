import { AlertTriangle } from 'lucide-react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'حذف',
  cancelLabel = 'إلغاء',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-stone-50 rounded-3xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        <div className="flex flex-col items-center text-center gap-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              variant === 'danger'
                ? 'bg-red-100 text-red-600'
                : 'bg-amber-100 text-amber-600'
            }`}
          >
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-bold text-stone-900">{title}</h3>
          <p className="text-stone-600 leading-relaxed">{message}</p>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-stone-200 text-stone-700 font-semibold hover:bg-stone-300 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3 rounded-xl font-semibold text-white transition-colors ${
                variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
