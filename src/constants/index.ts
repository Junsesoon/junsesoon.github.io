
export const BLOG_MENU = [
  { href: '/skilltree', text: 'Skill Tree' },
  { href: '/cs', text: 'CS' },
  { href: '/data', text: 'Data' },
  { href: '/language', text: 'Language' },
  { href: '/infra', text: 'Infra' },
  { href: '/tools', text: 'Tools' },
] as const;

export const PORTFOLIO_MENU = [
  { href: '/portfolio/about', text: 'About' },
  { href: '/portfolio/project', text: 'Project' },
  { href: '/portfolio/myskill', text: 'My Skill' },
  { href: '/portfolio/decision', text: 'Decision' },
  { href: '/portfolio/troubleshooting', text: 'Troubleshooting' },
] as const;

export const PORTFOLIO2_MENU = [
  { href: '/portfolio2/about', text: 'About' },
  { href: '/portfolio2#skill', text: 'Skill' },
  { href: '/portfolio2#project', text: 'Project' },
  { href: '/portfolio2#contact', text: 'Contact' },
] as const;

export type MenuItem = 
  | (typeof PORTFOLIO_MENU)[number] 
  | (typeof BLOG_MENU)[number]
  | (typeof PORTFOLIO2_MENU)[number];

export const ENABLE_MODE_TOGGLE = false;

