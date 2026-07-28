import { CameraPlaceholder } from '../features/camera/CameraPlaceholder';

export function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Project foundation</p>
        <h1>ClawdCam</h1>
        <p className="tagline">Bring a little Clawd everywhere.</p>
      </header>
      <CameraPlaceholder />
    </main>
  );
}
