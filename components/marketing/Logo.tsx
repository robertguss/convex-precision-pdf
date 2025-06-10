import { Slice } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Slice className="h-10 w-10" />
      <span className="text-2xl">PrecisionPDF</span>
    </div>
  );
}
