import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('exposes current-view navigation, unmounts Camera, and moves focus between active headings', async () => {
    const repository = {
      savePhoto: vi.fn(async () => undefined),
      listPhotos: vi.fn(async () => []),
      getPhoto: vi.fn(async () => undefined),
      deletePhoto: vi.fn(async () => undefined),
    };

    render(<App galleryServices={{ repository }} />);

    const cameraButton = screen.getByRole('button', { name: 'Camera' });
    const galleryButton = screen.getByRole('button', { name: 'Gallery' });

    expect(cameraButton).toHaveAttribute('aria-current', 'page');
    expect(cameraButton).toHaveAttribute('aria-controls', 'camera-view');
    expect(galleryButton).not.toHaveAttribute('aria-current');
    expect(screen.getByTestId('camera-view')).toBeInTheDocument();

    fireEvent.click(galleryButton);

    await screen.findByText('No Clawd photos yet');
    const galleryHeading = screen.getByRole('heading', {
      name: 'Local gallery',
    });
    await waitFor(() => expect(galleryHeading).toHaveFocus());
    expect(galleryButton).toHaveAttribute('aria-current', 'page');
    expect(cameraButton).not.toHaveAttribute('aria-current');
    expect(screen.queryByTestId('camera-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('gallery-view')).toBeInTheDocument();

    fireEvent.click(cameraButton);

    const cameraHeading = screen.getByRole('heading', {
      name: 'Camera workspace',
    });
    await waitFor(() => expect(cameraHeading).toHaveFocus());
    expect(cameraButton).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByTestId('gallery-view')).not.toBeInTheDocument();
  });
});
