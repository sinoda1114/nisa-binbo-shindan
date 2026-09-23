export const PUBLIC_PAGE_URL = "https://nisa-binbo-shindan.vercel.app";

export type ShareTargetId = "x" | "line" | "facebook" | "threads";

export type ShareTarget = {
  id: ShareTargetId;
  label: string;
  href: string;
};

export function shareMessage(headline: string): string {
  return `${headline}\n${PUBLIC_PAGE_URL}`;
}

export function linkToCopy(): string {
  return PUBLIC_PAGE_URL;
}

export function shareTargets(headline: string): ShareTarget[] {
  const message = shareMessage(headline);
  const encodedMessage = encodeURIComponent(message);
  const encodedPage = encodeURIComponent(PUBLIC_PAGE_URL);
  const encodedHeadline = encodeURIComponent(headline);
  return [
    {
      id: "x",
      label: "X",
      href: `https://x.com/intent/post?text=${encodedMessage}`,
    },
    {
      id: "line",
      label: "LINE",
      href: `https://line.me/R/msg/text/?${encodedMessage}`,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedPage}&quote=${encodedHeadline}`,
    },
    {
      id: "threads",
      label: "Threads",
      href: `https://www.threads.net/intent/post?text=${encodedMessage}`,
    },
  ];
}
