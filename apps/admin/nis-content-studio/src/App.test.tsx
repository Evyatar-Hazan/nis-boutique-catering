import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { formatValidationIssue } from './validationHelpers';
import '@testing-library/jest-dom/vitest';

describe('Content Studio', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
  });

  afterEach(() => cleanup());

  it('shows only the private login gate before authentication', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'פאנל ניהול Nis' })).toBeInTheDocument();
    expect(screen.getByLabelText('כניסה עם Google')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /גלריה/ })).not.toBeInTheDocument();
    expect(screen.queryByText('תמונות וגלריה')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('מיני לחמניות אישיות')).not.toBeInTheDocument();
  });

  it('explains that the studio is private', () => {
    render(<App />);

    expect(screen.getByText(/כניסה למורשים בלבד/)).toBeInTheDocument();
    expect(screen.getByText(/Google מאמת זהות בלבד/)).toBeInTheDocument();
  });

  it('does not expose the old studio surface before login', () => {
    render(<App />);

    expect(screen.queryByText(/SiteMap/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nis Studio/)).not.toBeInTheDocument();
    expect(screen.queryByText(/תצוגה מקדימה כמו באתר/)).not.toBeInTheDocument();
  });

  it('shows the exact field when content validation fails', () => {
    expect(formatValidationIssue({ path: ['updatedAt'], message: 'Invalid input' })).toBe('שדה לא תקין: updatedAt - ערך לא תקין');
    expect(formatValidationIssue({ path: ['services', 0, 'title'], message: 'Too small' })).toBe('שדה לא תקין: services.0.title - Too small');
  });

});
