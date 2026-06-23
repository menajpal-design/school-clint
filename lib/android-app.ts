import { getSubdomain } from "./utils";

const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "easyschool.live";

export function resolveAndroidTargetUrl(hostname?: string, protocol = "https:") {
  const host = hostname || (typeof window !== "undefined" ? window.location.hostname : MAIN_DOMAIN);
  const scheme = protocol === "http:" && /^(localhost|127\.0\.0\.1)$/i.test(host) ? "http" : "https";
  const subdomain = getSubdomain(host, MAIN_DOMAIN);
  const baseHost = subdomain ? `${subdomain}.${MAIN_DOMAIN}` : MAIN_DOMAIN;
  return {
    subdomain,
    origin: `${scheme}://${baseHost}`,
    loginUrl: `${scheme}://${baseHost}/login`,
    appUrl: `${scheme}://${baseHost}`,
    fileSuffix: subdomain || "main",
  };
}
