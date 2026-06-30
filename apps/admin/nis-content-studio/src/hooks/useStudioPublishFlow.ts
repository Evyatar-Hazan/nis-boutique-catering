import { useCallback, useState } from 'react';
import { saveContentToSheets, triggerPublish } from '../googleApi';
import { formatError } from '../studioHelpers';
import type { PublishState } from '../publishWorkflowHelpers';
import type { ContentSnapshot } from '@monorepo/content-schema';

export type PublishProgress = {
  readonly targetVersion: string;
  readonly liveUrl: string;
  readonly totalAttempts: number;
  readonly attempt?: number;
  readonly checkedAt?: string;
  readonly lastBundleUrl?: string;
};

const wait = (milliseconds: number) => new Promise((resolve) => {
  window.setTimeout(resolve, milliseconds);
});

const fetchPublicText = async (url: string) => {
  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}nis_check=${Date.now()}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Could not read ${url}`);
  }
  return response.text();
};

const findBundleUrl = (html: string, publicSiteOrigin: string) => {
  const match = html.match(/<script[^>]+src="([^"]*assets\/index-[^"]+\.js)"/);
  return match ? new URL(match[1] ?? '', publicSiteOrigin).href : null;
};

const isLiveSiteVersion = async (version: string, publicSiteOrigin: string) => {
  const html = await fetchPublicText(`${publicSiteOrigin}/`);
  const bundleUrl = findBundleUrl(html, publicSiteOrigin);
  if (!bundleUrl) {
    return { live: false, bundleUrl: undefined };
  }

  const bundle = await fetchPublicText(bundleUrl);
  return {
    live: bundle.includes(version) || bundle.includes(JSON.stringify(version)),
    bundleUrl,
  };
};

const waitForLiveSiteVersion = async (
  version: string,
  publicSiteOrigin: string,
  liveVersionPollAttempts: number,
  liveVersionPollDelayMs: number,
  onProgress: (progress: {
    readonly attempt: number;
    readonly totalAttempts: number;
    readonly checkedAt: string;
    readonly bundleUrl?: string;
    readonly message: string;
  }) => void,
) => {
  for (let attempt = 1; attempt <= liveVersionPollAttempts; attempt += 1) {
    const checkedAt = new Date().toISOString();
    const result = await isLiveSiteVersion(version, publicSiteOrigin);
    if (result.live) {
      onProgress({
        attempt,
        totalAttempts: liveVersionPollAttempts,
        checkedAt,
        bundleUrl: result.bundleUrl,
        message: `האתר החי כבר מגיש את גרסת ${version}.`,
      });
      return {
        attempt,
        totalAttempts: liveVersionPollAttempts,
        checkedAt,
        bundleUrl: result.bundleUrl,
      };
    }

    if (attempt < liveVersionPollAttempts) {
      onProgress({
        attempt,
        totalAttempts: liveVersionPollAttempts,
        checkedAt,
        bundleUrl: result.bundleUrl,
        message: `Cloudflare עדיין בונה או מפיץ את גרסת ${version}. בדיקה ${attempt}/${liveVersionPollAttempts}; נבדוק שוב בעוד ${Math.round(liveVersionPollDelayMs / 1000)} שניות.`,
      });
      await wait(liveVersionPollDelayMs);
    }
  }

  throw new Error(`הפרסום נשלח, אבל אחרי ${liveVersionPollAttempts} בדיקות במשך בערך ${Math.round((liveVersionPollAttempts * liveVersionPollDelayMs) / 60000)} דקות הסטודיו עדיין לא רואה את גרסת ${version} באתר החי. לרוב זה אומר ש-Cloudflare עדיין בונה, או שהפרסום נכשל בשרת הפרסום.`);
};

type UseStudioPublishFlowArgs = {
  readonly authState: 'signed-out' | 'loading' | 'authorized' | 'denied';
  readonly session: { readonly accessToken: string } | null;
  readonly content: ContentSnapshot;
  readonly hasErrors: boolean;
  readonly publicSiteOrigin: string;
  readonly liveVersionPollAttempts: number;
  readonly liveVersionPollDelayMs: number;
  readonly getFreshAccessToken: () => Promise<string>;
  readonly onBusyChange: (isBusy: boolean) => void;
  readonly onStatusChange: (status: string) => void;
  readonly onContentReplace?: (content: ContentSnapshot) => void;
};

export const useStudioPublishFlow = ({
  authState,
  session,
  content,
  hasErrors,
  publicSiteOrigin,
  liveVersionPollAttempts,
  liveVersionPollDelayMs,
  getFreshAccessToken,
  onBusyChange,
  onStatusChange,
}: UseStudioPublishFlowArgs) => {
  const [publishState, setPublishState] = useState<PublishState>('clean');
  const [publishProgress, setPublishProgress] = useState<PublishProgress | null>(null);

  const markDraft = useCallback(() => {
    if (authState === 'authorized') {
      setPublishProgress(null);
      setPublishState('draft');
      onStatusChange('יש שינויים שלא פורסמו עדיין. לחצו "עדכן אתר" כדי להעלות אותם לאתר החי.');
    }
  }, [authState, onStatusChange]);

  const resetPublishFlow = useCallback(() => {
    setPublishProgress(null);
    setPublishState('clean');
  }, []);

  const runTask = useCallback(async (label: string, task: () => Promise<void>) => {
    onBusyChange(true);
    onStatusChange(`${label}...`);
    try {
      await task();
    } catch (error) {
      setPublishState('error');
      onStatusChange(formatError(error));
    } finally {
      onBusyChange(false);
    }
  }, [onBusyChange, onStatusChange]);

  const saveDraft = useCallback(async (successMessage = 'נשמר כטיוטה ב-Google Sheets. האתר החי עדיין לא השתנה.') => {
    if (!session) {
      throw new Error('צריך להתחבר לפני שמירה.');
    }
    if (hasErrors) {
      throw new Error('יש שדות שצריך לתקן לפני שמירה.');
    }

    setPublishState('saving');
    const accessToken = await getFreshAccessToken();
    await saveContentToSheets(accessToken, { ...content, updatedAt: new Date().toISOString() });
    setPublishState('draft');
    onStatusChange(successMessage);
  }, [content, getFreshAccessToken, hasErrors, onStatusChange, session]);

  const handleSaveDraft = useCallback(() => {
    void runTask('שומרים טיוטה', saveDraft);
  }, [runTask, saveDraft]);

  const persistDraft = useCallback((taskLabel: string, successMessage: string) => {
    void runTask(taskLabel, async () => {
      await saveDraft(successMessage);
    });
  }, [runTask, saveDraft]);

  const handleUpdateSite = useCallback(() => {
    if (!session) {
      return;
    }

    void (async () => {
      const targetVersion = content.settings.siteVersion || content.version;
      const initialProgress: PublishProgress = {
        targetVersion,
        liveUrl: publicSiteOrigin,
        totalAttempts: liveVersionPollAttempts,
      };
      onBusyChange(true);
      setPublishProgress(initialProgress);
      onStatusChange(`מכינים פרסום לגרסת ${targetVersion}. קודם שומרים טיוטה, אחר כך שולחים לבנייה.`);
      try {
        await saveDraft();
        setPublishState('publishing');
        onStatusChange('הטיוטה נשמרה. שולחים את הפרסום ל-Cloudflare דרך השרת המאובטח.');
        const accessToken = await getFreshAccessToken();
        await triggerPublish(accessToken);

        setPublishState('published');
        onStatusChange(`הפרסום נשלח. Cloudflare קיבל את גרסת ${targetVersion} ומתחיל לבנות.`);
        await wait(900);

        setPublishState('checking');
        onStatusChange(`הפרסום נשלח. Cloudflare בונה עכשיו את גרסת ${targetVersion}; הסטודיו בודק מתי האתר החי מגיש אותה.`);
        onBusyChange(false);
        const liveProgress = await waitForLiveSiteVersion(
          targetVersion,
          publicSiteOrigin,
          liveVersionPollAttempts,
          liveVersionPollDelayMs,
          ({ attempt, bundleUrl, checkedAt, message, totalAttempts }) => {
            setPublishState('checking');
            setPublishProgress({
              targetVersion,
              liveUrl: publicSiteOrigin,
              totalAttempts,
              attempt,
              checkedAt,
              lastBundleUrl: bundleUrl,
            });
            onStatusChange(message);
          },
        );
        setPublishState('live');
        setPublishProgress({
          targetVersion,
          liveUrl: publicSiteOrigin,
          totalAttempts: liveProgress.totalAttempts,
          attempt: liveProgress.attempt,
          checkedAt: liveProgress.checkedAt,
          lastBundleUrl: liveProgress.bundleUrl,
        });
        onStatusChange(`האתר החי עודכן ומגיש עכשיו את גרסת ${targetVersion}.`);
      } catch (error) {
        setPublishState('error');
        onStatusChange(formatError(error));
      } finally {
        onBusyChange(false);
      }
    })();
  }, [
    content,
    getFreshAccessToken,
    liveVersionPollAttempts,
    liveVersionPollDelayMs,
    onBusyChange,
    onStatusChange,
    publicSiteOrigin,
    saveDraft,
    session,
  ]);

  return {
    publishState,
    publishProgress,
    markDraft,
    resetPublishFlow,
    runTask,
    saveDraft,
    handleSaveDraft,
    persistDraft,
    handleUpdateSite,
    setPublishState,
    setPublishProgress,
  };
};
