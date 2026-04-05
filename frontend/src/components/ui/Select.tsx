import { useState, useRef, useEffect } from "react";

export interface SelectOption {
  value: string;
  label: string;
  /** Short badge text displayed before the label (e.g. "{ }" for JSON) */
  icon?: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[] | SelectOption[];
  placeholder?: string;
}

function normalizeOptions(options: string[] | SelectOption[]): SelectOption[] {
  return options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Select an option",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const normalized = normalizeOptions(options);
  const selected = normalized.find((o) => o.value === value);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div
        className={[
          "flex items-center justify-between px-3.5 py-[10px] bg-white border-[1.5px] rounded-lg cursor-pointer text-[0.9rem] text-text-dark select-none transition-[border-color,box-shadow] duration-150",
          open
            ? "border-accent shadow-[0_0_0_3px_rgba(26,158,122,0.1)]"
            : "border-black/10 hover:border-accent hover:shadow-[0_0_0_3px_rgba(26,158,122,0.1)]",
        ].join(" ")}
        onClick={() => setOpen((p) => !p)}
      >
        <span className={selected ? "" : "text-text-light"}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          width={18}
          height={18}
          className={`shrink-0 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>

        {open && (
          <ul
            className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border-[1.5px] border-black/[0.08] rounded-[10px] list-none m-0 p-1.5 z-50 shadow-[0_8px_24px_rgba(0,0,0,0.1)] animate-dropdown-in"
            onClick={(e) => e.stopPropagation()}
          >
            {normalized.map((opt) => (
              <li
                key={opt.value}
                className={[
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[0.875rem] cursor-pointer transition-colors duration-[120ms]",
                  opt.value === value
                    ? "bg-accent text-white font-medium hover:bg-accent-dark"
                    : "text-text-dark hover:bg-mint-light",
                ].join(" ")}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.icon && (
                  <span
                    className={[
                      "inline-flex items-center justify-center w-8 h-[22px] rounded text-[0.65rem] font-bold tracking-wider font-mono shrink-0",
                      opt.value === value
                        ? "bg-white/20 text-white"
                        : "bg-black/[0.06] text-[#4b5563]",
                    ].join(" ")}
                  >
                    {opt.icon}
                  </span>
                )}
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
