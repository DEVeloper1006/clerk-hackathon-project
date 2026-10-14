// Placeholder event types for the Redis pub/sub bus.

export interface ClerkEvent<TType extends string = string, TPayload = unknown> {
  type: TType;
  tenantId: string;
  payload: TPayload;
  timestamp: string;
}

// Maps event type → payload. Add entries as events are defined.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EventMap {}
