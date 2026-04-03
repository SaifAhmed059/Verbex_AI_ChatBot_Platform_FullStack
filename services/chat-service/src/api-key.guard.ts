import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) throw new UnauthorizedException();
    const token = authHeader.split(' ')[1];

    // API keys start with "vx_", JWTs start with "eyJ"
    if (!token.startsWith('vx_')) return true; // let JWT guard handle

    try {
      const { data } = await axios.post(
        `${process.env.AUTH_SERVICE_URL}/validate-api-key`,
        { apiKey: token },
      );
      if (!data?.userId) throw new UnauthorizedException();
      req.user = { userId: data.userId, email: data.email };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid API key');
    }
  }
}
