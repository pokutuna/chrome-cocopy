import {exec} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import type {Plugin, ResolvedConfig} from 'vite';

/**
 * Resolves the `version_name` field injected into the built manifest.json,
 * e.g. "Build v0.4.0-3-gabcdef". Kept as a standalone function so it can be
 * unit-tested / reused if the manifest generation moves elsewhere later.
 */
export function versionName(): Promise<string> {
  return new Promise(resolve => {
    exec('git describe --tags --always --dirty', (err, stdout) =>
      // Fall back when git is unavailable (e.g. building from a source ZIP).
      err ? resolve('Build') : resolve(`Build ${stdout.trim()}`),
    );
  });
}

/**
 * Builds the manifest.json content to write into the build output.
 * Isolated from filesystem/plugin concerns so future browser-specific
 * variants (Phase 3: Firefox/Safari) can branch here.
 */
export async function buildManifest(
  srcManifestPath: string,
  packageVersion: string,
): Promise<string> {
  const raw = fs.readFileSync(srcManifestPath, 'utf-8');
  const manifest = JSON.parse(raw);
  const name = await versionName();
  return JSON.stringify(
    {
      ...manifest,
      version: packageVersion,
      version_name: name,
    },
    null,
    2,
  );
}

export type ManifestPluginOptions = {
  /** Path to the source manifest.json (e.g. src/manifest.json). */
  srcManifest: string;
  /** Path to the source img/ directory (e.g. src/img). */
  srcImgDir: string;
  /** package.json version to inject. */
  packageVersion: string;
};

/**
 * Vite plugin: on closeBundle, writes the transformed manifest.json and
 * copies img/ into the build output directory. Equivalent to the
 * CopyWebpackPlugin step in the previous webpack config.
 */
export function manifestPlugin(options: ManifestPluginOptions): Plugin {
  let resolvedConfig: ResolvedConfig;
  return {
    name: 'cocopy-manifest',
    apply: 'build',
    configResolved(config) {
      resolvedConfig = config;
    },
    async closeBundle() {
      const outDir = path.resolve(
        resolvedConfig.root,
        resolvedConfig.build.outDir,
      );

      const manifestContent = await buildManifest(
        options.srcManifest,
        options.packageVersion,
      );
      fs.writeFileSync(path.join(outDir, 'manifest.json'), manifestContent);

      if (fs.existsSync(options.srcImgDir)) {
        fs.cpSync(options.srcImgDir, path.join(outDir, 'img'), {
          recursive: true,
        });
      }
    },
  };
}
