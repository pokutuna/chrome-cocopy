import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {test as base, chromium, type BrowserContext} from '@playwright/test';

// Fixed RSA public key (SPKI, base64) injected into manifest.json's `key`
// field so Chrome derives a stable, predictable extension ID instead of
// hashing the (temp, ever-changing) install path. This key is used only to
// pin the extension ID for tests; it is not a secret and signs nothing of
// value.
const EXTENSION_PUBLIC_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzrG11h/378SrvuTlPt1xlhrsC4njsagiHQPKiXtlo4WDAeutc31mH56DgwRH7Jvhc7v4J9FqZf0xVsPwW3adAn3AR3fVc6B26ffCal3rs9NWtJX9HUEVAMIpbTXpz9lEf1JaXq0F+hohlJOfzr0jLezDfnlBTcW1EJelJmuFmJShMcpgDzNIdsmZ+yJBAVDXFsXmJ6EwWEmM3GRv7g4A5mUOGnpKObeP0Ms8ISJSsS+/3bUr4rlnx0BZxAtI1aJsTdxViwXp7f9Od9s+edOwQadNCp5jrKtlxpiW2j9CQimhSBbdiZbwxADd+f0FWOej3kRd9AAJhxxMeCqnr14nxQIDAQAB';

// Extension ID derived from the public key above:
// id = first 32 hex chars of sha256(SPKI DER), each hex digit mapped to
// a-p (0->a, 1->b, ... f->p). See scripts/README or regenerate with the
// snippet below if the key ever changes:
//
//   const der = Buffer.from(EXTENSION_PUBLIC_KEY, 'base64');
//   const hash = crypto.createHash('sha256').update(der).digest('hex');
//   const id = hash.slice(0, 32).replace(/./g, c =>
//     String.fromCharCode(97 + parseInt(c, 16)));
export const EXTENSION_ID = 'hclhfjgikdikdeeopockeceinaijolho';

const repoRoot = path.resolve(__dirname, '..');
const buildDir = path.join(repoRoot, 'build');

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, {recursive: true});
  for (const entry of fs.readdirSync(src, {withFileTypes: true})) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function prepareExtensionDir(): string {
  if (!fs.existsSync(buildDir)) {
    throw new Error(
      `build/ not found at ${buildDir}. Run \`yarn build\` before the e2e tests.`,
    );
  }

  const tmpDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'cocopy-e2e-extension-'),
  );
  copyDir(buildDir, tmpDir);

  const manifestPath = path.join(tmpDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  manifest.key = EXTENSION_PUBLIC_KEY;
  // Test-only: grant host_permissions so chrome.tabs.query() returns
  // tab.url/tab.title without the `activeTab` gesture. In production,
  // `activeTab` is granted by the user clicking the toolbar icon, but
  // Playwright automation opens popup.html as a plain page (no browser
  // action UI to click), so that grant never happens and tab.url/title
  // come back undefined, which the code under test does depend on (e.g.
  // src/lib/page.ts's isPage() requires tab.title to be a string). This
  // does not modify src/manifest.json.
  manifest.host_permissions = ['<all_urls>'];
  if (Array.isArray(manifest.permissions)) {
    manifest.permissions = [...new Set([...manifest.permissions, 'tabs'])];
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  return tmpDir;
}

type Fixtures = {
  context: BrowserContext;
  extensionId: string;
};

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const extensionDir = prepareExtensionDir();
    const userDataDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'cocopy-e2e-profile-'),
    );

    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium',
      headless: true,
      args: [
        `--disable-extensions-except=${extensionDir}`,
        `--load-extension=${extensionDir}`,
        '--headless=new',
      ],
      permissions: ['clipboard-read', 'clipboard-write'],
    });

    await use(context);

    await context.close();
    fs.rmSync(extensionDir, {recursive: true, force: true});
    fs.rmSync(userDataDir, {recursive: true, force: true});
  },

  // eslint-disable-next-line no-empty-pattern
  extensionId: async ({}, use) => {
    await use(EXTENSION_ID);
  },
});

export const expect = test.expect;
