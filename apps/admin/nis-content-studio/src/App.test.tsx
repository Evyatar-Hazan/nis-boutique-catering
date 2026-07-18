import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { formatValidationIssue } from './validationHelpers';
import '@testing-library/jest-dom/vitest';

describe('Content Studio', () => {
  afterEach(() => cleanup());

  it('shows only the private login gate before authentication', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'פאנל ניהול Nis' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'כניסה עם Google' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /גלריה/ })).not.toBeInTheDocument();
    expect(screen.queryByText('תמונות וגלריה')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('מיני לחמניות אישיות')).not.toBeInTheDocument();
  });

  it('explains that the studio is private', () => {
    render(<App />);

    expect(screen.getByText(/כניסה למורשים בלבד/)).toBeInTheDocument();
    expect(screen.getByText(/מערכת הניהול החדשה במבנה של שוהם/)).toBeInTheDocument();
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
