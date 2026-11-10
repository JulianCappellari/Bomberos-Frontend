import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(rootDir, "src");
const appDir = path.join(srcDir, "app");
const scanDirs = [appDir, path.join(srcDir, "components")].filter(existsSync);

const routeFiles = walk(appDir).filter((file) =>
  /(^|[\\/])page\.(tsx|ts|jsx|js)$/.test(file),
);
const routePatterns = routeFiles.map(routeFromPageFile).sort();
const routeSet = new Set(routePatterns);
const navigationUsages = scanDirs.flatMap((dir) =>
  walk(dir)
    .filter((file) => /\.(tsx|ts|jsx|js)$/.test(file))
    .flatMap(extractNavigationUsages),
);

const violations = [];

for (const file of routeFiles) {
  const route = routeFromPageFile(file);
  const content = readFileSync(file, "utf8");

  if (isPublicRoute(route)) continue;

  if (!hasInternalNavigation(content)) {
    violations.push({
      code: "FRONTEND_INTERNAL_PAGE_WITHOUT_NAVIGATION",
      message:
        "Pagina interna sin ProtectedLayout ni navegacion interna reconocida.",
      file,
      line: 1,
    });
  }
}

for (const usage of navigationUsages) {
  const href = normalizeHref(usage.href);

  if (!href) continue;

  if (href.startsWith("/dashboard/vehicles")) {
    violations.push({
      code: "FRONTEND_STALE_DASHBOARD_VEHICLE_ROUTE",
      message: `Ruta heredada detectada: ${href}. Usar /equipment/...`,
      file: usage.file,
      line: usage.line,
    });
    continue;
  }

  if (!routeExists(href)) {
    violations.push({
      code: "FRONTEND_ROUTE_MISSING",
      message: `No existe una page para el destino ${href}`,
      file: usage.file,
      line: usage.line,
    });
  }
}

if (violations.length > 0) {
  console.error(`Frontend logic check FAIL: ${violations.length} violacion(es).`);
  for (const violation of violations) {
    console.error(
      `- [${violation.code}] ${relativeToRoot(violation.file)}:${violation.line} ${violation.message}`,
    );
  }
  process.exitCode = 1;
} else {
  console.log(
    `Frontend logic check OK: ${routePatterns.length} rutas y ${navigationUsages.length} navegaciones verificadas.`,
  );
}

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;

    const nextPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(nextPath));
    } else if (entry.isFile()) {
      files.push(nextPath);
    }
  }

  return files;
}

function routeFromPageFile(file) {
  const rel = path.relative(appDir, file).split(path.sep).join("/");
  const routePath = rel.replace(/\/?page\.(tsx|ts|jsx|js)$/, "");
  const segments = routePath
    .split("/")
    .filter(Boolean)
    .filter((segment) => !isRouteGroup(segment) && !segment.startsWith("_"));

  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function extractNavigationUsages(file) {
  const content = readFileSync(file, "utf8");
  const usages = [];
  const patterns = [
    /\bhref\s*=\s*(?:\{\s*)?["']([^"']+)["']\s*(?:\})?/g,
    /\bhref\s*=\s*\{\s*`([^`]+)`\s*\}/g,
    /\brouter\.(?:push|replace)\(\s*["']([^"']+)["']\s*\)/g,
    /\brouter\.(?:push|replace)\(\s*`([^`]+)`\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      usages.push({
        file,
        href: match[1],
        line: lineForIndex(content, match.index ?? 0),
      });
    }
  }

  return usages;
}

function normalizeHref(href) {
  const trimmed = href.trim().replace(/\$\{[^}]+\}/g, "__dynamic__");

  if (
    trimmed.length === 0 ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("__dynamic__") ||
    /^(https?:|mailto:|tel:|sms:|blob:|data:)/i.test(trimmed) ||
    !trimmed.startsWith("/")
  ) {
    return null;
  }

  const [withoutHash] = trimmed.split("#", 1);
  const [withoutQuery] = withoutHash.split("?", 1);
  const normalized = withoutQuery.replace(/\/+$/, "");

  return normalized === "" ? "/" : normalized;
}

function routeExists(href) {
  if (routeSet.has(href)) return true;
  return routePatterns.some((pattern) => routeMatches(pattern, href));
}

function routeMatches(pattern, href) {
  const patternSegments = pattern.split("/").filter(Boolean);
  const hrefSegments = href.split("/").filter(Boolean);

  if (patternSegments.length !== hrefSegments.length) return false;

  return patternSegments.every((segment, index) => {
    if (segment.startsWith("[") && segment.endsWith("]")) {
      return hrefSegments[index].length > 0;
    }

    return segment === hrefSegments[index];
  });
}

function isRouteGroup(segment) {
  return segment.startsWith("(") && segment.endsWith(")");
}

function isPublicRoute(route) {
  return route === "/" || route === "/login";
}

function hasInternalNavigation(content) {
  return [
    "<ProtectedLayout",
    "EquipmentPageHeader",
    "BackButton",
    "HomeButton",
  ].some((marker) => content.includes(marker));
}

function lineForIndex(content, index) {
  return content.slice(0, index).split(/\r\n|\r|\n/).length;
}

function relativeToRoot(file) {
  return path.relative(rootDir, file).split(path.sep).join("/");
}
