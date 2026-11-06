import { MembershipRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  orgId: string; // organizationId لضمان العزل
  role: MembershipRole; // للتحكم في الصلاحيات (Maker/Checker)
}
