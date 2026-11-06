export interface ChatEvidence {
  id: string;
  source: string;
  label: string;
}

export interface ChatTrace {
  step: number;
  tool: string;
  args: string;
  ok: boolean;
  id: string;
  source?: string;
}

export interface ChatVerification {
  done: boolean;
  unsupported?: string[];
  sameFamily?: boolean;
  model?: string;
  error?: string;
}

export interface ChatResponse {
  answer: string;
  unsupportedNumbers?: string[];
  evidence?: ChatEvidence[];
  toolResults?: string[];
  trace?: ChatTrace[];
  model?: string;
  fallbackUsed?: boolean;
  verification?: ChatVerification;
  warnings?: string[];
  auditId?: number;
}
