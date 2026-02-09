import { IsEnum, IsNumber, IsString, MaxLength, MinLength } from 'class-validator';

export enum MessageContentType {
  TEXT = 'TEXT',
}

export enum MessageVisibilityType {
  PLAIN = 'PLAIN',
}

export class CreateMessageDto {
  @IsNumber()
  chatId!: number;

  @IsEnum(MessageContentType)
  contentType!: MessageContentType;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  contentText!: string;

  @IsEnum(MessageVisibilityType)
  visibilityType!: MessageVisibilityType;
}
