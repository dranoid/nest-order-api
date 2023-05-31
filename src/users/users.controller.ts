import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SerializedUser } from './interfaces/user.interface';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { Role } from './entities/role.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { OrderProductDto } from 'src/products/dto/order-product.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  getAllUsers(): Promise<SerializedUser[]> {
    return this.usersService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getUserProfile() {
    return this.usersService.getUserProfile();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateUserProfile(
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<SerializedUser> {
    return this.usersService.updateUserProfile(updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  deleteUserProfile(): Promise<SerializedUser> {
    return this.usersService.deleteUser();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/logout')
  logOutUser() {
    return this.usersService.logOut();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/logoutAll')
  logOutAllUserSessions() {
    return this.usersService.logOutAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/order')
  placeOrder(@Body() orderProductDto: OrderProductDto[]) {
    return this.usersService.orderProducts(orderProductDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/order')
  getUserOrders() {
    return this.usersService.getOrders();
  }

  // Admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  // Nest's ordering issue, it will treat me as an id if it's above.
  @Get(':id')
  getOneUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }
}
