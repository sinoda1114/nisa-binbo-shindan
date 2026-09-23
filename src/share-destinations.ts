export const PUBLIC_URL = "https://nisa-binbo-shindan.vercel.app";

export type ShareTargetId = "x" | "line" | "facebook" | "threads";

export type ShareDestination = {
  id: ShareTargetId;
  label: string;
  href: string;
};

const LABELS: Record<ShareTargetId, string> = {
  x: "X",
  line: "LINE",
  facebook: "Facebook",
  threads: "Threads",
};

const ORDER: readonly ShareTargetId[] = ["x", "line", "facebook", "threads"];

function destinationHref(id: ShareTargetId, encodedMessage: string): string {
  switch (id) {
    case "x":
      return `https://x.com/intent/post?text=${encodedMessage}`;
    case "line":
      return `https://line.me/R/msg/text/?${encodedMessage}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?quote=${encodedMessage}`;
    case "threads":
      return `https://www.threads.net/intent/post?text=${encodedMessage}`;
    default: {
      const unreachable: never = id;
      return unreachable;
    }
  }
}

export function linkToCopy(): string {
  return PUBLIC_URL;
}

export function shareDestinations(message: string): ShareDestination[] {
  const encodedMessage = encodeURIComponent(message);
  return ORDER.map((id) => ({
    id,
    label: LABELS[id],
    href: destinationHref(id, encodedMessage),
  }));
}
