import { useEffect } from 'react';
import { email, phoneDisplay, phoneHref } from '../../data/siteContent';
import './accessibility-statement.css';

const updatedAt = '19 בנובמבר 2026';

export const AccessibilityStatementPage = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'הצהרת נגישות | Nis Boutique Catering';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="accessibility-page">
      <a className="skip-link" href="#accessibility-main">
        דלג לתוכן המרכזי
      </a>

      <header className="accessibility-header">
        <a className="accessibility-brand" href="/" aria-label="Nis Boutique Catering — חזרה לאתר">
          <strong>Nis</strong>
          <span>boutique catering</span>
        </a>
        <a className="accessibility-back-link" href="/">חזרה לאתר</a>
      </header>

      <main id="accessibility-main" className="accessibility-main" tabIndex={-1}>
        <article className="accessibility-statement" aria-labelledby="accessibility-title">
          <p className="accessibility-eyebrow">נגישות ושירות שוויוני</p>
          <h1 id="accessibility-title">הצהרת נגישות</h1>
          <p className="accessibility-lead">
            ב־Nis Boutique Catering חשוב לנו לאפשר לכל אדם לקבל מידע וליצור איתנו קשר באופן נוח,
            ברור ועצמאי ככל האפשר.
          </p>

          <section aria-labelledby="accessibility-standard">
            <h2 id="accessibility-standard">תקן היעד והבדיקות</h2>
            <p>
              האתר פותח ונבדק מול הדרישות הרלוונטיות של תקן ישראלי ת״י 5568 חלק 1 לנגישות
              תכנים באינטרנט, ברמת AA. בוצעו בדיקות אוטומטיות ובדיקות ידניות של מקלדת,
              מיקוד, מבנה סמנטי, ניגודיות, תצוגה במסכים שונים והפחתת תנועה. בדיקה ידנית
              מלאה באמצעות קורא מסך טרם הושלמה, ולכן נשמח לקבל דיווח על כל קושי.
            </p>
          </section>

          <section aria-labelledby="accessibility-adjustments">
            <h2 id="accessibility-adjustments">התאמות הנגישות באתר</h2>
            <ul>
              <li>ניווט ותפעול באמצעות מקלדת, כולל קישור דילוג לתוכן המרכזי.</li>
              <li>מבנה כותרות, אזורי עמוד ושמות נגישים לטכנולוגיות מסייעות.</li>
              <li>טקסט חלופי לתמונות תוכן ושמות ברורים לכפתורים ולקישורים.</li>
              <li>מיקוד מקלדת גלוי וניהול מיקוד בתפריט המובייל ובתצוגת התמונות.</li>
              <li>ניגודיות רכיבי הממשק המרכזיים שנבדקה מול רמת AA.</li>
              <li>התאמה לתצוגות מחשב, טאבלט וטלפון ללא גלילה אופקית.</li>
              <li>צמצום אנימציות כאשר מופעלת במכשיר ההעדפה להפחתת תנועה.</li>
              <li>שדות טופס עם תוויות, הוראות ושגיאות שניתנות לזיהוי גם ללא צבע.</li>
            </ul>
          </section>

          <section aria-labelledby="accessibility-environment">
            <h2 id="accessibility-environment">סביבת בדיקה ותאימות</h2>
            <p>
              האתר נבדק בדפדפן Chrome/Chromium עדכני בתצוגות מחשב וטלפון, באמצעות מקלדת
              וכלי בדיקה אוטומטיים. האתר מבוסס על תקני רשת מקובלים ומיועד לדפדפנים מודרניים.
              בדיקה ידנית מלאה ב־VoiceOver, ב־NVDA וב־TalkBack טרם הושלמה.
            </p>
          </section>

          <section aria-labelledby="accessibility-service">
            <h2 id="accessibility-service">התאמות בשירות</h2>
            <p>
              ניתן לבצע תיאום והזמנה בטלפון, ב־WhatsApp או בדואר אלקטרוני. אם נדרשת התאמה
              מסוימת בתהליך ההזמנה, האיסוף או האספקה, אפשר לפנות אלינו מראש ונעשה מאמץ לספק
              מענה מתאים. פרטי נקודת האיסוף נמסרים במסגרת תיאום ההזמנה. פירוט מלא ומאומת של
              הסדרי הנגישות הפיזיים בנקודת האיסוף טרם פורסם; עד להשלמתו, פנו אלינו לפני ההגעה
              לקבלת מידע ותיאום חלופה מתאימה.
            </p>
          </section>

          <section aria-labelledby="accessibility-limitations">
            <h2 id="accessibility-limitations">רכיבים חיצוניים ומגבלות ידועות</h2>
            <p>
              באתר קיימים קישורים לשירותים חיצוניים, ובהם WhatsApp, שהנגישות בתוכם נמצאת
              באחריות ספקי השירות. בדיקת קורא מסך ידנית מלאה ופירוט הסדרי הנגישות הפיזיים
              טרם הושלמו. אם נתקלתם בקושי, נשמח לקבל דיווח ולסייע בטלפון או בדואר אלקטרוני.
            </p>
          </section>

          <section aria-labelledby="accessibility-contact">
            <h2 id="accessibility-contact">איש קשר ופנייה בנושא נגישות</h2>
            <p>
              אם נתקלתם בקושי בשימוש באתר, כתבו לנו מה ניסיתם לבצע, באיזה עמוד, באיזה מכשיר
              ודפדפן, ובאיזו טכנולוגיה מסייעת השתמשתם אם רלוונטי.
            </p>
            <address className="accessibility-contact-list">
              <a href={phoneHref}>טלפון: {phoneDisplay}</a>
              <a href={`mailto:${email}`}>דואר אלקטרוני: {email}</a>
            </address>
          </section>

          <p className="accessibility-updated">הצהרה זו עודכנה לאחרונה בתאריך {updatedAt}.</p>
        </article>
      </main>
    </div>
  );
};
