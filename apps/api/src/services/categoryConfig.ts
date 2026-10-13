// Extensible category configuration for merchant categorization
// 
// This module exports the category definitions and inference logic.
// To extend categories, add new entries to the CATEGORY_RULES array.
// The inference engine will automatically use new categories.

export interface CategoryRule {
  /** Unique category identifier (used internally) */
  id: string
  /** Human-readable category name (displayed to users) */
  name: string
  /** Optional category group for organizing categories */
  group?: string
  /** Array of regex patterns to match against merchant name + description */
  patterns: RegExp[]
  /** Priority for category matching (higher = more specific) */
  priority?: number
  /** Optional: categories that this category should override */
  overrides?: string[]
}

export interface CategoryMatch {
  category: CategoryRule
  matchedPattern: string
  confidence: number
}

export interface CategorizedMerchant {
  merchantName: string
  description: string
  categories: CategoryRule[]
  primaryCategory: CategoryRule | null
  allMatches: CategoryMatch[]
}

// Default category rules - extensible by adding new entries
export const DEFAULT_CATEGORY_RULES: CategoryRule[] = [
  // ── Streaming & Entertainment ──────────────────────────────────────────
  {
    id: 'streaming',
    name: 'Streaming',
    group: 'Entertainment',
    priority: 5,
    patterns: [
      /\b(netflix)\b/i,
      /\b(hulu)\b/i,
      /\b(disney\+?)\b/i,
      /\b(showmax)\b/i,
      /\b(spotify)\b/i,
      /\b(apple\s*music)\b/i,
      /\b(youtube\s*premium)\b/i,
      /\b(audible)\b/i,
      /\b(deezer)\b/i,
      /\b(amazon\s*prime\s*video)\b/i,
      /\b(apple\s*tv\+|apple\s*tv)\b/i,
      /\b(hbomax|hbo\s*max)\b/i,
    ],
  },
  {
    id: 'music',
    name: 'Music',
    group: 'Entertainment',
    priority: 4,
    patterns: [
      /\b(music)\b/i,
      /\b(SoundCloud)\b/i,
      /\b(tidal)\b/i,
      /\b(pandora)\b/i,
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    group: 'Entertainment',
    priority: 4,
    patterns: [
      /\b(xbox\s*game\s*pass)\b/i,
      /\b(ps\s*plus)\b/i,
      /\b(nintendo\s*switch\s*online)\b/i,
      /\b(steam)\b/i,
      /\b(epic\s*games)\b/i,
      /\b(battleNet)\b/i,
      /\b(roblox)\b/i,
    ],
  },

  // ── Software & Productivity ────────────────────────────────────────────
  {
    id: 'software',
    name: 'Software',
    group: 'Technology',
    priority: 5,
    patterns: [
      /\b(aws)\b/i,
      /\b(azure)\b/i,
      /\b(google\s*cloud)\b/i,
      /\b(digitalocean)\b/i,
      /\b(vultr)\b/i,
      /\b(hosting)\b/i,
      /\b(domain)\b/i,
      /\b(ssl)\b/i,
      /\b(server)\b/i,
      /\b(cdn)\b/i,
      /\b(heroku)\b/i,
      /\b(linode)\b/i,
      /\b(cloudflare)\b/i,
    ],
  },
  {
    id: 'productivity',
    name: 'Productivity',
    group: 'Technology',
    priority: 4,
    patterns: [
      /\b(microsoft\s*365|office\s*365)\b/i,
      /\b(adobe)\b/i,
      /\b(figma)\b/i,
      /\b(notion)\b/i,
      /\b(slack)\b/i,
      /\b(zoom)\b/i,
      /\b(github)\b/i,
      /\b(jetbrains)\b/i,
      /\b(linear)\b/i,
      /\b(dropbox)\b/i,
      /\b(google\s*workspace)\b/i,
      /\b(microsoft\s*teams)\b/i,
      /\b(trello)\b/i,
      /\b(asana)\b/i,
      /\b(monday\.com)\b/i,
    ],
  },
  {
    id: 'design',
    name: 'Design',
    group: 'Technology',
    priority: 4,
    patterns: [
      /\b(figma)\b/i,
      /\b(canva)\b/i,
      /\b(adobe\s*creative\s*cloud)\b/i,
      /\b(adobe\s*illustrator)\b/i,
      /\b(adobe\s*photoshop)\b/i,
    ],
  },

  // ── Finance & Banking ──────────────────────────────────────────────────
  {
    id: 'finance',
    name: 'Finance',
    group: 'Money',
    priority: 5,
    patterns: [
      /\b(paystack)\b/i,
      /\b(stripe)\b/i,
      /\b(flutterwave)\b/i,
      /\b(monnify)\b/i,
      /\b(paypal)\b/i,
      /\b(wise)\b/i,
      /\b(world\s*bank)\b/i,
      /\b(credit\s*card)\b/i,
      /\b(loan)\b/i,
      /\b(interest)\b/i,
      /\b(insurance)\b/i,
      /\b(mutual\s*fund)\b/i,
      /\b(bank\s*fe)\b/i,
      /\b(overdraft)\b/i,
      /\b(charge)\b/i,
    ],
  },
  {
    id: 'investment',
    name: 'Investment',
    group: 'Money',
    priority: 4,
    patterns: [
      /\b(robinhood)\b/i,
      /\b(etrade)\b/i,
      /\b(interactive\s*brokers)\b/i,
      /\b(wealthfront)\b/i,
      /\b(betterment)\b/i,
      /\b(acorns)\b/i,
    ],
  },

  // ── Utilities & Bills ──────────────────────────────────────────────────
  {
    id: 'utilities',
    name: 'Utilities',
    group: 'Bills',
    priority: 5,
    patterns: [
      /\b(electricity)\b/i,
      /\b(power)\b/i,
      /\b(grid)\b/i,
      /\b(ikeja\s*electric)\b/i,
      /\b(ebu)\b/i,
      /\b(disco)\b/i,
      /\b(water)\b/i,
      /\b(waterboard)\b/i,
      /\b(paulson)\b/i,
      /\b(internet)\b/i,
      /\b(fiber)\b/i,
      /\b(broadband)\b/i,
      /\b(mobile\s*airtime)\b/i,
      /\b(data)\b/i,
      /\b(mtn)\b/i,
      /\b(airtel)\b/i,
      /\b(gl\s*mobile)\b/i,
      /\b(9mobile)\b/i,
      /\b(gas)\b/i,
      /\b(cooking\s*gas)\b/i,
      /\b(diesel)\b/i,
    ],
  },
  {
    id: 'telecom',
    name: 'Telecom',
    group: 'Bills',
    priority: 4,
    patterns: [
      /\b(mtn)\b/i,
      /\b(airtel)\b/i,
      /\b(vodacom)\b/i,
      /\b(telkomsel)\b/i,
      /\b(singtel)\b/i,
      /\b(charter\s*spectrum)\b/i,
      /\b(verizon)\b/i,
      /\b(at&t)\b/i,
      /\b(t-mobile)\b/i,
    ],
  },

  // ── Health & Fitness ──────────────────────────────────────────────────
  {
    id: 'health',
    name: 'Health',
    group: 'Wellness',
    priority: 5,
    patterns: [
      /\b(gym)\b/i,
      /\b(fitness)\b/i,
      /\b(health\s*club)\b/i,
      /\b(medical)\b/i,
      /\b(pharmacy)\b/i,
      /\b(hospital)\b/i,
      /\b(clinic)\b/i,
      /\b(dental)\b/i,
      /\b(health\s*insurance)\b/i,
    ],
  },
  {
    id: 'fitness',
    name: 'Fitness',
    group: 'Wellness',
    priority: 4,
    patterns: [
      /\b(gym)\b/i,
      /\b(fitness)\b/i,
      /\b(health\s*club)\b/i,
      /\b(peloton)\b/i,
      /\b(planet\s*fitness)\b/i,
      /\b(24hour\s*fitness)\b/i,
      /\b(anytime\s*fitness)\b/i,
    ],
  },
  {
    id: 'medical',
    name: 'Medical',
    group: 'Wellness',
    priority: 4,
    patterns: [
      /\b(medical)\b/i,
      /\b(pharmacy)\b/i,
      /\b(hospital)\b/i,
      /\b(clinic)\b/i,
      /\b(dental)\b/i,
      /\b(viu)\b/i,
      /\b(asknurse)\b/i,
    ],
  },

  // ── Education ──────────────────────────────────────────────────────────
  {
    id: 'education',
    name: 'Education',
    group: 'Learning',
    priority: 4,
    patterns: [
      /\b(coursera)\b/i,
      /\b(udemy)\b/i,
      /\b(udacity)\b/i,
      /\b(skillshare)\b/i,
      /\b(linkedin\s*learning)\b/i,
      /\b(pluralsight)\b/i,
      /\b(edx)\b/i,
    ],
  },

  // ── Media & News ───────────────────────────────────────────────────────
  {
    id: 'news',
    name: 'News',
    group: 'Media',
    priority: 4,
    patterns: [
      /\b(news)\b/i,
      /\b(newspaper)\b/i,
      /\b(magazine)\b/i,
      /\b(journal)\b/i,
      /\b(wall\s*street\s*journal)\b/i,
      /\b(new\s*york\s*times)\b/i,
      /\b(washington\s*post)\b/i,
      /\b(economist)\b/i,
    ],
  },

  // ── Shopping & Subscriptions ───────────────────────────────────────────
  {
    id: 'shopping',
    name: 'Shopping',
    group: 'Retail',
    priority: 3,
    patterns: [
      /\b(amazon)\b/i,
      /\b(ebay)\b/i,
      /\b(walmart)\b/i,
      /\b(target)\b/i,
      /\b(etsy)\b/i,
    ],
  },
  {
    id: 'box',
    name: 'Subscription Box',
    group: 'Retail',
    priority: 3,
    patterns: [
      /\b(subscription\s*box)\b/i,
      /\b(stitch\s*fix)\b/i,
      /\b(blueapron)\b/i,
      /\b(hellofresh)\b/i,
    ],
  },

  // ── Travel & Transport ─────────────────────────────────────────────────
  {
    id: 'travel',
    name: 'Travel',
    group: 'Transportation',
    priority: 3,
    patterns: [
      /\b(uber)\b/i,
      /\b(lyft)\b/i,
      /\b(grab)\b/i,
      /\b(bookings)\b/i,
      /\b(expedia)\b/i,
      /\b(airbnb)\b/i,
    ],
  },

  // ── Insurance ──────────────────────────────────────────────────────────
  {
    id: 'insurance',
    name: 'Insurance',
    group: 'Protection',
    priority: 4,
    patterns: [
      /\b(insurance)\b/i,
      /\b(allstate)\b/i,
      /\b(progressive)\b/i,
      /\b(state\s*farm)\b/i,
      /\b(geico)\b/i,
    ],
  },

  // ── Phone & Device ─────────────────────────────────────────────────────
  {
    id: 'device',
    name: 'Device',
    group: 'Technology',
    priority: 3,
    patterns: [
      /\b(iphone)\b/i,
      /\b(samsung)\b/i,
      /\b(apple)\b/i,
      /\b(device)\b/i,
      /\b(phone)\b/i,
    ],
  },
]

// Organize categories by group for display
export function getCategoriesByGroup(rules: CategoryRule[] = DEFAULT_CATEGORY_RULES): Record<string, CategoryRule[]> {
  const grouped: Record<string, CategoryRule[]> = {}
  
  for (const rule of rules) {
    const group = rule.group || 'Other'
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(rule)
  }
  
  return grouped
}

// Get all category names
export function getCategoryNames(rules: CategoryRule[] = DEFAULT_CATEGORY_RULES): string[] {
  return rules.map((r) => r.name)
}

// Get category by ID
export function getCategoryById(id: string, rules: CategoryRule[] = DEFAULT_CATEGORY_RULES): CategoryRule | undefined {
  return rules.find((r) => r.id === id)
}

// Infer categories for a merchant
export function inferCategories(
  merchantName: string,
  description: string,
  rules: CategoryRule[] = DEFAULT_CATEGORY_RULES
): CategoryRule[] {
  const text = (merchantName + ' ' + description).toLowerCase()
  const matched: CategoryRule[] = []
  
  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        if (!matched.find((m) => m.id === rule.id)) {
          matched.push(rule)
        }
        break
      }
    }
  }
  
  // Sort by priority (higher first)
  matched.sort((a, b) => (b.priority || 0) - (a.priority || 0))
  
  return matched
}

// Get the primary category (highest priority match)
export function getPrimaryCategory(
  merchantName: string,
  description: string,
  rules: CategoryRule[] = DEFAULT_CATEGORY_RULES
): CategoryRule | null {
  const matched = inferCategories(merchantName, description, rules)
  return matched.length > 0 ? matched[0] : null
}

// Convert CategoryRule to simple string (for storage)
export function categoryToName(rule: CategoryRule): string {
  return rule.name
}

// Convert string back to category (for loading from DB)
export function nameToCategory(name: string, rules: CategoryRule[] = DEFAULT_CATEGORY_RULES): CategoryRule | undefined {
  return rules.find((r) => r.name === name)
}
