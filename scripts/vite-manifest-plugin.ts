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
  return new Promise((resolve, reject) => {
    exec('git describe --tags --always --dirty', (err, stdout) =>
      err ? reject(err) : resolve(`Build ${stdout.replace('\n', '')}`),
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

function copyDirRecursive(src: string, dest: string) {
  fs.mkdirSync(dest, {recursive: true});
  for (const entry of fs.readdirSync(src, {withFileTypes: true})) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
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
      const outDir = path.isAbsolute(resolvedConfig.build.outDir)
        ? resolvedConfig.build.outDir
        : path.join(resolvedConfig.root, resolvedConfig.build.outDir);

      const manifestContent = await buildManifest(
        options.srcManifest,
        options.packageVersion,
      );
      fs.writeFileSync(path.join(outDir, 'manifest.json'), manifestContent);

      if (fs.existsSync(options.srcImgDir)) {
        copyDirRecursive(options.srcImgDir, path.join(outDir, 'img'));
      }
    },
  };
}
