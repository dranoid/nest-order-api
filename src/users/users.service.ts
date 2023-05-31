import {
  Injectable,
  BadRequestException,
  Inject,
  Scope,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Role } from './entities/role.enum';
import { SerializedUser } from './interfaces/user.interface';
import { plainToClass } from '@nestjs/class-transformer';
import * as bcrypt from 'bcrypt';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { UpdateUserDto } from './dto/update-user.dto';
import { OrderProductDto } from 'src/products/dto/order-product.dto';
import { orderItem } from 'src/products/interfaces/product.interface';
import { ProductsService } from 'src/products/products.service';
import { EmailerService } from 'src/emailer/emailer.service';

@Injectable({ scope: Scope.REQUEST }) // This allows the request object to be accessible accross the service
export class UsersService {
  constructor(
    private productsService: ProductsService,
    private mailingService: EmailerService,
    @InjectModel(User.name) private readonly usersModel: Model<User>,
    @Inject(REQUEST) private req: Request, // Dependency Injection of the request object in the class
  ) {}

  async createUser({ name, email, phone, hashedPassword }): Promise<User> {
    email = email.toLowerCase();
    const newUser = new this.usersModel({
      name,
      email,
      phone,
      password: hashedPassword,
      roles: [Role.ADMIN],
    });
    await newUser.save();
    return newUser;
  }

  async getUser(id: string): Promise<SerializedUser> {
    try {
      const user = await this.usersModel.findById(id);
      if (!user) {
        throw new NotFoundException();
      }
      return this.sanitizeNoToken(user);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getUserProfile(): Promise<SerializedUser> {
    const { _id } = this.req['user'];
    try {
      const user = await this.usersModel.findById(_id);
      if (!user) {
        throw new UnauthorizedException();
      }
      return this.sanitizeNoToken(user);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async updateUserProfile(
    updateUserDto: UpdateUserDto,
  ): Promise<SerializedUser> {
    const { _id } = this.req['user'];
    try {
      const hash = await bcrypt.hash(updateUserDto.password, 9);
      updateUserDto.password = hash;
      const user = await this.usersModel.findByIdAndUpdate(_id, updateUserDto, {
        new: true,
      });
      if (!user) {
        throw new UnauthorizedException();
      }

      return this.sanitizeNoToken(user);
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async deleteUser(): Promise<SerializedUser> {
    const { _id } = this.req['user'];
    try {
      const user = await this.usersModel.findByIdAndDelete(_id);
      if (!user) {
        throw new UnauthorizedException();
      }

      return this.sanitizeNoToken(user);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async orderProducts(orderProductDto: OrderProductDto[]) {
    const { _id } = this.req['user'];
    try {
      const user = await this.usersModel.findById(_id).lean();
      if (!user) {
        throw new NotFoundException();
      }

      // Perform quantity validation and update schemas
      const updatedOrders: orderItem[] =
        await this.productsService.orderValidation(orderProductDto);

      user.order.push({ list: updatedOrders });
      await this.usersModel.findByIdAndUpdate(_id, { order: user.order });

      const populatedUser = await this.usersModel
        .findById(_id)
        .populate('order.list.product', 'name description price')
        .lean();

      // const populatedOrder = populatedUser.order.find((order) => {
      //   return (
      //     order.list[0].product === updatedOrders[0].product &&
      //     order.list[1]?.product === updatedOrders[1]?.product
      //   );
      // });
      // console.log(populatedOrder);

      const originalOrderLength = user.order.length;
      const populatedOrder = populatedUser.order.slice(originalOrderLength - 1);

      const order = populatedOrder[0];
      console.log(populatedOrder[0].list[0]);

      this.mailingService.sendOrderEmail(order, order['_id'], user);
      this.mailingService.sendOrderSMS(user.phone, order['_id']);

      return populatedUser.order;
    } catch (error) {
      console.log(error);
      throw new BadRequestException();
    }
  }

  async getOrders(): Promise<{ list: orderItem[] }[]> {
    const { _id } = this.req['user'];
    try {
      const user = await this.usersModel
        .findById(_id)
        .populate('order.list.product', 'name description price')
        .exec();
      const orders = user.order;
      return orders;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async logOut() {
    const { _id } = this.req['user'];
    const access_token = this.req['access_token'];
    try {
      const user = await this.usersModel.findOneAndUpdate(
        { _id },
        { $pull: { tokens: { access_token } } },
        { new: true },
      );
      return this.sanitizeNoToken(user);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async logOutAll() {
    const { _id } = this.req['user'];
    try {
      const user = await this.usersModel.findOneAndUpdate(
        { _id },
        { $set: { tokens: [] } },
        { new: true },
      );
      return this.sanitizeNoToken(user);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async findByCredentials(email: string, password: string): Promise<User> {
    const user = await this.usersModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('Incorrect details!');
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new BadRequestException('Incorrect details!');
    }

    return user;
  }

  sanitizeUserObj(
    user: User,
    token: string,
  ): { user: SerializedUser; access_token: string } {
    const sUser = plainToClass(SerializedUser, user.toObject());
    return { user: sUser, access_token: token };
  }
  sanitizeUsers(users: User[]): SerializedUser[] {
    const sanitized = users.map((user) =>
      plainToClass(SerializedUser, user.toObject()),
    );
    return sanitized;
  }

  sanitizeNoToken(user: User): SerializedUser {
    return plainToClass(SerializedUser, user.toObject());
  }

  async getAllUsers(): Promise<SerializedUser[]> {
    const users = await this.usersModel.find();
    return this.sanitizeUsers(users);
  }
}
