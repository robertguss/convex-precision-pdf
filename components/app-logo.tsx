import Link from 'next/link';
import Image from 'next/image';

interface AppLogoProps {
  href?: string;
  className?: string;
}

export function AppLogo({ href = '/', className = '' }: AppLogoProps) {
  return (
    <Link href={href} className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/convex.svg"
        alt="PrecisionPDF Logo"
        width={32}
        height={32}
        className="h-8 w-8"
      />
      <span className="text-xl font-bold">PrecisionPDF</span>
    </Link>
  );
}