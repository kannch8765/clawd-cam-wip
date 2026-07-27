import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the camera foundation placeholder', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'ClawdCam' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Camera workspace')).toBeInTheDocument();
    expect(screen.getByText('Not enabled in task 001')).toBeInTheDocument();
  });
});
