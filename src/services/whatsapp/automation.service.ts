// In-memory automation rules store (can be configured in Settings > Automation)
export interface AutomationRule {
  id: string;
  keywords: string[]; // e.g. ["hi", "hello", "vanakkam"]
  matchType: 'EXACT' | 'CONTAINS';
  replyText: string;
  enabled: boolean;
  label: string;
}

export interface AutomationSettings {
  autoReplyEnabled: boolean;
  welcomeMessage: string;
  fallbackMessage: string;
  rules: AutomationRule[];
}

export const defaultAutomationSettings: AutomationSettings = {
  autoReplyEnabled: true,
  welcomeMessage: `👋 Welcome to our WhatsApp Support!\n\nHow can we help you today? Reply with a number:\n1️⃣ View Pricing & Plans\n2️⃣ Book Free Consultation / Demo\n3️⃣ Download Brochure / Catalog\n4️⃣ Talk to Human Agent`,
  fallbackMessage: `Thank you for your message! Our team will get back to you shortly. You can type *MENU* or *HI* anytime to view main options.`,
  rules: [
    {
      id: 'rule-greeting',
      label: 'Welcome & Main Menu',
      keywords: ['hi', 'hello', 'hey', 'start', 'menu', 'vanakkam', 'வணக்கம்'],
      matchType: 'CONTAINS',
      replyText: `👋 Welcome to our WhatsApp Support!\n\nHow can we help you today? Reply with a number or keyword:\n1️⃣ View Pricing & Plans\n2️⃣ Book Free Consultation / Demo\n3️⃣ Download Brochure / Catalog\n4️⃣ Talk to Human Agent`,
      enabled: true,
    },
    {
      id: 'rule-pricing',
      label: 'Pricing & Packages',
      keywords: ['1', 'price', 'pricing', 'plan', 'plans', 'cost', 'rate', 'quote'],
      matchType: 'CONTAINS',
      replyText: `💰 *Pricing & Plans*\n\n• Essential Plan: ₹2,000/sq.ft\n• Premium Plan: ₹2,150/sq.ft\n• Elite Plan: ₹2,300/sq.ft\n\nReply *DEMO* or *2* to get a live consultation callback!`,
      enabled: true,
    },
    {
      id: 'rule-demo',
      label: 'Request Consultation / Demo',
      keywords: ['2', 'demo', 'call', 'callback', 'consult', 'consultation', 'contact'],
      matchType: 'CONTAINS',
      replyText: `🎉 Thank you! Our sales specialist has been notified and will call you shortly on this number.\n\nReply *MENU* to return to main options.`,
      enabled: true,
    },
    {
      id: 'rule-catalog',
      label: 'Catalog & Brochure Download',
      keywords: ['3', 'catalog', 'catalogue', 'brochure', 'portfolio', 'pdf'],
      matchType: 'CONTAINS',
      replyText: `📄 *Product & Service Catalog*\n\nYou can view and download our complete catalog here:\nhttps://whatsup.grownoww.com/brochure.pdf\n\nReply *MENU* to see all options.`,
      enabled: true,
    },
    {
      id: 'rule-agent',
      label: 'Human Support Agent',
      keywords: ['4', 'agent', 'support', 'human', 'help', 'executive'],
      matchType: 'CONTAINS',
      replyText: `🧑‍💻 An active support executive has been assigned to your chat.\n\nPlease type your message below and we will answer right away!`,
      enabled: true,
    },
  ],
};

// Global in-memory instance
let currentSettings: AutomationSettings = { ...defaultAutomationSettings };

export class AutomationConfigService {
  static getSettings(): AutomationSettings {
    return currentSettings;
  }

  static updateSettings(newSettings: Partial<AutomationSettings>): AutomationSettings {
    currentSettings = {
      ...currentSettings,
      ...newSettings,
      rules: newSettings.rules || currentSettings.rules,
    };
    return currentSettings;
  }

  static matchReply(incomingText: string): string | null {
    if (!currentSettings.autoReplyEnabled) return null;

    const clean = incomingText.trim().toLowerCase();
    if (!clean) return null;

    // Check custom rules
    for (const rule of currentSettings.rules) {
      if (!rule.enabled) continue;

      const matches = rule.keywords.some(kw => {
        const cleanKw = kw.trim().toLowerCase();
        if (!cleanKw) return false;
        if (rule.matchType === 'EXACT') {
          return clean === cleanKw;
        }
        return clean.includes(cleanKw);
      });

      if (matches) {
        return rule.replyText;
      }
    }

    return null;
  }
}
