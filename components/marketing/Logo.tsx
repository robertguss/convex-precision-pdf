import { Slice } from "lucide-react";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={className || "flex items-center gap-2"}>
      <Slice className="h-10 w-10" />
      <span className="text-2xl">PrecisionPDF</span>
    </div>
  );
}
