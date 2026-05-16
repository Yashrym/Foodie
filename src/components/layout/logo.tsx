import Link from "next/link";
import { Salad } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 group", className)}
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-300 to-sky-500 text-white shadow-glow">
        <Salad className="h-5 w-5" strokeWidth={2.4} />
        <span className="absolute -inset-1 rounded-2xl bg-sky-200/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
      {showWordmark && (
        <span className="text-lg font-bold tracking-tight">
          {APP_NAME}
          <span className="text-sky-500">.</span>
        </span>
      )}
    </Link>
  );
}
