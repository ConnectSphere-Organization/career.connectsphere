const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

function parseOrigin(value: string | null | undefined): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function isAllowedRequestOrigin({
  origin,
  requestOrigin,
  configuredOrigin,
  development,
}: {
  origin: string | null;
  requestOrigin: string;
  configuredOrigin?: string;
  development: boolean;
}): boolean {
  if (!origin) return true;
  if (origin === requestOrigin || origin === configuredOrigin) return true;
  if (!development) return false;

  const candidate = parseOrigin(origin);
  const request = parseOrigin(requestOrigin);
  const configured = parseOrigin(configuredOrigin);
  if (!candidate || !loopbackHosts.has(candidate.hostname)) return false;

  return [request, configured].some(
    (allowed) =>
      allowed !== null &&
      loopbackHosts.has(allowed.hostname) &&
      allowed.protocol === candidate.protocol &&
      allowed.port === candidate.port,
  );
}

export function developmentTrustedOrigins(configuredOrigin: string): string[] {
  const configured = parseOrigin(configuredOrigin);
  if (!configured || !loopbackHosts.has(configured.hostname))
    return [configuredOrigin];
  const suffix = configured.port ? `:${configured.port}` : "";
  return [
    configuredOrigin,
    `${configured.protocol}//localhost${suffix}`,
    `${configured.protocol}//127.0.0.1${suffix}`,
  ];
}
