import { IsEmail, IsNotEmpty } from 'class-validator';
export class CreateUserDto {
  readonly name: string;

  @IsEmail()
  readonly email: string;

  readonly phone: string;

  @IsNotEmpty()
  readonly password: string;
}
