interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function FormField({
  label,
  required,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-[0.85rem] font-semibold text-text-dark tracking-[0.01em]">
        {label}
        {required && <span className="text-required ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
