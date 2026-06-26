export interface ParsedUA {
  browser: string;
  device: string;
}

/**
 * Parses simple browser and OS name from User-Agent string.
 */
export function parseUserAgent(ua: string): ParsedUA {
  let browser = 'Other';
  let device = 'Other';

  if (!ua) {
    return { browser, device };
  }

  const uaLower = ua.toLowerCase();

  // Browser detection
  if (uaLower.includes('edg/')) {
    browser = 'Edge';
  } else if (uaLower.includes('opr/') || uaLower.includes('opera')) {
    browser = 'Opera';
  } else if (uaLower.includes('chrome') || uaLower.includes('crios')) {
    browser = 'Chrome';
  } else if (uaLower.includes('firefox') || uaLower.includes('fxios')) {
    browser = 'Firefox';
  } else if (uaLower.includes('safari') && !uaLower.includes('chrome') && !uaLower.includes('android')) {
    browser = 'Safari';
  }

  // OS / Device detection
  if (uaLower.includes('iphone') || uaLower.includes('ipad') || uaLower.includes('ipod')) {
    device = 'iOS';
  } else if (uaLower.includes('android')) {
    device = 'Android';
  } else if (uaLower.includes('macintosh') || uaLower.includes('mac os x')) {
    device = 'macOS';
  } else if (uaLower.includes('windows')) {
    device = 'Windows';
  } else if (uaLower.includes('linux')) {
    device = 'Linux';
  }

  return { browser, device };
}
