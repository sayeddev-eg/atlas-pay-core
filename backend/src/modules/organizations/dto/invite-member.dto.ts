import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MembershipRole } from '@prisma/client';

export class InviteMemberDto {
  @IsEmail({}, { message: 'Valid email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsEnum(MembershipRole, { message: 'Invalid membership role' })
  role: MembershipRole;
}
