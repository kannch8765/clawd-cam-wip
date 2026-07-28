import { CameraView } from '../features/camera/CameraView';

export function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Camera foundation</p>
        <h1>ClawdCam</h1>
        <p className="tagline">Bring a little Clawd everywhere.</p>
      </header>
      <CameraView />
    </main>
  );
}
