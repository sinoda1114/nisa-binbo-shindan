export type ScreenVerdict = "loss" | "risky" | "ok";

export type ScreenVerdictCopy = {
  readonly label: string;
  readonly headline: string;
  readonly summary: string;
};

export const consultLimit: {
  readonly user: number;
  readonly model: number;
  readonly messages: number;
};

export const verdicts: Record<ScreenVerdict, ScreenVerdictCopy>;

export const findings: readonly string[];
