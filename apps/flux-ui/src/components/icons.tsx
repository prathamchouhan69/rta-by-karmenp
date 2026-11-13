import type { SVGProps } from 'react';

export type IconName =
  | 'home' | 'chat' | 'money' | 'wealth' | 'startup' | 'construction' | 'health'
  | 'knowledge' | 'jugaad' | 'approvals' | 'settings' | 'sun' | 'moon' | 'globe'
  | 'menu' | 'close' | 'mic' | 'send' | 'plus' | 'trash' | 'chevron' | 'check'
  | 'warning' | 'spark' | 'logout' | 'wifi-off' | 'wifi' | 'arrow' | 'search'
  | 'economy' | 'radar' | 'local' | 'automations' | 'meeting' | 'documents';

const paths: Record<IconName, string> = {
  home: 'M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  chat: 'M21 11.5a8.4 8.4 0 0 1-9 8.4 9.3 9.3 0 0 1-4-.9L3 21l1.8-4.5A8.3 8.3 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z',
  money: 'M3 7h18v10H3zM3 10h18M7 14h2M15 14h2',
  wealth: 'M4 19V9m5 10V5m5 14v-7m5 7V8M2 19h20',
  startup: 'M12 3c3 2 5 5 5 9l-2.5 2.5h-5L7 12c0-4 2-7 5-9zM9.5 14.5 7 17m7.5-2.5L17 17m-5-14v5',
  construction: 'M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6M9 11h.01M15 11h.01',
  health: 'M12 21s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.2-8 11-8 11zM12 8v6m-3-3h6',
  knowledge: 'M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2zM20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 0 2-2z',
  jugaad: 'M14 3l7 7-4 1-3 8-3-6-8-3 8-3zM5 19l3-3',
  approvals: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  settings: 'M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.4-.2-.1a1.7 1.7 0 0 0-1.9.2 1.7 1.7 0 0 0-.7 1.5v.2h-4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.2l-.2.1L6 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4.7v-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.2-1.9L6 7l2-3.4.2.1a1.7 1.7 0 0 0 1.9.2 1.7 1.7 0 0 0 1-1.6v-.2h4v.2a1.7 1.7 0 0 0 .7 1.5 1.7 1.7 0 0 0 1.9-.2l.2-.1L20 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v4h-.2a1.7 1.7 0 0 0-1.7 1z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.6-4-9s1.5-6.6 4-9z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6 6 18',
  mic: 'M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM19 11v1a7 7 0 0 1-14 0v-1M12 19v3M8 22h8',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M9 7V4h6v3m-8 0 1 14h8l1-14M10 11v6m4-6v6',
  chevron: 'M9 6l6 6-6 6',
  check: 'M4 12l5 5L20 6',
  warning: 'M12 3 2.5 20h19zM12 9v5m0 3h.01',
  spark: 'M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  'wifi-off': 'M2 2l20 20M8.5 8.5A10 10 0 0 1 22 8M2 8a15 15 0 0 1 4.5-2.5M5 12.5a10 10 0 0 1 3-1.7M8.5 16.5a5 5 0 0 1 7 0M12 20h.01',
  wifi: 'M2 8a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  economy: 'M3 6h18M3 12h12M3 18h9M18 9v12M14 9h4l4 4v6h-8',
  radar: 'M12 3a9 9 0 0 0-9 9c0 2.6 1.2 4.9 3 6.7l-2.2 2.2 1.4 1.4 2.2-2.2A9 9 0 0 0 21 12 9 9 0 0 0 12 3zm0 3a6 6 0 0 1 6 6 6 6 0 0 1-2.8 4.8L12 12.8V6z',
  local: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  automations: 'M5 5h14v4h-4v6h4v4H5V5zm7 7h-2v-2h2v2z',
  meeting: 'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 6h10M7 10h.01M7 14h10M7 18h6',
  documents: 'M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm8 0v5h5M8 12h8M8 16h8',
};

export function Icon({ name, size = 20, ...props }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
