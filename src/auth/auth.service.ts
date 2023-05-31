import * as bcrypt from 'bcrypt';
import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { User } from 'src/users/schema/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import { SerializedUser } from 'src/users/interfaces/user.interface';
import { EmailerService } from 'src/emailer/emailer.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly usersModel: Model<User>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailingService: EmailerService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<{ user: SerializedUser; access_token: string }> {
    try {
      // Save user details and hash password
      const { password, email, name, phone } = createUserDto;
      const hashedPassword = await this.hashPassword(password);
      const newUser = await this.usersService.createUser({
        name,
        hashedPassword,
        email,
        phone,
      });
      //gen auth token
      const token = await this.generateAuthToken(newUser['_id'], newUser.roles);
      //sanitize to remove pwd
      const finalObj = this.usersService.sanitizeUserObj(newUser, token);
      // Send welcome mail
      this.mailingService.sendSignUpEmail(createUserDto);
      return finalObj;
    } catch (error) {
      //   console.log(error);
      if (
        error.code == 11000 &&
        error.keyPattern &&
        error.keyPattern.email == 1
      ) {
        throw new ConflictException('Email already exists');
      } else {
        throw new BadRequestException();
      }
    }
  }

  async loginUser(
    loginUserDto: LoginUserDto,
  ): Promise<{ user: SerializedUser; access_token: string }> {
    const { email, password } = loginUserDto;
    try {
      const existingUser = await this.usersService.findByCredentials(
        email.toLowerCase(),
        password,
      );
      const { roles } = existingUser;
      const _id = existingUser['_id'];
      const token = await this.generateAuthToken(_id, roles);
      const finalObj = this.usersService.sanitizeUserObj(existingUser, token);
      return finalObj;
    } catch (error) {
      console.log(error);
      throw new BadRequestException();
    }
  }

  // Utility methods

  async hashPassword(plaintext: string): Promise<string> {
    return await bcrypt.hash(plaintext, 9);
  }

  async generateAuthToken(_id, roles) {
    const user = await this.usersModel.findById(_id);
    const token = await this.jwtService.signAsync({ sub: _id, role: roles });
    user.tokens = user.tokens.concat({ access_token: token });
    await user.save();
    return token;
  }
}
