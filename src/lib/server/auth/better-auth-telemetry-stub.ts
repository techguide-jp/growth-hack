type TelemetryPublishPayload = {
  event?: string;
  [key: string]: unknown;
};

type TelemetryContext = {
  adapter?: string | null;
  database?: string | null;
  [key: string]: unknown;
};

type TelemetryOptions = {
  telemetry?: {
    enabled?: boolean;
  };
  [key: string]: unknown;
};

type TelemetryPublisher = {
  publish: (_payload: TelemetryPublishPayload) => Promise<void>;
};

export function getTelemetryAuthConfig(
  _options: TelemetryOptions,
  _context?: TelemetryContext,
) {
  return {};
}

export async function createTelemetry(
  _options: TelemetryOptions,
  _context?: TelemetryContext,
): Promise<TelemetryPublisher> {
  return {
    publish: async () => {},
  };
}
