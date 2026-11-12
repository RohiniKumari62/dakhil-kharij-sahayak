// AI provider interface definition

export interface GenerateJsonArgs {
  system: string;
  user: string;
  timeoutMs: number;
}

export interface GenerateJsonResponse {
  text: string;
  model: string;
  latencyMs: number;
}

export interface AiProvider {
  name: string;
  generateJson(args: GenerateJsonArgs): Promise<GenerateJsonResponse>;
}
