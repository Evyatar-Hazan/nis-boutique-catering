import { Check, Copy, Palette, RotateCcw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  applyPalette,
  buildPaletteUrl,
  initializePalette,
  isPaletteLabEnabled,
  persistPalette,
} from './paletteSelection';
import { paletteOptions, type PaletteId } from './palettes';
import './palette-lab.css';

type CopyStatus = 'idle' | 'copied' | 'failed';

export function PaletteLab() {
  const [isEnabled, setIsEnabled] = useState(() => isPaletteLabEnabled(window.location.search));
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState<PaletteId>(() => initializePalette());
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  useEffect(() => {
    const handlePopState = () => {
      const palette = initializePalette();
      setSelectedPalette(palette);
      setIsEnabled(isPaletteLabEnabled(window.location.search));
      setCopyStatus('idle');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!isEnabled) {
    return null;
  }

  const selectPalette = (palette: PaletteId) => {
    applyPalette(palette);
    persistPalette(palette, window.localStorage);
    const nextUrl = buildPaletteUrl(palette, new URL(window.location.href));
    window.history.replaceState(window.history.state, '', nextUrl);
    setSelectedPalette(palette);
    setCopyStatus('idle');
  };

  const copyPaletteLink = async () => {
    const shareUrl = buildPaletteUrl(selectedPalette, new URL(window.location.href));

    try {
      await navigator.clipboard.writeText(shareUrl.toString());
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  return (
    <aside className={`palette-lab${isOpen ? ' is-open' : ''}`} aria-label="מעבדת פלטות צבעים">
      <button
        type="button"
        className="palette-lab__trigger"
        aria-controls="palette-lab-panel"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Palette aria-hidden="true" size={18} />
        <span>השוואת צבעים</span>
      </button>

      {isOpen ? (
        <div className="palette-lab__panel" id="palette-lab-panel">
          <header className="palette-lab__header">
            <div>
              <span className="palette-lab__eyebrow">PALETTE LAB · 01–06</span>
              <h2>איזו אווירה מרגישה כמו Nis?</h2>
              <p>בחרו פלטה, גללו באתר ושלחו את הקישור המדויק ללקוחה.</p>
            </div>
            <button
              type="button"
              className="palette-lab__icon-button"
              aria-label="סגירת השוואת הצבעים"
              onClick={() => setIsOpen(false)}
            >
              <X aria-hidden="true" size={20} />
            </button>
          </header>

          <div className="palette-lab__options" aria-label="בחירת פלטת צבעים">
            {paletteOptions.map((option, index) => {
              const isSelected = option.id === selectedPalette;

              return (
                <button
                  type="button"
                  className="palette-lab__option"
                  data-palette-option={option.id}
                  aria-pressed={isSelected}
                  onClick={() => selectPalette(option.id)}
                  key={option.id}
                >
                  <span className="palette-lab__option-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="palette-lab__swatches" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className="palette-lab__option-copy">
                    <strong>{option.name}</strong>
                    <small>{option.description}</small>
                  </span>
                  <span className="palette-lab__check" aria-hidden="true">
                    {isSelected ? <Check size={17} /> : null}
                  </span>
                </button>
              );
            })}
          </div>

          <footer className="palette-lab__footer">
            <button type="button" className="palette-lab__action" onClick={copyPaletteLink}>
              <Copy aria-hidden="true" size={17} />
              {copyStatus === 'copied' ? 'הקישור הועתק' : 'העתקת קישור לפלטה'}
            </button>
            <button type="button" className="palette-lab__reset" onClick={() => selectPalette('original')}>
              <RotateCcw aria-hidden="true" size={16} />
              חזרה למקור
            </button>
            <span className="palette-lab__status" aria-live="polite">
              {copyStatus === 'failed' ? 'לא הצלחנו להעתיק. אפשר להעתיק משורת הכתובת.' : ''}
            </span>
          </footer>
        </div>
      ) : null}
    </aside>
  );
}
