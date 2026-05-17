export const PORTFOLIO_MENU = [
//{ href: '/?mode=portfolio', text: 'Home', exact: true }, 버튼 중복
  { href: '/about?mode=portfolio', text: 'About' },
  { href: '/project?mode=portfolio', text: 'Project' },
  { href: '/skill?mode=portfolio', text: 'Skill' },
  { href: '/decision?mode=portfolio', text: 'Decision' },
  { href: '/troubleshooting?mode=portfolio', text: 'Troubleshooting' },
] as const;

export const BLOG_MENU = [
  { href: '/skilltree', text: 'Skill_Tree' },
  { href: '/cs', text: 'CS' },
  { href: '/data', text: 'Data' },
  { href: '/language', text: 'Language' },
  { href: '/infra', text: 'Infra' },
  { href: '/tools', text: 'Tools' },
] as const;

export type MenuItem = (typeof PORTFOLIO_MENU)[number] | (typeof BLOG_MENU)[number];

export const ENABLE_MODE_TOGGLE = true;
