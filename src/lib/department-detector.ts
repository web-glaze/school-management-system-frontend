/**
 * Smart department detector — keyword-based routing.
 *
 * Analyzes title + description text to suggest the right department
 * (Electrical, Plumbing, IT, etc.) without any AI/ML.
 *
 * Works deterministically:
 *  - Walks through known keywords for each category
 *  - Scores each match (more matches = stronger suggestion)
 *  - Returns the best-matching category with confidence
 *
 * Easy to extend — just add keywords to the table below.
 */

export type DetectedCategory =
  | "ELECTRICAL"
  | "PLUMBING"
  | "IT"
  | "CARPENTRY"
  | "CIVIL"
  | "HOUSEKEEPING"
  | "SECURITY"
  | "GENERAL";

interface CategoryRule {
  code: DetectedCategory;
  label: string;
  icon: string;
  /** Color hint for UI */
  color: string;
  /** Words/phrases that indicate this category. Lowercase. */
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    code: "ELECTRICAL",
    label: "Electrical",
    icon: "⚡",
    color: "amber",
    keywords: [
      // Devices
      "ac", "a.c.", "air condition", "cooler", "fan", "ceiling fan",
      "light", "bulb", "tube", "tubelight", "led",
      "switch", "socket", "plug", "wire", "wiring", "cable",
      "fuse", "mcb", "current", "voltage", "power", "electric",
      "electrical", "shock", "spark", "short circuit",
      "geyser", "heater", "iron",
      // Hindi / Hinglish
      "bijli", "current", "kharab", "andhera",
    ],
  },
  {
    code: "PLUMBING",
    label: "Plumbing",
    icon: "💧",
    color: "blue",
    keywords: [
      "water", "tap", "leak", "leakage", "drip", "pipe", "plumb",
      "drain", "drainage", "flush", "toilet", "wc", "bathroom",
      "washroom", "sink", "basin", "tank", "overflow",
      "shower", "geyser water", "clogged", "blocked",
      // Hindi
      "paani", "nal", "tapka", "bath",
    ],
  },
  {
    code: "IT",
    label: "IT / Computer",
    icon: "💻",
    color: "teal",
    keywords: [
      "wifi", "wi-fi", "internet", "network", "lan", "router",
      "computer", "pc", "desktop", "laptop", "monitor", "screen",
      "keyboard", "mouse", "cpu",
      "printer", "scanner", "fax", "copier", "xerox",
      "projector", "smart board", "smartboard",
      "software", "windows", "login", "password",
      "speaker", "microphone", "camera", "webcam",
      "cctv", "ip cam",
      "email", "outlook", "browser",
    ],
  },
  {
    code: "CARPENTRY",
    label: "Carpentry",
    icon: "🪚",
    color: "orange",
    keywords: [
      "door", "lock", "hinge", "key", "latch", "handle",
      "window frame", "table", "chair", "desk", "bench",
      "cupboard", "almirah", "shelf", "rack", "drawer",
      "wood", "wooden", "broken wood", "furniture", "polish",
      "board", "blackboard",
      // Hindi
      "darwaza", "kursi", "mez", "almari",
    ],
  },
  {
    code: "CIVIL",
    label: "Civil / Construction",
    icon: "🧱",
    color: "stone",
    keywords: [
      "paint", "painting", "wall", "plaster", "crack",
      "ceiling", "roof", "floor", "tile", "tiles", "cement",
      "concrete", "brick", "broken wall", "seepage", "dampness",
      "construction", "leakage ceiling",
      // Hindi
      "deewar", "chat", "fars", "rang",
    ],
  },
  {
    code: "HOUSEKEEPING",
    label: "Housekeeping",
    icon: "🧹",
    color: "green",
    keywords: [
      "clean", "cleaning", "dirty", "dust", "garbage", "trash",
      "waste", "sweep", "mop", "floor cleaning", "stink",
      "smell", "bad smell", "pest", "cockroach", "rat", "mouse",
      "insect", "ant", "lizard", "spider",
      // Hindi
      "safai", "ganda", "kachra",
    ],
  },
  {
    code: "SECURITY",
    label: "Security",
    icon: "🛡️",
    color: "rose",
    keywords: [
      "lock broken", "gate", "fence", "intruder", "theft",
      "stolen", "missing", "alarm", "siren", "guard",
      "security camera", "boundary",
    ],
  },
  {
    code: "GENERAL",
    label: "General Maintenance",
    icon: "🔧",
    color: "slate",
    keywords: ["glass", "mirror", "window", "broken glass"],
  },
];

interface DetectionResult {
  code: DetectedCategory;
  label: string;
  icon: string;
  color: string;
  confidence: "low" | "medium" | "high";
  matchedKeywords: string[];
}

/**
 * Run the detector against a text input (title + description).
 * Returns null if no keywords matched at all.
 */
export function detectDepartment(text: string): DetectionResult | null {
  const lower = text.toLowerCase();
  if (lower.trim().length < 3) return null;

  let best: { rule: CategoryRule; matches: string[]; score: number } | null =
    null;

  for (const rule of CATEGORY_RULES) {
    const matches: string[] = [];
    let score = 0;
    for (const kw of rule.keywords) {
      // Use word boundary to avoid partial matches (e.g. "ac" matching "back")
      const regex = new RegExp(`\\b${escapeRegex(kw)}\\b`, "i");
      if (regex.test(lower)) {
        matches.push(kw);
        // Multi-word phrases weighted higher
        score += kw.includes(" ") ? 3 : 1;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { rule: rule, matches, score };
    }
  }

  if (!best) return null;

  const confidence: "low" | "medium" | "high" =
    best.score >= 3 ? "high" : best.score >= 2 ? "medium" : "low";

  return {
    code: best.rule.code,
    label: best.rule.label,
    icon: best.rule.icon,
    color: best.rule.color,
    confidence,
    matchedKeywords: best.matches,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** All available categories — useful for dropdowns / admin pages. */
export function allCategories() {
  return CATEGORY_RULES.map(({ code, label, icon, color }) => ({
    code,
    label,
    icon,
    color,
  }));
}
