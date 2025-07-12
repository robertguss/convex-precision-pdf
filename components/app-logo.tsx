import Link from 'next/link';
import { Slice } from 'lucide-react';

interface AppLogoProps {
  href?: string;
  className?: string;
}

export function AppLogo({ href = '/', className = '' }: AppLogoProps) {
  return (
    <Link href={href} className={`flex items-center gap-2 ${className}`}>
      <Slice className="h-8 w-8" />
      <span className="text-xl font-bold">PrecisionPDF</span>
    </Link>
  );
}