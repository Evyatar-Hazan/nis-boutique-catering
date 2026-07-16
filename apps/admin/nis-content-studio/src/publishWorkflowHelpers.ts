export type ActiveView =
  | 'site-map'
  | 'hero'
  | 'intro-band'
  | 'contact'
  | 'manifesto'
  | 'services'
  | 'experience-lab'
  | 'site-copy'
  | 'site-microcopy'
  | 'audience'
  | 'process'
  | 'story'
  | 'coordination'
  | 'real-media'
  | 'gallery'
  | 'faq'
  | 'media'
  | 'admins'
  | 'publish';

export type PublishState = 'clean' | 'draft' | 'saving' | 'publishing' | 'checking' | 'published' | 'live' | 'error';
export type PublishStepState = 'done' | 'active' | 'pending' | 'blocked' | 'error';

export type StudioWorkflowStep = {
  readonly step: string;
  readonly title: string;
  readonly text: string;
  readonly state: PublishStepState;
};

export type OwnerVerificationItem = {
  readonly title: string;
  readonly text: string;
  readonly state: PublishStepState;
};

export const getStudioWorkflowSteps = (
  activeView: ActiveView,
  publishState: PublishState,
  hasErrors: boolean,
  hasPublishUrl: boolean,
): readonly StudioWorkflowStep[] => {
  if (hasErrors) {
    return [
      { step: '1', title: 'עריכה', text: 'יש שדה שצריך לתקן', state: 'error' },
      { step: '2', title: 'תצוגה מקדימה', text: 'אפשר לבדוק מה השתנה', state: activeView === 'site-map' ? 'pending' : 'active' },
      { step: '3', title: 'שמירת טיוטה', text: 'חסום עד שהתוכן תקין', state: 'blocked' },
      { step: '4', title: 'עדכון האתר', text: 'חסום עד שאין שגיאות', state: 'blocked' },
    ];
  }

  const isEditingView = activeView !== 'site-map' && activeView !== 'publish';
  const isPublishView = activeView === 'publish' || publishState === 'publishing' || publishState === 'checking' || publishState === 'published' || publishState === 'live';
  const isSaved = publishState === 'draft' || publishState === 'publishing' || publishState === 'checking' || publishState === 'published' || publishState === 'live';
  const saveIsActive = publishState === 'saving';
  const publishIsActive = publishState === 'publishing' || publishState === 'checking' || publishState === 'published';

  return [
    {
      step: '1',
      title: 'עריכה',
      text: isEditingView ? 'כותבים ומשנים את האזור הנוכחי' : 'בחרו אזור לעריכה',
      state: isEditingView ? 'active' : isSaved || isPublishView ? 'done' : 'pending',
    },
    {
      step: '2',
      title: 'תצוגה מקדימה',
      text: isEditingView ? 'בדקו מחשב ומובייל לפני שמירה' : 'נפתחת בתוך כל מסך עריכה',
      state: isEditingView ? 'active' : isSaved || isPublishView ? 'done' : 'pending',
    },
    {
      step: '3',
      title: 'שמירת טיוטה',
      text: saveIsActive ? 'שומר עכשיו ל-Google Sheets' : isSaved ? 'הטיוטה נשמרה' : 'שומר ל-Sheets בלי לשנות את האתר',
      state: saveIsActive ? 'active' : isSaved ? 'done' : 'pending',
    },
    {
      step: '4',
      title: 'עדכון האתר',
      text: !hasPublishUrl ? 'חסר חיבור פרסום מאובטח' : publishState === 'live' ? 'האתר החי עודכן' : publishIsActive ? 'הענן בונה ובודק גרסה חיה' : 'מפרסם רק אחרי שמירה ובדיקה',
      state: !hasPublishUrl ? 'blocked' : publishState === 'live' ? 'done' : publishIsActive ? 'active' : isPublishView ? 'active' : 'pending',
    },
  ];
};

export const getOwnerVerificationChecklist = (
  publishState: PublishState,
  hasErrors: boolean,
  hasPublishUrl: boolean,
): readonly OwnerVerificationItem[] => {
  const hasSavedDraft = publishState === 'draft' || publishState === 'publishing' || publishState === 'checking' || publishState === 'published' || publishState === 'live';
  const isPublishing = publishState === 'publishing' || publishState === 'checking' || publishState === 'published';
  const isLive = publishState === 'live';

  if (hasErrors) {
    return [
      { title: 'Login מורשה', text: 'המסך הזה מופיע רק אחרי כניסה מורשית לסטודיו.', state: 'done' },
      { title: 'שמירה אמיתית ל-Sheets', text: 'חסום עד שמתקנים את שגיאת התוכן שמופיעה למעלה.', state: 'blocked' },
      { title: 'פרסום אמיתי', text: 'חסום עד שהתוכן תקין ואפשר לשמור.', state: 'blocked' },
      { title: 'בדיקת האתר החי', text: 'תתבצע אחרי פרסום מוצלח.', state: 'pending' },
      { title: 'Refresh ושחזור Session', text: 'אחרי Login, לרענן את הדף ולוודא שנשארים מחוברים.', state: 'pending' },
    ];
  }

  if (!hasPublishUrl) {
    return [
      { title: 'Login מורשה', text: 'המסך הזה מופיע רק אחרי כניסה מורשית לסטודיו.', state: 'done' },
      { title: 'שמירה אמיתית ל-Sheets', text: hasSavedDraft ? 'טיוטה נשמרה ל-Sheets.' : 'לחצו שמור כטיוטה אחרי שינוי קטן ומכוון.', state: hasSavedDraft ? 'done' : 'pending' },
      { title: 'פרסום אמיתי', text: 'חסר חיבור פרסום מאובטח, לכן אי אפשר להפעיל עדכון אתר.', state: 'blocked' },
      { title: 'בדיקת האתר החי', text: 'מחכה לחיבור פרסום.', state: 'pending' },
      { title: 'Refresh ושחזור Session', text: 'אחרי Login, לרענן את הדף ולוודא שנשארים מחוברים.', state: 'pending' },
    ];
  }

  return [
    { title: 'Login מורשה', text: 'המסך הזה מופיע רק אחרי כניסה מורשית לסטודיו.', state: 'done' },
    { title: 'שמירה אמיתית ל-Sheets', text: hasSavedDraft ? 'טיוטה נשמרה ל-Sheets.' : 'לחצו שמור כטיוטה אחרי שינוי קטן ומכוון.', state: hasSavedDraft ? 'done' : 'pending' },
    {
      title: 'פרסום אמיתי',
      text: isLive ? 'הפרסום הסתיים והסטודיו זיהה את הגרסה באתר החי.' : isPublishing ? 'הפרסום נשלח והסטודיו עוקב אחרי האתר החי.' : 'לחצו עדכן אתר רק אחרי שמירה ובדיקת preview.',
      state: isLive ? 'done' : isPublishing ? 'active' : 'pending',
    },
    {
      title: 'בדיקת האתר החי',
      text: isLive ? 'לפתוח את האתר ולוודא שהשינוי נראה גם ללקוח.' : isPublishing ? 'מחכה שהאתר החי יגיש את הגרסה החדשה.' : 'ייפתח אחרי פרסום אמיתי.',
      state: isLive ? 'done' : isPublishing ? 'active' : 'pending',
    },
    { title: 'Refresh ושחזור Session', text: 'אחרי Login, לרענן את הדף ולוודא שנשארים מחוברים.', state: 'pending' },
  ];
};

export const getPublishSteps = (
  publishState: PublishState,
  hasErrors: boolean,
  hasPublishUrl: boolean,
): readonly { readonly step: string; readonly title: string; readonly text: string; readonly state: PublishStepState }[] => {
  if (hasErrors) {
    return [
      { step: '1', title: 'בדיקת שגיאות', text: 'צריך לתקן לפני פרסום', state: 'error' },
      { step: '2', title: 'שמירה', text: 'מחכה לתיקון', state: 'blocked' },
      { step: '3', title: 'שליחה לפרסום', text: 'חסום עד שהתוכן תקין', state: 'blocked' },
      { step: '4', title: 'אימות אתר חי', text: 'ייפתח אחרי שליחה מוצלחת', state: 'blocked' },
    ];
  }

  if (!hasPublishUrl) {
    return [
      { step: '1', title: 'בדיקת שגיאות', text: 'אין שגיאות ידועות', state: 'done' },
      { step: '2', title: 'שמירה', text: publishState === 'draft' ? 'הטיוטה נשמרה' : 'כדאי לשמור לפני פרסום', state: publishState === 'draft' ? 'done' : 'pending' },
      { step: '3', title: 'שליחה לפרסום', text: 'חסר חיבור פרסום מאובטח', state: 'blocked' },
      { step: '4', title: 'אימות אתר חי', text: 'מחכה להגדרת publish URL', state: 'blocked' },
    ];
  }

  const isSaved = publishState === 'draft' || publishState === 'publishing' || publishState === 'checking' || publishState === 'published' || publishState === 'live';
  const isPublishing = publishState === 'publishing' || publishState === 'checking' || publishState === 'published';

  return [
    { step: '1', title: 'בדיקת שגיאות', text: 'אין שגיאות ידועות', state: 'done' },
    { step: '2', title: 'שמירה', text: isSaved ? 'הטיוטה נשמרה' : 'כדאי לשמור לפני פרסום', state: isSaved ? 'done' : 'pending' },
    {
      step: '3',
      title: 'שליחה לפרסום',
      text: publishState === 'live' ? 'הגרסה החיה עודכנה' : isPublishing ? 'הענן בונה את העדכון' : 'לוחצים "עדכן אתר" כדי לשלוח לפרסום',
      state: publishState === 'live' ? 'done' : isPublishing ? 'active' : 'pending',
    },
    {
      step: '4',
      title: 'אימות אתר חי',
      text: publishState === 'live' ? 'הסטודיו זיהה את הגרסה החדשה באתר החי' : isPublishing ? 'מחכה שהאתר החי יחזיר את הגרסה החדשה' : 'יתבצע אוטומטית אחרי השליחה',
      state: publishState === 'live' ? 'done' : isPublishing ? 'active' : 'pending',
    },
  ];
};
