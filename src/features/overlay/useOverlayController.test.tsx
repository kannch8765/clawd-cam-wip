import { fireEvent, render, screen } from '@testing-library/react';
import { applyDragGesture } from './overlayGeometry';
import { useOverlayController } from './useOverlayController';

function OverlayControllerHarness() {
  const { transform, updateTransform, resetTransform } = useOverlayController();

  return (
    <>
      <output data-testid="transform">{JSON.stringify(transform)}</output>
      <button
        type="button"
        onClick={() =>
          updateTransform(
            applyDragGesture(
              transform,
              { x: 50, y: 25 },
              { width: 200, height: 100 },
            ),
          )
        }
      >
        Synthetic drag
      </button>
      <button type="button" onClick={resetTransform}>
        Reset
      </button>
    </>
  );
}

describe('useOverlayController', () => {
  it('keeps gesture-derived authoritative state after the gesture ends', () => {
    render(<OverlayControllerHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Synthetic drag' }));

    expect(screen.getByTestId('transform')).toHaveTextContent(
      JSON.stringify({ x: 0.75, y: 0.77, scale: 1, rotation: 0 }),
    );
  });

  it('resets the authoritative transform to the shared default', () => {
    render(<OverlayControllerHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Synthetic drag' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByTestId('transform')).toHaveTextContent(
      JSON.stringify({ x: 0.5, y: 0.52, scale: 1, rotation: 0 }),
    );
  });
});
