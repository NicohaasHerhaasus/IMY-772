interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export default function Modal({ title, onClose, children, footer }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center z-[200] animate-overlay-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[440px] shadow-[0_24px_64px_rgba(0,0,0,0.18)] animate-modal-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5">
          <h2 className="text-[1.1rem] font-bold text-primary m-0">{title}</h2>
          <button
            className="bg-transparent border-none cursor-pointer text-text-light text-[0.9rem] px-2 py-1 rounded-md transition-all duration-150 hover:bg-[#f3f4f6] hover:text-[#374151]"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">{children}</div>
        <div className="flex justify-end gap-2.5 px-6 pb-5 pt-4 border-t border-black/[0.06]">
          {footer}
        </div>
      </div>
    </div>
  );
}
