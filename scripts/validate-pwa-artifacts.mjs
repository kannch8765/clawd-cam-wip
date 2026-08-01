import assert from 'node:assert/strict';
import { readFile, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const distDirectory = path.join(repositoryRoot, 'dist');
const auditDirectory = path.join(repositoryRoot, '.pwa-audit');
const alternateDirectory = path.join(auditDirectory, 'alternate');

function normalizeBase(value) {
  if (!value) {
    return '/';
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

function configuredBase(environment) {
  if (environment.VITE_BASE_PATH) {
    return normalizeBase(environment.VITE_BASE_PATH);
  }

  const repositoryName = environment.GITHUB_REPOSITORY?.split('/')[1];
  return environment.GITHUB_ACTIONS === 'true' && repositoryName
    ? normalizeBase(repositoryName)
    : '/';
}

function run(command, args, environment = process.env) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    env: environment,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  assert.equal(
    result.status,
    0,
    `${command} ${args.join(' ')} exited with ${String(result.status)}`,
  );
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(entryPath)));
    } else {
      files.push(entryPath);
    }
  }

  return files;
}

function artifactPathFromUrl(value, expectedBase) {
  const resolved = new URL(value, `https://clawdcam.invalid${expectedBase}`);
  assert.equal(
    resolved.origin,
    'https://clawdcam.invalid',
    `External artifact URL is not allowed: ${value}`,
  );

  let decodedPathname;
  let decodedBase;
  try {
    decodedPathname = decodeURIComponent(resolved.pathname);
    decodedBase = decodeURIComponent(expectedBase);
  } catch (error) {
    assert.fail(`Artifact URL contains invalid encoding: ${value}; ${error}`);
  }

  assert.ok(
    decodedPathname.startsWith(decodedBase),
    `Artifact URL escaped ${expectedBase}: ${value}`,
  );

  const relative = decodedPathname.slice(decodedBase.length);
  assert.ok(
    !relative.includes('\\'),
    `Artifact URL used an encoded backslash separator: ${value}`,
  );
  return relative || 'index.html';
}

function resolveArtifactPath(buildDirectory, value, expectedBase) {
  const relative = artifactPathFromUrl(value, expectedBase);
  const buildRoot = path.resolve(buildDirectory);
  const filePath = path.resolve(buildRoot, relative);
  assert.ok(
    filePath === buildRoot || filePath.startsWith(`${buildRoot}${path.sep}`),
    `Artifact URL escaped the build directory: ${value}`,
  );
  return { filePath, relative };
}

function assertArtifactPathSecurityContract() {
  const buildRoot = path.join(repositoryRoot, '.pwa-path-contract');
  const expectedBase = '/clawd-cam-wip/';
  const valid = resolveArtifactPath(
    buildRoot,
    '/clawd-cam-wip/assets/app.js',
    expectedBase,
  );
  assert.equal(valid.filePath, path.resolve(buildRoot, 'assets/app.js'));

  const encodedEscapes = [
    '/clawd-cam-wip/%2e%2e%2fpackage.json',
    '/clawd-cam-wip/%2E%2E%2Fpackage.json',
    '/clawd-cam-wip/%2e%2e%5cpackage.json',
    '/clawd-cam-wip/assets%2f..%2f..%2fpackage.json',
    '/clawd-cam-wip/%2Fetc%2Fpasswd',
  ];
  for (const value of encodedEscapes) {
    assert.throws(
      () => resolveArtifactPath(buildRoot, value, expectedBase),
      /escaped|backslash separator/,
      `Encoded artifact path must fail closed: ${value}`,
    );
  }
}

function pngMetadata(buffer) {
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  assert.ok(buffer.subarray(0, 8).equals(signature), 'Icon is not a PNG');
  assert.equal(buffer.toString('ascii', 12, 16), 'IHDR', 'PNG lacks IHDR');

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer[25],
  };
}

async function assertReferencedFile(buildDirectory, url, expectedBase) {
  const { filePath, relative } = resolveArtifactPath(
    buildDirectory,
    url,
    expectedBase,
  );
  assert.ok(
    await exists(filePath),
    `Referenced artifact does not exist: ${relative}`,
  );
}

async function inspectBuild(buildDirectory, expectedBase) {
  const indexPath = path.join(buildDirectory, 'index.html');
  const manifestPath = path.join(buildDirectory, 'manifest.webmanifest');
  const serviceWorkerPath = path.join(buildDirectory, 'sw.js');

  assert.ok(await exists(indexPath), 'Production build lacks index.html');
  assert.ok(
    await exists(manifestPath),
    'Production build lacks manifest.webmanifest',
  );
  assert.ok(await exists(serviceWorkerPath), 'Production build lacks sw.js');

  const indexHtml = await readFile(indexPath, 'utf8');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const serviceWorker = await readFile(serviceWorkerPath, 'utf8');

  assert.equal(manifest.name, 'ClawdCam');
  assert.equal(manifest.short_name, 'ClawdCam');
  assert.equal(
    manifest.description,
    'A local-first camera PWA for composing, saving, downloading, and sharing Clawd photos.',
  );
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, expectedBase);
  assert.equal(manifest.scope, expectedBase);
  assert.ok(
    manifest.start_url.startsWith(expectedBase) &&
      manifest.scope.startsWith(expectedBase),
    'Manifest start URL or scope escaped the repository base path',
  );

  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);
  for (const icon of manifest.icons) {
    await assertReferencedFile(buildDirectory, icon.src, expectedBase);
    const [declaredWidth, declaredHeight] = icon.sizes
      .split('x')
      .map((value) => Number.parseInt(value, 10));
    const { filePath: iconPath } = resolveArtifactPath(
      buildDirectory,
      icon.src,
      expectedBase,
    );
    const metadata = pngMetadata(await readFile(iconPath));
    assert.equal(metadata.width, declaredWidth);
    assert.equal(metadata.height, declaredHeight);
    assert.ok(
      metadata.colorType === 4 || metadata.colorType === 6,
      `${icon.src} must retain an alpha-capable PNG color type`,
    );
  }

  const maskable = manifest.icons.find((icon) =>
    String(icon.purpose).split(/\s+/).includes('maskable'),
  );
  assert.ok(maskable, 'Manifest lacks a maskable icon declaration');
  assert.equal(maskable.sizes, '512x512');

  const documentUrls = [...indexHtml.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(
    (match) => match[1],
  );
  for (const url of documentUrls) {
    if (
      url.startsWith('data:') ||
      url.startsWith('mailto:') ||
      url.startsWith('#')
    ) {
      continue;
    }
    await assertReferencedFile(buildDirectory, url, expectedBase);
  }

  const referenceOverlay = path.join(
    buildDirectory,
    'assets/reference/clawd-reference-overlay.png',
  );
  assert.ok(
    await exists(referenceOverlay),
    'Runtime reference overlay is missing from the build',
  );

  const precacheUrls = [
    ...serviceWorker.matchAll(/\burl\s*:\s*["']([^"']+)["']/g),
  ].map((match) => match[1]);
  assert.ok(
    precacheUrls.length > 0,
    'Service Worker precache URLs were not found',
  );
  assert.ok(
    precacheUrls.some((url) => url.endsWith('index.html')),
    'Service Worker does not precache the app shell',
  );
  assert.ok(
    precacheUrls.some((url) =>
      url.endsWith('assets/reference/clawd-reference-overlay.png'),
    ),
    'Service Worker does not precache the runtime reference overlay',
  );

  const forbiddenPrecacheFragments = [
    'blob:',
    'mediastream',
    'indexeddb',
    'photoBlob',
    'thumbnailBlob',
    'objectURL',
    'clawd-base-accurate-card.png',
    '/users/',
    '/home/',
    '/root/',
    '/tmp/',
    '/var/tmp/',
    '/private/tmp/',
    '/mnt/',
    '/workspace/',
    '/workspaces/',
    '/github/workspace/',
    '/opt/hostedtoolcache/',
    'c:\\',
    '\\\\',
  ];
  for (const url of precacheUrls) {
    await assertReferencedFile(buildDirectory, url, expectedBase);
    for (const fragment of forbiddenPrecacheFragments) {
      assert.ok(
        !url.toLowerCase().includes(fragment.toLowerCase()),
        `Forbidden precache URL fragment ${fragment}: ${url}`,
      );
    }
  }

  const files = await walk(buildDirectory);
  assert.ok(
    files.every((file) => !file.endsWith('.map')),
    'Production source map found',
  );
  assert.ok(
    files.every(
      (file) =>
        !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file) &&
        !file.includes(`${path.sep}__tests__${path.sep}`),
    ),
    'Test source found in production artifact',
  );
  assert.ok(
    files.every(
      (file) => path.basename(file) !== 'clawd-base-accurate-card.png',
    ),
    'Reference source image entered production artifact',
  );

  const textFiles = files.filter((file) =>
    /\.(?:html|js|css|json|webmanifest|svg|txt)$/i.test(file),
  );
  const forbiddenTextPatterns = [
    {
      label: 'Windows absolute or UNC path',
      pattern:
        /(?:\b[A-Za-z]:[\\/](?:Users|Windows|Program Files|wsl|workspace)\b|\\\\(?:[^\\\s]+\\){2,})/i,
    },
    {
      label: 'local Unix, macOS, WSL, or runner path',
      pattern:
        /\/(?:Users|home|root|tmp|var\/tmp|private\/tmp|mnt\/[a-z]|workspace|workspaces|github\/workspace|opt\/hostedtoolcache)\/[^\s"'`]+/i,
    },
    {
      label: 'GitHub token',
      pattern:
        /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
    },
    {
      label: 'npm access token',
      pattern: /\bnpm_[A-Za-z0-9]{20,}\b/,
    },
    {
      label: 'AWS access key',
      pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
    },
    {
      label: 'private key material',
      pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    },
    {
      label: 'private user image URL',
      pattern: /private-user-images\.githubusercontent\.com/i,
    },
    {
      label: 'reference source filename',
      pattern: /clawd-base-accurate-card\.png/i,
    },
    {
      label: 'Task 001 placeholder copy',
      pattern: /camera placeholder|placeholder icon/i,
    },
  ];

  let combinedText = '';
  for (const file of textFiles) {
    const contents = await readFile(file, 'utf8');
    combinedText += `\n${contents}`;
    for (const { label, pattern } of forbiddenTextPatterns) {
      assert.ok(!pattern.test(contents), `${label} found in ${file}`);
    }
  }

  assert.ok(
    combinedText.includes('Reference Clawd'),
    'The reference overlay label is missing from the application artifact',
  );
  assert.ok(
    combinedText.includes('not final production artwork'),
    'The application does not visibly distinguish reference/test artwork',
  );
  assert.ok(
    !combinedText.includes('Official production Clawd'),
    'Reference overlay is mislabeled as production artwork',
  );
}

async function inspectReleasePolicy() {
  const [
    readme,
    checklist,
    deviceMatrix,
    statusText,
    deviceEvidenceText,
    packageText,
    focusStyleText,
  ] = await Promise.all([
    readFile(path.join(repositoryRoot, 'README.md'), 'utf8'),
    readFile(
      path.join(repositoryRoot, 'docs/mvp-release-checklist.md'),
      'utf8',
    ),
    readFile(
      path.join(repositoryRoot, 'docs/mvp-device-validation.md'),
      'utf8',
    ),
    readFile(path.join(repositoryRoot, 'docs/mvp-release-status.json'), 'utf8'),
    readFile(
      path.join(repositoryRoot, 'docs/device-validation-ios-pwa-evidence.json'),
      'utf8',
    ),
    readFile(path.join(repositoryRoot, 'package.json'), 'utf8'),
    readFile(path.join(repositoryRoot, 'src/styles/accessibility.css'), 'utf8'),
  ]);

  const status = JSON.parse(statusText);
  const deviceEvidence = JSON.parse(deviceEvidenceText);
  const packageMetadata = JSON.parse(packageText);

  assert.equal(status.schemaVersion, 1);
  assert.equal(status.application, 'ClawdCam');
  assert.equal(status.version, packageMetadata.version);
  assert.equal(status.automatedChecks, 'PASS_GITHUB_CI_NODE_22_24');
  assert.equal(status.physicalDeviceValidation, 'PASS_WITH_NOTES');
  assert.equal(status.releaseDecision, 'READY_WITH_MANUAL_DEVICE_CHECKS');
  assert.equal(status.testedDeployment.result, 'PASS_WITH_NOTES');
  assert.equal(
    status.testedDeployment.commit,
    'c684843e619f493d676992ab29eaec13f6b5d13e',
  );
  assert.equal(
    status.testedDeployment.sourceCommit,
    '9d4807ef86d383e429759dc22c844c6f2154684e',
  );
  assert.equal(status.testedDeployment.pagesWorkflowRunId, 30536547832);
  assert.equal(
    status.testedDeployment.pagesWorkflowRunUrl,
    'https://github.com/kannch8765/clawd-cam-wip/actions/runs/30536547832',
  );
  assert.equal(status.retestRequired, false);
  assert.deepEqual(status.knownBlockers, []);
  assert.equal(status.closedReleaseBlockers.length, 5);
  assert.ok(
    status.nonBlockingNotes.some((note) =>
      note.includes('low-height landscape'),
    ),
    'Release status lacks the landscape shutter UI/UX note',
  );
  assert.equal(status.deviceEvidence.result, 'PASS_WITH_NOTES');
  assert.deepEqual(status.deviceEvidence.releaseBlockingRegressionTotals, {
    expected: 5,
    passed: 5,
    failed: 0,
    blocked: 0,
  });
  assert.equal(status.browserE2E.introduced, false);
  assert.equal(status.task009FeaturesImplemented, false);

  assert.equal(deviceEvidence.schemaVersion, 1);
  assert.equal(deviceEvidence.application, 'ClawdCam');
  assert.equal(deviceEvidence.version, packageMetadata.version);
  assert.equal(
    deviceEvidence.deployment.commit,
    'c684843e619f493d676992ab29eaec13f6b5d13e',
  );
  assert.equal(
    deviceEvidence.deployment.sourceCommit,
    '9d4807ef86d383e429759dc22c844c6f2154684e',
  );
  assert.equal(deviceEvidence.deployment.pagesWorkflowRunId, 30536547832);
  assert.equal(
    deviceEvidence.deployment.pagesWorkflowRunUrl,
    'https://github.com/kannch8765/clawd-cam-wip/actions/runs/30536547832',
  );
  assert.equal(deviceEvidence.deployment.result, 'PASS');
  assert.equal(deviceEvidence.environment.device, 'iPhone 15 Pro');
  assert.equal(deviceEvidence.environment.os, 'iOS 26.5.2');
  assert.equal(deviceEvidence.environment.mode, 'installed PWA');
  assert.equal(deviceEvidence.result, 'PASS_WITH_NOTES');
  assert.equal(deviceEvidence.releaseBlockingRegressions.length, 5);
  assert.ok(
    deviceEvidence.releaseBlockingRegressions.every(
      (regression) => regression.result === 'PASS',
    ),
    'Every release-blocking regression must be recorded as PASS',
  );
  assert.deepEqual(deviceEvidence.releaseBlockingRegressionTotals, {
    expected: 5,
    passed: 5,
    failed: 0,
    blocked: 0,
  });
  assert.equal(
    deviceEvidence.recommendedReleaseDecision,
    'READY_WITH_MANUAL_DEVICE_CHECKS',
  );
  assert.ok(
    deviceEvidence.nonBlockingNotes.some((note) =>
      note.includes('low-height landscape'),
    ),
    'Device evidence lacks the landscape shutter UI/UX note',
  );

  const headingFocusRule = focusStyleText.match(
    /h2\[tabindex=['"]-1['"]\]:focus-visible\s*\{([\s\S]*?)\}/,
  );
  assert.ok(
    headingFocusRule,
    'Programmatically focused headings lack a :focus-visible rule',
  );
  assert.match(
    headingFocusRule[1],
    /outline\s*:\s*(?!none\b)[^;]+;/,
    'Programmatically focused headings lack a visible outline',
  );
  assert.match(
    headingFocusRule[1],
    /outline-offset\s*:\s*[^;]+;/,
    'Programmatically focused headings lack outline separation',
  );

  const requiredReadmeClaims = [
    'does not upload camera frames or photos',
    'Save to gallery',
    'IndexedDB',
    'does not automatically save to the system photo library',
    'does not collect analytics or telemetry',
    'reference/test artwork',
    'HTTPS',
    'npm ci',
    'npm run check',
    'GitHub Actions',
  ];
  for (const claim of requiredReadmeClaims) {
    assert.ok(readme.includes(claim), `README is missing: ${claim}`);
  }

  const requiredChecklistSections = [
    '## Repository and CI',
    '## Deployment',
    '## Functional MVP',
    '## Failure and recovery',
    '## Accessibility',
    '## Privacy and local data',
    '## PWA icons and reference-asset isolation',
    '## CI and Pages workflow audit',
    '## Browser smoke automation decision',
    '## Release decision',
  ];
  for (const section of requiredChecklistSections) {
    assert.ok(checklist.includes(section), `Checklist is missing: ${section}`);
  }

  assert.ok(
    checklist.includes('READY_WITH_MANUAL_DEVICE_CHECKS') &&
      checklist.includes('Physical-device validation: **PASS_WITH_NOTES**') &&
      checklist.includes('five release-blocking regressions') &&
      checklist.includes('non-blocking mobile camera UI/UX debt') &&
      checklist.includes('actions/runs/30536547832'),
    'Checklist release status is inconsistent',
  );
  assert.ok(
    !/\[[xX]\].*NOT_RUN/.test(checklist),
    'A NOT_RUN manual check is incorrectly marked complete',
  );

  const requiredTargets = [
    'iPhone',
    'installed PWA',
    'Android phone',
    'Chrome or Edge',
    'Firefox',
  ];
  for (const target of requiredTargets) {
    assert.ok(
      deviceMatrix.includes(target),
      `Device matrix lacks target: ${target}`,
    );
  }
  assert.ok(
    deviceMatrix.includes('## 2026-08-01 IOS-PWA blocker retest') &&
      deviceMatrix.includes('`c684843e619f493d676992ab29eaec13f6b5d13e`') &&
      deviceMatrix.includes('1439 x 1080') &&
      deviceMatrix.includes('PASS_WITH_NOTES') &&
      deviceMatrix.includes('actions/runs/30536547832'),
    'Device matrix lacks the deployed blocker-retest evidence',
  );
  assert.ok(
    (deviceMatrix.match(/NOT_RUN/g) ?? []).length >= 60,
    'Unexecuted device and accessibility coverage must remain explicit',
  );
}

async function main() {
  assertArtifactPathSecurityContract();

  const currentBase = configuredBase(process.env);
  const repositoryName =
    process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'clawd-cam-wip';
  const pagesBase = normalizeBase(repositoryName);
  const alternateBase = currentBase === '/' ? pagesBase : '/';

  await rm(auditDirectory, { recursive: true, force: true });

  try {
    run('npm', ['run', 'build']);
    await inspectBuild(distDirectory, currentBase);

    const alternateEnvironment = {
      ...process.env,
      VITE_BASE_PATH: alternateBase,
    };
    run(
      process.execPath,
      [
        path.join(repositoryRoot, 'node_modules/vite/bin/vite.js'),
        'build',
        '--outDir',
        alternateDirectory,
        '--emptyOutDir',
      ],
      alternateEnvironment,
    );
    await inspectBuild(alternateDirectory, alternateBase);
    await inspectReleasePolicy();

    console.log(
      `PWA artifact validation passed for ${currentBase} and ${alternateBase}.`,
    );
  } finally {
    await rm(auditDirectory, { recursive: true, force: true });
  }
}

await main();
