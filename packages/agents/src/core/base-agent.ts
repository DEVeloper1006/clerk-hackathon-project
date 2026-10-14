// Every agent extends BaseAgent. Agents run centrally on Astropods,
// scoped by tenant_id, and reach the Clerk API over HTTP.
export abstract class BaseAgent {
  abstract readonly name: string;

  abstract execute(input: unknown): Promise<unknown>;
}
