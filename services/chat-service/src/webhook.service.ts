import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  async fire(webhookUrl: string, payload: Record<string, any>) {
    if (!webhookUrl) return;
    try {
      await axios.post(webhookUrl, payload, { timeout: 5000 });
      this.logger.log(`Webhook fired to ${webhookUrl}`);
    } catch (err) {
      this.logger.warn(`Webhook failed for ${webhookUrl}: ${err.message}`);
    }
  }
}
