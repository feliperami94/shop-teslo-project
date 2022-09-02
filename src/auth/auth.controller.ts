import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { GetUser } from './deorators/get-user.decorator';
import { RawHeaders } from './deorators/raw-headers.decorator';
import { CreateUserDto, LoginUserDto } from './dto/index';
import { User } from './entities/user.entity';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }


  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('private')
  @UseGuards( AuthGuard() ) 
  testingPrivateRoute(
    // @Req() request: Express.Request, Just for reference
    @GetUser('email') userEmail: string,
    @RawHeaders() rawHeaders: string[]
  ) {
    return {
      ok: true,
      message: 'Hola Mundo Private',
      userEmail,
      rawHeaders
    }
  }


}
