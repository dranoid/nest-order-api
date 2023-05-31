import { Test, TestingModule } from '@nestjs/testing';
import { EmailerController } from './emailer.controller';
import { EmailerService } from './emailer.service';

describe('EmailerController', () => {
  let controller: EmailerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailerController],
      providers: [EmailerService],
    }).compile();

    controller = module.get<EmailerController>(EmailerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
