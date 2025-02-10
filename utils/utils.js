import useragent from "user-agent-parser";

export const base10ToBase62 = (n) => {
  const elements =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let s = "";

  while (n !== 0) {
    s = elements.charAt(n % 62) + s;
    n = Math.floor(n / 62);
  }

  while (s.length < 7) {
    s = "0" + s;
  }

  return s;
};

export const fnv1aHash = (uuid) => {
  let hash = 2166136261n;
  for (let i = 0; i < uuid.length; i++) {
    hash ^= BigInt(uuid.charCodeAt(i));
    hash *= 16777619n;
  }
  return hash % 10n ** 12n;
};

export function parseUserAgent(userAgentString) {
  const parsedUA = useragent(userAgentString);

  return {
    os: parsedUA.os.name || "unknown",
    device: parsedUA.device.type || "desktop",
  };
}
