import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from './prisma.service.js';

@Injectable({ scope: Scope.REQUEST })
export class TenantPrismaService {
  private client: any;

  constructor(
    @Inject(REQUEST) private request: Request & { tenantId?: string },
    private prismaService: PrismaService,
  ) {
    const tenantId = this.request.tenantId;

    if (tenantId) {
      // استخدام Prisma Client Extensions لفرض العزل الإجباري
      this.client = this.prismaService.$extends({
        query: {
          $allModels: {
            async $allOperations({ model, operation, args, query }: any) {
              // استثناء النماذج العامة التي لا تحتوي على organizationId
              const modelsWithoutTenant = ['User', 'Organization'];

              if (!modelsWithoutTenant.includes(model)) {
                args = args || {};
                args.where = { ...args.where, organizationId: tenantId };

                // إضافة الـ tenantId تلقائياً عند إنشاء سجل جديد
                if (operation === 'create' || operation === 'createMany') {
                  args.data = Array.isArray(args.data)
                    ? args.data.map((d: any) => ({ ...d, organizationId: tenantId }))
                    : { ...args.data, organizationId: tenantId };
                }
              }
              return query(args);
            },
          },
        },
      });
    } else {
      this.client = this.prismaService;
    }
  }

  get db() {
    return this.client;
  }
}
