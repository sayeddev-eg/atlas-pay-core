import { Controller, Post, Body, UseGuards, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenancyGuard } from '../../common/guards/tenancy.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor.js';
import { TransferDto } from './dto/transfer.dto.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { MembershipRole } from '@prisma/client';

@ApiTags('Transfers')
@ApiBearerAuth()
@Controller({ path: 'orgs/:orgId/transfers', version: '1' })
@UseGuards(JwtAuthGuard, TenancyGuard, RolesGuard)
export class TransfersController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post('initiate')
  @HttpCode(HttpStatus.ACCEPTED)
  @Roles(MembershipRole.MAKER)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'x-idempotency-key', required: true })
  @ApiOperation({ summary: 'Initiate a dual-entry transfer between wallets' })
  @ApiResponse({ status: 202, description: 'Transfer accepted and queued for processing.' })
  @ApiResponse({ status: 409, description: 'Idempotency conflict (Double-spending attempt).' })
  async initiateTransfer(@Body() dto: TransferDto) {
    // Deferring execution to the ledger engine.
    // The idempotency interceptor guarantees this won't process twice.
    return this.ledgerService.processTransfer(
      dto.tenantId,
      dto.idempotencyKey,
      dto.fromWalletId,
      dto.toWalletId,
      dto.amountCents,
      dto.currency,
    );
  }
}
