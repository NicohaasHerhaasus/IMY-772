import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "outline" | "secondary" | "danger";
type ButtonSize = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white border-primary hover:bg-primary-dark hover:border-primary-dark disabled:bg-text-light disabled:border-text-light disabled:opacity-60 disabled:cursor-not-allowed",
  outline:
    "bg-transparent text-accent border-accent hover:bg-accent hover:text-white",
  secondary:
    "bg-transparent text-text-muted border-black/[0.12] hover:bg-[#f3f4f6] hover:text-[#374151]",
  danger:
    "bg-danger text-white border-danger hover:bg-danger-dark hover:border-danger-dark",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "py-[13px] px-9",
  sm: "py-[9px] px-[22px]",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "flex items-center gap-2 border-2 rounded-lg text-[0.9rem] font-semibold cursor-pointer transition-all duration-150 tracking-[0.01em] active:scale-[0.98]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
