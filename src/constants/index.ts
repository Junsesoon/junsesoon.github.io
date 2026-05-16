export const PORTFOLIO_MENU = [
  { href: '/?mode=portfolio', text: 'Home', exact: true },
  { href: '/knowledge?mode=portfolio', text: 'Knowledge' },
  { href: '/project?mode=portfolio', text: 'Project' },
  { href: '/decision?mode=portfolio', text: 'Decision' },
  { href: '/troubleshooting?mode=portfolio', text: 'Troubleshooting' },
  { href: '/about?mode=portfolio', text: 'About' },
] as const;

export const BLOG_MENU = [
  { href: '/', text: 'Home', exact: true },
  { href: '/cs', text: 'CS' },
  { href: '/data', text: 'Data' },
  { href: '/language', text: 'Language' },
  { href: '/infra', text: 'Infra' },
  { href: '/tools', text: 'Tools' },
] as const;

export type MenuItem = (typeof PORTFOLIO_MENU)[number] | (typeof BLOG_MENU)[number];

export const ENABLE_MODE_TOGGLE = true;
