import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UploadPanel } from './UploadPanel';

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:test-preview');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('UploadPanel', () => {
  it('reuses one preview URL while the image description is edited', () => {
    const { container } = render(<UploadPanel onUploaded={vi.fn()} />);
    const picker = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(picker).not.toBeNull();

    const file = new File(['image'], 'מגש-ירקות.webp', { type: 'image/webp' });
    fireEvent.change(picker!, { target: { files: [file] } });

    const description = screen.getByRole('textbox');
    fireEvent.change(description, { target: { value: 'מגש ירקות לאירוח' } });
    fireEvent.change(description, { target: { value: 'מגש ירקות צבעוני לאירוח' } });

    expect(description).toHaveValue('מגש ירקות צבעוני לאירוח');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });
});
