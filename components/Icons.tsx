import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function CalendarIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3.5" y="5" width="17" height="16" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" />
    </svg>
  );
}

export function ChartIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 20V4M4 20h16" />
      <path d="m7.5 14 3.5-4 3 2.5L18.5 7" />
    </svg>
  );
}

export function TargetIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ChatIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L4 21l1.5-4.4A8.5 8.5 0 1 1 21 12Z" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
    </svg>
  );
}

export function ClockIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function DocIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M6 3.5h8L19 8.5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v5h5M9 13h6M9 16.5h6" />
    </svg>
  );
}

export function DownloadIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 4v11M7.5 11 12 15.5 16.5 11M4.5 19.5h15" />
    </svg>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function ArrowIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowDownIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}

export function ChevronIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function PlayIcon(p: IconProps) {
  return (
    <svg {...p} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

export function QuoteIcon(p: IconProps) {
  return (
    <svg {...p} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.5 6C6.5 7 5 9.5 5 13v5h6v-6H8c0-2 .8-3.2 2.5-3.8L9.5 6Zm9 0c-3 1-4.5 3.5-4.5 7v5h6v-6h-3c0-2 .8-3.2 2.5-3.8L18.5 6Z" />
    </svg>
  );
}

export function MailIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6 8.5-6" />
    </svg>
  );
}

export function PhoneIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 5c0 8 7 15 15 15 1 0 1.7-.7 1.7-1.7v-2.3l-4-1.5-1.7 2c-2.4-1.2-4.3-3.1-5.5-5.5l2-1.7L10 5.3V3H7.7C6.7 3 6 3.7 6 4.7" />
    </svg>
  );
}

export function PinIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 21c4-4.5 7-7.8 7-11a7 7 0 1 0-14 0c0 3.2 3 6.5 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function InstagramIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function WhatsappIcon(p: IconProps) {
  return (
    <svg {...p} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 0 1 6.9 12.6l-.2.3.8 2.9-3-.8-.3.2A8.2 8.2 0 1 1 12 3.8Zm-3 3.9c-.2 0-.5 0-.7.4-.3.4-1 .9-1 2.3s1 2.7 1.2 2.9c.2.2 2 3.2 5 4.4 2.5 1 3 .8 3.5.7.6 0 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4l-1-.5c-.3-.1-1.6-.8-1.8-.9-.3-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.1-.3 0-.4.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.4-.5-.6-.5h-.4Z" />
    </svg>
  );
}

const map = {
  calendar: CalendarIcon,
  chart: ChartIcon,
  target: TargetIcon,
  chat: ChatIcon,
  clock: ClockIcon,
  doc: DocIcon,
};

export function NamedIcon({ name, ...props }: { name: string } & IconProps) {
  const Cmp = map[name as keyof typeof map] ?? TargetIcon;
  return <Cmp {...props} />;
}
