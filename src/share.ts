export const PUBLIC_URL = "https://nisa-binbo-shindan.vercel.app";

export type ShareTarget = "x" | "line" | "facebook" | "threads";

export function shareMessage(headline: string): string {
  return `${headline}\n${PUBLIC_URL}`;
}

export function shareHref(target: ShareTarget, headline: string): string {
  const message = encodeURIComponent(shareMessage(headline));
  const page = encodeURIComponent(PUBLIC_URL);
  switch (target) {
    case "x":
      return `https://x.com/intent/post?text=${message}`;
    case "line":
      return `https://line.me/R/msg/text/?${message}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${page}&quote=${encodeURIComponent(headline)}`;
    case "threads":
      return `https://www.threads.net/intent/post?text=${message}`;
    default: {
      const unreachable: never = target;
      return unreachable;
    }
  }
}
