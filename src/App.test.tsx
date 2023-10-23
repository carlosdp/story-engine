import { describe, expect, it } from 'vitest';

import App from './App.js';
import { render, screen } from './test/utils.js';

describe('Simple working test', () => {
  it('the title is visible', () => {
    render(<App />);
    expect(screen.getByText(/connect wallet/i)).toBeInTheDocument();
  });
});
