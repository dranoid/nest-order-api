import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { EmailerModule } from './emailer/emailer.module';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    UsersModule,
    ProductsModule,
    MongooseModule.forRoot(process.env.MONGODB_URI), // The configModule in authModule is the one allowing env variables (incorrect behaviour, it's meant to be from here) find out why.
    AuthModule,
    EmailerModule,
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        // port: 587,
        secure: true,
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.GOOGLE_MAIL_PWD,
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
