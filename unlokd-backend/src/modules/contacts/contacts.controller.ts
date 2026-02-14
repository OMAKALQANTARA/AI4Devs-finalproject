import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';

type RequestWithUser = {
  user: {
    userId: number;
    email: string;
    username: string;
  };
};

@Controller('api/v1/contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async listContacts(@Request() req: RequestWithUser) {
    return this.contactsService.listContacts(req.user.userId);
  }

  @Post()
  async addContact(@Request() req: RequestWithUser, @Body() body: CreateContactDto) {
    return this.contactsService.addContact(req.user.userId, body.email);
  }

  @Delete(':contactUserId')
  async deleteContact(
    @Request() req: RequestWithUser,
    @Param('contactUserId') contactUserId: string,
  ) {
    await this.contactsService.deleteContact(req.user.userId, Number(contactUserId));
    return { success: true };
  }
}
