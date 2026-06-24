import { MonitorCheck, Phone } from 'lucide-react';

type PreviewDevice = 'desktop' | 'mobile';

type PreviewHeaderProps = {
  readonly title: string;
  readonly text: string;
  readonly device: PreviewDevice;
  readonly onDeviceChange: (device: PreviewDevice) => void;
};

export const PreviewHeader = ({
  title,
  text,
  device,
  onDeviceChange,
}: PreviewHeaderProps) => (
  <div className="preview-header">
    <div>
      <p className="kicker">{title}</p>
      <p>{text}</p>
    </div>
    <div className="preview-device-switch" aria-label="בחירת תצוגה מקדימה">
      <button type="button" className={device === 'desktop' ? 'is-active' : ''} onClick={() => onDeviceChange('desktop')} aria-pressed={device === 'desktop'}>
        <MonitorCheck aria-hidden="true" />
        מחשב
      </button>
      <button type="button" className={device === 'mobile' ? 'is-active' : ''} onClick={() => onDeviceChange('mobile')} aria-pressed={device === 'mobile'}>
        <Phone aria-hidden="true" />
        מובייל
      </button>
    </div>
  </div>
);
