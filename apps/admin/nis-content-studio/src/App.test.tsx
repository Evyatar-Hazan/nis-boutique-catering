import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import '@testing-library/jest-dom/vitest';

describe('Content Studio', () => {
  it('renders the admin shell in demo mode', () => {
    render(<App />);
    expect(screen.getByText('Content Studio')).toBeInTheDocument();
    expect(screen.getAllByText('גלריה')).toHaveLength(2);
    expect(screen.getByDisplayValue('מיני לחמניות אישיות')).toBeInTheDocument();
  });
});
