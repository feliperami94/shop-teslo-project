import { Controller, Get, Post, Body, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Auth, GetUser,RawHeaders, RoleProtected } from './decorators/index';
import { CreateUserDto, LoginUserDto } from './dto/index';
import { User } from './entities/user.entity';
import { UserRoleGuard } from './guards/user-role.guard';
import { ValidRoles } from './interfaces/valid-roles';


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

  @Get()
  checkAuthStatus(
    //todo:
  ){
    return this.authService.checkAuthStatus(/*id*/);
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

  @Get('private2')
  // @SetMetadata('roles', ['admin', 'super-user']) //This method is not recommended. Instead, use it like the following:
  @RoleProtected(ValidRoles.superUser, ValidRoles.admin)
  @UseGuards(AuthGuard(), UserRoleGuard) //When using custom guards, don't use (), don't need to create a new instance
  privateRoute2(
    @GetUser() user: User
  ) {
    return {
      ok: true,
      user
    }
  }

  @Get('private3')
  @Auth(ValidRoles.admin, ValidRoles.superUser)
  privateRoute3(
    @GetUser() user: User
  ) {
    return {
      ok: true,
      user
    }
  }


}
