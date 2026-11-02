import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Response } from 'express';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class LlmService {
  private openai = new OpenAI({ 
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENAI_API_KEY 
  });
  private anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  async streamResponse(
    provider: string,
    systemPrompt: string,
    temperature: number,
    messages: Message[],
    res: Response,
  ): Promise<string> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    let fullContent = '';

    try {
      if (provider === 'anthropic') {
        const stream = await this.anthropic.messages.stream({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1024,
          system: systemPrompt,
          temperature,
          messages,
        });

        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            const text = chunk.delta.text;
            fullContent += text;
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
      } else {
        // Default: OpenRouter free models
        let actualModel = provider;
        if (!actualModel || actualModel === 'openai' || actualModel.includes('gpt-oss') || actualModel.includes('gemma-3n')) {
          actualModel = 'openrouter/free';
        }

        let stream;
        try {
          stream = await this.openai.chat.completions.create({
            model: actualModel,
            max_tokens: 1024,
            temperature,
            stream: true,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
            ],
          });
        } catch (firstErr: any) {
          console.warn(`Primary model ${actualModel} failed (${firstErr.message}), falling back to openrouter/free`);
          stream = await this.openai.chat.completions.create({
            model: 'openrouter/free',
            max_tokens: 1024,
            temperature,
            stream: true,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
            ],
          });
        }

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            fullContent += text;
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
      }
    } catch (error: any) {
      console.error('LLM API Error:', error.message || error);
      const errorMsg = `\n[Error from AI Provider: ${error.message || 'Unknown error'}]`;
      fullContent += errorMsg;
      res.write(`data: ${JSON.stringify({ text: errorMsg })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    return fullContent;
  }
}
