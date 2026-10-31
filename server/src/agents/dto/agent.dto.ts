import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  name: string;

  @IsString()
  systemPrompt: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  temperature: number;

  @IsOptional()
  @IsString()
  llmProvider?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;
}

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @IsOptional()
  @IsString()
  llmProvider?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;
}
