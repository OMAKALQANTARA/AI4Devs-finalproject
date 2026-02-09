import { IsNumber } from 'class-validator';

export class CreateChatDto {
  @IsNumber()
  contactId!: number;
}
