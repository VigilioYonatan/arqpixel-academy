/**
 * Canonical snake_case event envelope for Transactional Outbox & SQS/SNS consumers.
 * Never include raw secrets, tokens, or unnecessary PII inside `payload`.
 */
export type EventEnvelope<TPayload> = {
  readonly event_id: string;
  readonly event_type: string;
  readonly schema_version: number;
  readonly occurred_at: string;
  readonly tenant_id: string;
  readonly aggregate_id: string;
  readonly payload: TPayload;
};
