export const PORTFOLIO_MENU = [
  { href: '/portfolio/about', text: 'About' },
  { href: '/portfolio/project', text: 'Project' },
  { href: '/portfolio/myskill', text: 'My Skill' },
  { href: '/portfolio/decision', text: 'Decision' },
  { href: '/portfolio/troubleshooting', text: 'Troubleshooting' },
] as const;

export const BLOG_MENU = [
  { href: '/skilltree', text: 'Skill Tree' },
  { href: '/cs', text: 'CS' },
  { href: '/data', text: 'Data' },
  { href: '/language', text: 'Language' },
  { href: '/infra', text: 'Infra' },
  { href: '/tools', text: 'Tools' },
] as const;

export type MenuItem = (typeof PORTFOLIO_MENU)[number] | (typeof BLOG_MENU)[number];

export const ENABLE_MODE_TOGGLE = false;
