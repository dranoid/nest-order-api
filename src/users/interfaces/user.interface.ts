import { orderItem } from 'src/products/interfaces/product.interface';
import { Role } from '../entities/role.enum';
import { Exclude, Transform } from '@nestjs/class-transformer';
export interface User {
  name: string;
  email: string;
  password: string;
  phone: string;
  order?: { list: orderItem[] }[];
  roles: Role[];
  tokens: { access_token: string }[];
}

export class SerializedUser {
  @Transform((params) => params.obj._id) //  Class transformer has issues with id so this transform is the workaround, seen on SO and github
  _id: string;

  name: string;
  email: string;
  phone: string;

  @Exclude()
  password: string;

  order?: { list: orderItem[] }[];
  roles: Role[];

  @Exclude()
  tokens: { access_token: string }[];

  // NOTE: Ideally this is the doc's option but since the doc asks the endpoint to return the object to be serialized for it to work properly, I used the plainToClass method
  // constructor(partial: Partial<SerializedUser>) {
  //   Object.assign(this, partial);
  // }
}
