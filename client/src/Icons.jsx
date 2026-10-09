// Small stroke icon set (24px grid). Usage: <Icon name="search" />
const P = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3z" /><path d="m9 12 2 2 4-4" /></>,
  bolt: <path d="M13 3 5 14h6l-1 7 8-11h-6l1-7z" />,
  bell: <><path d="M6 16v-5a6 6 0 1 1 12 0v5l2 2H4l2-2z" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
  chat: <path d="M4 5h16v11H9l-5 4V5z" />,
  qr: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v1M14 20h1M18 18h3v3h-3z" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  home: <><path d="M4 11 12 4l8 7v9H4z" /><path d="M10 20v-6h4v6" /></>,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  share: <><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="m13.5 6.5 4 4" /></>,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  laptop: <><rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2 19h20" /></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" /><path d="M19 19v2H6" /></>,
  id: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.5-2 5.5-2 6 0M14 10h4M14 13h3" /></>,
  wallet: <><path d="M4 7a2 2 0 0 1 2-2h12v4" /><rect x="3" y="8" width="18" height="12" rx="2" /><circle cx="16.5" cy="14" r="1" /></>,
  bag: <><path d="M5 8h14l1 12H4L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M16 7l3 3M14 9l2 2" /></>,
  shirt: <path d="M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z" />,
  watch: <><rect x="7" y="6" width="10" height="12" rx="3" /><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3M12 10v2l1.5 1" /></>,
  ball: <><circle cx="12" cy="12" r="9" /><path d="M12 3c3 3 3 15 0 18M3 12h18M5 6c4 2 10 2 14 0M5 18c4-2 10-2 14 0" /></>,
  pencil: <><path d="m4 20 1-5L16 4l4 4L9 19l-5 1z" /><path d="m14 6 4 4" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  logout: <path d="M9 4H5v16h4M15 8l5 4-5 4M20 12H9" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.7" /><path d="m4 18 5-5 4 4 3-3 4 4" /></>,
  inbox: <><path d="M4 13 6 5h12l2 8v6H4v-6z" /><path d="M4 13h5l1 2h4l1-2h5" /></>,
};

export default function Icon({ name, size, className = '' }) {
  return (
    <svg className={`ic ${className}`} viewBox="0 0 24 24" aria-hidden="true" style={size ? { width: size, height: size } : undefined}>
      {P[name] || P.grid}
    </svg>
  );
}

export const CATEGORY_ICON = {
  Electronics: 'laptop', 'Books & Notes': 'book', 'ID & Cards': 'id', 'Wallet & Money': 'wallet', Bags: 'bag', Keys: 'key',
  Clothing: 'shirt', Accessories: 'watch', Sports: 'ball', Stationery: 'pencil', Other: 'grid',
};
