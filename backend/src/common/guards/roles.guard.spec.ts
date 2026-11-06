import { describe, it, expect, vi } from 'vitest';
import { RolesGuard } from './roles.guard.js';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';

describe('RolesGuard (Maker-Checker Segregation)', () => {
  function createMockReflector(roles?: MembershipRole[]): Reflector {
    return {
      getAllAndOverride: vi.fn().mockReturnValue(roles),
    } as unknown as Reflector;
  }

  function mockContext(user: any): ExecutionContext {
    const request = { user };
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access if no roles are defined on route', () => {
    const reflector = createMockReflector(undefined);
    const guard = new RolesGuard(reflector);
    const ctx = mockContext({ role: MembershipRole.VIEWER });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow MAKER to initiate transfer', () => {
    const reflector = createMockReflector([MembershipRole.MAKER]);
    const guard = new RolesGuard(reflector);
    const ctx = mockContext({ role: MembershipRole.MAKER });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should strictly reject MAKER from approving transfer (Maker cannot approve)', () => {
    const reflector = createMockReflector([MembershipRole.CHECKER]);
    const guard = new RolesGuard(reflector);
    const ctx = mockContext({ role: MembershipRole.MAKER });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Access denied. Requires one of: CHECKER');
  });

  it('should allow CHECKER to approve transfer', () => {
    const reflector = createMockReflector([MembershipRole.CHECKER]);
    const guard = new RolesGuard(reflector);
    const ctx = mockContext({ role: MembershipRole.CHECKER });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException if user has no role in token', () => {
    const reflector = createMockReflector([MembershipRole.MAKER]);
    const guard = new RolesGuard(reflector);
    const ctx = mockContext({});

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
