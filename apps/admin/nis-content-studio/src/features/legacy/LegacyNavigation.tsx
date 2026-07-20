import { FileText, Images, Phone, Rocket, ShieldCheck, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

export type LegacyAdminTab = 'admins' | 'sections' | 'services' | 'gallery' | 'contact' | 'publish';

type TabDefinition = {
  readonly id: LegacyAdminTab;
  readonly label: string;
  readonly help: string;
  readonly icon: ReactNode;
};

const tabs: readonly TabDefinition[] = [
  { id: 'admins', label: 'ניהול אדמינים', help: 'הרשאות כניסה והוספת מנהלים', icon: <ShieldCheck aria-hidden="true" /> },
  { id: 'sections', label: 'אזורי תוכן', help: 'כותרות, טקסטים וסדר הופעה', icon: <FileText aria-hidden="true" /> },
  { id: 'services', label: 'חוויות אירוח', help: 'שירותים וכרטיסי מכירה', icon: <Sparkles aria-hidden="true" /> },
  { id: 'gallery', label: 'גלריה', help: 'תמונות, קטגוריות והעלאה ל־Drive', icon: <Images aria-hidden="true" /> },
  { id: 'contact', label: 'יצירת קשר ו־SEO', help: 'טלפון, וואטסאפ ושיתוף קישורים', icon: <Phone aria-hidden="true" /> },
  { id: 'publish', label: 'פרסום', help: 'שמירה, בנייה ובדיקת אתר חי', icon: <Rocket aria-hidden="true" /> },
];

export const LegacyNavigation = ({
  activeTab,
  onChange,
}: {
  readonly activeTab: LegacyAdminTab;
  readonly onChange: (tab: LegacyAdminTab) => void;
}) => (
  <nav className="admin-tabs" aria-label="ניווט פאנל ניהול">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        className={activeTab === tab.id ? 'is-active' : ''}
        onClick={() => onChange(tab.id)}
        aria-current={activeTab === tab.id ? 'page' : undefined}
      >
        {tab.icon}
        <span><strong>{tab.label}</strong><small>{tab.help}</small></span>
      </button>
    ))}
  </nav>
);
