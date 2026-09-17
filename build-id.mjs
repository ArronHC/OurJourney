import { execSync } from 'node:child_process';

export function resolveBuildId() {
  const explicit =
    process.env.OURJOURNEY_BUILD_ID ||
    process.env.GITHUB_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA;

  if (explicit) {
    return explicit.slice(0, 12);
  }

  try {
    return execSync('git rev-parse --short=12 HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return `local-${Date.now().toString(36)}`;
  }
}
