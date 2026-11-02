import {
  Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto, RefreshDto } from './dto/auth.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  googleAuth(@Body() body: { credential: string }) {
    return this.authService.googleAuth(body.credential);
  }

  @Post('github')
  @HttpCode(HttpStatus.OK)
  githubAuth(@Body() body: { code: string }) {
    return this.authService.githubAuth(body.code);
  }

  @Post('oauth/demo')
  @HttpCode(HttpStatus.OK)
  demoOAuth(@Body() body: { provider: 'google' | 'github' }) {
    return this.authService.demoOAuth(body.provider || 'google');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }

  @Post('api-key')
  @UseGuards(AuthGuard('jwt'))
  generateApiKey(@Request() req) {
    return this.authService.generateApiKey(req.user.userId);
  }

  @Post('validate-api-key')
  @HttpCode(HttpStatus.OK)
  validateApiKey(@Body() body: { apiKey: string }) {
    return this.authService.validateApiKey(body.apiKey);
  }
}
