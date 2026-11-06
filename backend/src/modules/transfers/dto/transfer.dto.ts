import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class TransferDto {
  @ApiProperty({ description: 'Tenant / Organization UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('4')
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ description: 'Unique idempotency key for this payment', example: 'idemp-tx-999' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @ApiProperty({ description: 'Source Wallet UUID', example: '11111111-e29b-41d4-a716-446655440001' })
  @IsUUID('4')
  @IsNotEmpty()
  fromWalletId: string;

  @ApiProperty({ description: 'Destination Wallet UUID', example: '22222222-e29b-41d4-a716-446655440002' })
  @IsUUID('4')
  @IsNotEmpty()
  toWalletId: string;

  @ApiProperty({ description: 'Transfer amount in minor currency units (cents/piastres)', example: '10000' })
  @Transform(({ value }) => BigInt(value))
  amountCents: bigint;

  @ApiProperty({ description: 'ISO 4217 Currency Code (3-letter)', example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency: string;
}
