import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) throw new UnauthorizedException();
    const token = authHeader.split(' ')[1];

    // API keys start with "vx_", JWTs start with "eyJ"
    if (!token.startsWith('vx_')) return true; // let JWT guard handle

    const user = await this.authService.validateApiKey(token);
    if (!user) throw new UnauthorizedException('Invalid API key');
    req.user = user;
    return true;
  }
}
