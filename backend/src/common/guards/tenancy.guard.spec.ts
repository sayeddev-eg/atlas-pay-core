import { describe, it, expect } from 'vitest';
import { TenancyGuard } from './tenancy.guard.js';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('TenancyGuard (Strict Multi-Tenant Isolation)', () => {
  const guard = new TenancyGuard();

  function mockContext(user: any, params: any = {}, headers: any = {}): ExecutionContext {
    const request = { user, params, headers };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access when request orgId matches user token orgId', () => {
    const orgId = '550e8400-e29b-41d4-a716-446655440000';
    const ctx = mockContext(
      { userId: 'u1', orgId, role: 'MAKER' },
      { orgId },
      {},
    );

    const result = guard.canActivate(ctx);
    expect(result).toBe(true);
    expect((ctx.switchToHttp().getRequest() as any).tenantId).toBe(orgId);
  });

  it('should allow access when orgId is passed via x-tenant-id header', () => {
    const orgId = '550e8400-e29b-41d4-a716-446655440000';
    const ctx = mockContext(
      { userId: 'u1', orgId, role: 'MAKER' },
      {},
      { 'x-tenant-id': orgId },
    );

    const result = guard.canActivate(ctx);
    expect(result).toBe(true);
    expect((ctx.switchToHttp().getRequest() as any).tenantId).toBe(orgId);
  });

  it('should strictly throw ForbiddenException when cross-tenant access is attempted', () => {
    const userOrgId = '550e8400-e29b-41d4-a716-446655440000';
    const attackerTargetOrgId = '99999999-e29b-41d4-a716-999999999999';

    const ctx = mockContext(
      { userId: 'u1', orgId: userOrgId, role: 'MAKER' },
      { orgId: attackerTargetOrgId },
      {},
    );

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Cross-tenant access is strictly prohibited');
  });

  it('should throw ForbiddenException if user has no orgId in token', () => {
    const ctx = mockContext({ userId: 'u1' }, { orgId: 'org-1' }, {});
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Tenant identification missing in token');
  });
});
