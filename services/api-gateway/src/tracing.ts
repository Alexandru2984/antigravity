// ============================================================
// OpenTelemetry instrumentation — must be imported FIRST
// ============================================================
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

// Use env-based resource detection instead of programmatic Resource construction
// to avoid ESM/CJS interop issues with @opentelemetry/resources
process.env.OTEL_SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? 'api-gateway';
process.env.OTEL_SERVICE_VERSION = process.env.OTEL_SERVICE_VERSION ?? '0.1.0';
process.env.OTEL_RESOURCE_ATTRIBUTES =
  process.env.OTEL_RESOURCE_ATTRIBUTES ?? 'deployment.environment=development';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318'}/v1/traces`,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

try {
  sdk.start();
} catch {
  /* OTEL init failure is non-fatal */
}
process.on('SIGTERM', () => {
  try {
    sdk.shutdown();
  } catch {}
});
