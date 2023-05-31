import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './entities/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // Does it have access/permission?
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    // Who is performing action
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Retrieve the user property from the request object

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Are they permitted
    return requiredRoles.some((role) => user?.roles.includes(role)); // The ? makes it have the option of undefined, if it's not there it'll fail when it is called without logging in
  }
}
