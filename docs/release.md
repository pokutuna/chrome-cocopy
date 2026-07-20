# Release procedure

This project releases a Chrome extension package through GitHub Actions. The
Chrome Web Store upload is intentionally performed manually.

## 1. Prepare the version

Update `version` in `package.json` and commit the change. The version must be a
Chrome extension version using three numeric components, for example `0.4.1`.

Run the local checks before creating the tag:

```sh
pnpm test
pnpm run build
```

The tag and `package.json` versions must match exactly. For example:

| File or ref | Version |
| --- | --- |
| `package.json` | `0.4.1` |
| Git tag | `v0.4.1` |

## 2. Push the release tag

Create a tag on the version commit and push the branch and tag:

```sh
git add package.json
git commit -m 'chore: bump version to 0.4.1'
git tag v0.4.1
git push origin master v0.4.1
```

The release workflow only runs for tags matching `vX.Y.Z`. It does not run for
arbitrary tags or prerelease tags.

## 3. Check the GitHub Actions run

The `release` workflow in
`.github/workflows/release.yaml` performs the following steps:

1. Checks out the tagged commit.
2. Installs the locked dependencies with `pnpm install --frozen-lockfile`.
3. Verifies that the tag version matches `package.json`.
4. Runs `pnpm test`.
5. Builds the extension and creates `build-X.Y.Z.zip` with `pnpm run zip`.
6. Verifies that `manifest.json` is at the root of the ZIP archive.
7. Creates a GitHub Release with generated release notes and attaches the ZIP.

### Release notes

The workflow currently passes `--generate-notes` to `gh release create`. GitHub
therefore generates the initial release notes from the changes since the
previous release. There is no `CHANGELOG.md` input in the current workflow.

If the generated notes need user-facing context, open the created GitHub
Release, choose **Edit release**, and add a short summary above the generated
changes. For example:

```md
## Highlights

- Added support for ...
- Improved ...

## Fixes

- Fixed ...
```

Use the commit or pull request description to explain implementation details,
and use the release notes to summarize the user-visible changes. Keep the
version number and the attached `build-X.Y.Z.zip` unchanged when editing the
notes.

If a check fails, fix the version commit or source code and create a new
version tag. If the workflow fails after the tag has been created, use
**Re-run jobs** from the failed workflow run after fixing the cause.

## 4. Download the package

Open the GitHub Release for the tag and download its
`build-X.Y.Z.zip` asset. Upload this ZIP file directly to the Chrome Web Store.

Do not upload the repository, the `build/` directory itself, or a ZIP that
contains a top-level `build/` directory. The upload archive must contain
`manifest.json` at its root.

The archive can be checked locally with:

```sh
unzip -Z1 build-0.4.1.zip | grep -x manifest.json
```

## 5. Upload to the Chrome Web Store

1. Open the Chrome Web Store Developer Dashboard.
2. Select the existing `cocopy` extension.
3. Start the package upload for a new version.
4. Select `build-X.Y.Z.zip` downloaded from the GitHub Release.
5. Confirm the displayed version and review the validation results.
6. Save or submit the update according to the current publishing settings.

After publication, install or update the extension in Chrome and confirm that
the displayed version matches the release version.
