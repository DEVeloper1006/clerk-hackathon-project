import OpenAI from 'openai'
import { env } from '../config/env.js'

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlmOptions {
  temperature?: number
  /** Ask the model for a JSON object response. */
  json?: boolean
}

export interface LlmClient {
  complete(messages: LlmMessage[], options?: LlmOptions): Promise<string>
}

class OpenAiClient implements LlmClient {
  private readonly client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async complete(messages: LlmMessage[], options: LlmOptions = {}): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages,
      temperature: options.temperature ?? 0.2,
      response_format: options.json ? { type: 'json_object' } : undefined,
    })
    return res.choices[0]?.message.content ?? ''
  }
}

class AnthropicClient implements LlmClient {
  async complete(_messages: LlmMessage[], _options?: LlmOptions): Promise<string> {
    // TODO: implement — add @anthropic-ai/sdk + ANTHROPIC_API_KEY and call messages.create.
    throw new Error('Anthropic provider not implemented yet')
  }
}

class NoopClient implements LlmClient {
  async complete(): Promise<string> {
    console.warn('[llm] no API key configured — returning empty completion')
    return ''
  }
}

export function createLlmClient(): LlmClient {
  if (env.LLM_PROVIDER === 'anthropic') return new AnthropicClient()
  if (!env.OPENAI_API_KEY) return new NoopClient()
  return new OpenAiClient(env.OPENAI_API_KEY)
}

export const llm = createLlmClient()
