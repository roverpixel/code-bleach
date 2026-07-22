export type ReplacementStyle = 'asterisks' | 'redacted' | 'type-specific';

export interface Token {
  type: 'text' | 'redacted';
  value: string;
  original?: string;
  ruleName?: string;
}

export interface Rule {
  name: string;
  pattern: RegExp;
  valueGroup?: number;
  filter?: (match: string) => boolean;
}

export const defaultRules: Rule[] = [
  // Passwords, API Keys, & Tokens
  {
    name: 'JWT',
    pattern: /ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gd,
  },
  {
    name: 'Stripe Key',
    pattern: /(?:sk_live_|pk_live_)[0-9a-zA-Z]+/gd,
  },
  {
    name: 'AWS Access Key',
    pattern: /\bAKIA[0-9A-Z]{16}\b/gd,
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN[\sA-Z]+PRIVATE KEY-----[a-zA-Z0-9+/\s=]+-----END[\sA-Z]+PRIVATE KEY-----/gd,
  },
  {
    name: 'Connection String',
    pattern: /(?:postgres|postgresql|mysql|mongodb|redis|sqlite|mssql)(?:\+srv)?:\/\/[^\s'"]+/gd,
  },
  {
    name: 'Secret Assignment',
    pattern: /(?:password|secret|token|api_?key|seed|pwd|auth|hash|salt|user|server|host|url)(?:["']?)\s*[:=]\s*(['"])(.*?)\1/gdi,
    valueGroup: 2,
  },
  {
    name: 'Secret Assignment (Unquoted)',
    pattern: /(?:password|secret|token|api_?key|seed|pwd|auth|hash|salt|user|server|host|url)(?:["']?)\s*[:=]\s*(?:['"]?)([^\s,;\]})&"']+)/gdi,
    valueGroup: 1,
  },

  // Network
  {
    name: 'IPv4 Address',
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/gd,
    filter: (match) => match !== '127.0.0.1',
  },
  {
    name: 'IPv6 Address',
    pattern: /\b(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}\b|\b(?:[A-F0-9]{1,4}:){1,7}:|\b::(?:[A-F0-9]{1,4}:){0,7}[A-F0-9]{1,4}\b/gid,
    filter: (match) => match !== '::1',
  },
  {
    name: 'MAC Address',
    pattern: /\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\b/gd,
  },
  {
    name: 'Cloud Domain',
    pattern: /\b[a-zA-Z0-9.-]+\.(?:s3\.amazonaws\.com|azure\.net|database\.windows\.net|blob\.core\.windows\.net)\b/gd,
  },

  // Identity
  {
    name: 'Email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gd,
  },
  {
    name: 'Unix User Path',
    pattern: /\/(?:home|Users)\/[a-zA-Z0-9_.-]+/gd,
  },
  {
    name: 'Windows User Path',
    pattern: /[a-zA-Z]:\\Users\\[a-zA-Z0-9_.-]+/gid,
  },

  // Operational
  {
    name: 'UUID',
    pattern: /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/gd,
  },
  {
    name: 'Slack Webhook',
    pattern: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9]+\/[A-Za-z0-9]+\/[A-Za-z0-9]+/gd,
  },
  {
    name: 'Discord Webhook',
    pattern: /https:\/\/discord(?:app)?\.com\/api\/webhooks\/[0-9]+\/[A-Za-z0-9_-]+/gd,
  }
];

export interface Match {
  start: number;
  end: number;
  value: string;
  ruleName: string;
}

export function findMatches(code: string, customWords: string[] = []): Match[] {
  const matches: Match[] = [];

  // 1. Process default rules
  for (const rule of defaultRules) {
    const regex = new RegExp(rule.pattern); // clone to reset lastIndex just in case, though it's re-created or lastIndex is 0
    let match;
    while ((match = regex.exec(code)) !== null) {
      let start = match.index;
      let end = regex.lastIndex;
      let value = match[0];

      if (rule.valueGroup !== undefined && match.indices) {
        const groupIndices = match.indices[rule.valueGroup];
        if (groupIndices) {
          start = groupIndices[0];
          end = groupIndices[1];
          value = match[rule.valueGroup];
        }
      }

      if (!rule.filter || rule.filter(value)) {
        matches.push({ start, end, value, ruleName: rule.name });
      }
    }
  }

  // 2. Process custom words
  for (const word of customWords) {
    if (!word.trim()) continue;
    // Escape regex characters in custom word
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedWord, 'gd'); // 'd' flag for indices
    let match;
    while ((match = regex.exec(code)) !== null) {
      matches.push({
        start: match.index,
        end: regex.lastIndex,
        value: match[0],
        ruleName: 'Custom Word'
      });
    }
  }

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  // Resolve overlaps (keep the longest match if overlapping)
  const resolved: Match[] = [];
  for (const match of matches) {
    if (resolved.length === 0) {
      resolved.push(match);
      continue;
    }
    const prev = resolved[resolved.length - 1];
    if (match.start < prev.end) {
      // Overlap detected
      if (match.end > prev.end) {
        // Current match extends further.
        // We can either merge or prefer the longer one.
        // For simplicity, let's prefer the one that covers more characters.
        if (match.end - match.start > prev.end - prev.start) {
          resolved[resolved.length - 1] = match;
        }
      }
    } else {
      resolved.push(match);
    }
  }

  return resolved;
}

export function getReplacement(ruleName: string, style: ReplacementStyle): string {
  if (style === 'asterisks') {
    return '***';
  } else if (style === 'redacted') {
    return '<REDACTED>';
  } else {
    // type-specific
    const slug = ruleName.toUpperCase().replace(/ /g, '_');
    return `<REDACTED_${slug}>`;
  }
}

export function sanitizeCode(code: string, customWords: string[], style: ReplacementStyle): Token[] {
  const matches = findMatches(code, customWords);
  const tokens: Token[] = [];
  let currentIndex = 0;

  for (const match of matches) {
    if (match.start > currentIndex) {
      tokens.push({
        type: 'text',
        value: code.slice(currentIndex, match.start),
      });
    }

    // We don't want to redact 'localhost' since it was excluded, but just to be sure
    // The exclusion happens in findMatches via the filter function.

    tokens.push({
      type: 'redacted',
      value: getReplacement(match.ruleName, style),
      original: match.value,
      ruleName: match.ruleName,
    });

    currentIndex = match.end;
  }

  if (currentIndex < code.length) {
    tokens.push({
      type: 'text',
      value: code.slice(currentIndex),
    });
  }

  return tokens;
}
