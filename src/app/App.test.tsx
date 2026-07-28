import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the camera foundation without requesting permission', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'ClawdCam' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Camera workspace')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start camera' }),
    ).toBeInTheDocument();
  });
});
