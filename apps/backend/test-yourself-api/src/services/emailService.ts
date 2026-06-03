import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    // במציאות תשתמש בספק מייל אמיתי כמו Gmail, SendGrid וכו'
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true ל-465, false לפורטים אחרים
    auth: {
      user: process.env.SMTP_USER || 'test@example.com',
      pass: process.env.SMTP_PASS || 'password'
    }
  });

  static async sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
    try {
      // במצב פיתוח, רק נדפיס ללוג במקום לשלוח מייל באמת
      if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
        console.log(`📧 [DEV] Verification email for ${email}:`);
        console.log(`🔗 Verification link: ${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`);
        return true;
      }

      const verificationLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@test-yourself.com',
        to: email,
        subject: 'אמת את כתובת המייל שלך - Test Yourself',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>שלום ${name}!</h2>
            <p>תודה שנרשמת ל-Test Yourself. כדי להשלים את הרשמתך, אנא לחץ על הקישור הבא כדי לאמת את כתובת המייל שלך:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                אמת מייל
              </a>
            </div>
            
            <p>אם לא תוכל ללחוץ על הכפתור, העתק והדבק את הקישור הבא בדפדפן:</p>
            <p style="word-break: break-all; color: #666;">${verificationLink}</p>
            
            <p>הקישור תקף ל-24 שעות.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px;">
              אם לא נרשמת לאתר שלנו, אנא התעלם ממייל זה.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  }

  static async sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
    try {
      const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@test-yourself.com',
        to: email,
        subject: 'איפוס סיסמה - Test Yourself',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>שלום ${name}!</h2>
            <p>קיבלנו בקשה לאיפוס הסיסמה של החשבון שלך. לחץ על הקישור הבא כדי לאפס את הסיסמה:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #dc3545; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                אפס סיסמה
              </a>
            </div>
            
            <p>אם לא תוכל ללחוץ על הכפתור, העתק והדבק את הקישור הבא בדפדפן:</p>
            <p style="word-break: break-all; color: #666;">${resetLink}</p>
            
            <p>הקישור תקף ל-1 שעה בלבד.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px;">
              אם לא ביקשת לאפס את הסיסמה, אנא התעלם ממייל זה. החשבון שלך בטוח.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  static async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@test-yourself.com',
        to: email,
        subject: 'ברוכים הבאים ל-Test Yourself!',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>ברוכים הבאים, ${name}! 🎉</h2>
            <p>כתובת המייל שלך אומתה בהצלחה. כעת תוכל להתחיל ליהנות מכל הפיצ'רים של Test Yourself:</p>
            
            <ul style="text-align: right; margin: 20px 0;">
              <li>יצירת מבחנים מותאמים אישית</li>
              <li>שיתוף מבחנים עם חברים</li>
              <li>מעקב אחר הביצועים שלך</li>
              <li>משוב מפורט על התוצאות</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" 
                 style="background-color: #28a745; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                התחל עכשיו
              </a>
            </div>
            
            <p>אם יש לך שאלות, אנחנו כאן לעזור!</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px;">
              תודה שבחרת ב-Test Yourself!
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }
}