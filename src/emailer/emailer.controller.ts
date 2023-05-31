import { Controller } from '@nestjs/common';
import { EmailerService } from './emailer.service';

@Controller('emailer')
export class EmailerController {
  constructor(private readonly emailerService: EmailerService) {}
}
