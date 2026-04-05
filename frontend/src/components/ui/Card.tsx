interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-mint rounded-2xl py-9 px-10 flex flex-col gap-6 ${className}`}
    >
      {children}
    </div>
  );
}
