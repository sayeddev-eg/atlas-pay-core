import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service.js';
import { InviteMemberDto } from './dto/invite-member.dto.js';
import { AuthGuard } from '@nestjs/passport';
import { TenancyGuard } from '../../common/guards/tenancy.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { MembershipRole } from '@prisma/client';

@Controller('organizations')
@UseGuards(AuthGuard('jwt'))
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Get(':organizationId')
  @UseGuards(TenancyGuard)
  async getOrganization(@Param('organizationId') orgId: string) {
    return this.orgService.getOrganization(orgId);
  }

  @Get(':organizationId/members')
  @UseGuards(TenancyGuard)
  async getMembers(@Param('organizationId') orgId: string) {
    return this.orgService.getMembers(orgId);
  }

  @Post(':organizationId/members')
  @UseGuards(TenancyGuard, RolesGuard)
  @Roles(MembershipRole.ORG_ADMIN)
  async addMember(
    @Param('organizationId') orgId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.orgService.addMember(orgId, dto);
  }
}
