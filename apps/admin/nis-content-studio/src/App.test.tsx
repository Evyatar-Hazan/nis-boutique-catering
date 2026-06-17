import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';
import '@testing-library/jest-dom/vitest';

describe('Content Studio', () => {
  afterEach(() => cleanup());

  it('shows only the private login gate before authentication', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Content Studio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'כניסה עם Google' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'גלריה' })).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('מיני לחמניות אישיות')).not.toBeInTheDocument();
  });

  it('explains that the studio is private', () => {
    render(<App />);

    expect(screen.getByText('כניסה למורשים בלבד')).toBeInTheDocument();
    expect(screen.getByText(/רק משתמשים שאושרו מראש/)).toBeInTheDocument();
  });
});
