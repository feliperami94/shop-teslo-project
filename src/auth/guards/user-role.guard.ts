import {Reflector} from '@nestjs/core'
import { CanActivate, ExecutionContext, Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class UserRoleGuard implements CanActivate {

  constructor (
    private readonly reflector: Reflector
  ){}


  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const validRoles: string[] = this.reflector.get('roles', context.getHandler())

    if (!validRoles) return true; //This means, if there is no valid Roles, everyone could enter

    if ( validRoles.length === 0) return true;


    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user)
      throw new BadRequestException('User not found')

    for (const role of user.roles) {
      if (validRoles.includes(role)){
        return true
      }
    }

    throw new ForbiddenException(
      `User ${user.fullName} need a valid role: [${validRoles}]`
    )
    
  }
}
