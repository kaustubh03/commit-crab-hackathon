// Simple classNames merge utility (similar to clsx + tailwind-merge minimal)
export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}
