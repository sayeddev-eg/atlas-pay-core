import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenancyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // استخراج orgId من الـ Params أو الـ Headers حسب تصميم الـ API
    const requestOrgId =
      request.params?.orgId ||
      request.params?.organizationId ||
      request.headers['x-tenant-id'] ||
      request.headers['x-organization-id'];

    if (!user || !user.orgId) {
      throw new ForbiddenException('Tenant identification missing in token');
    }

    // مطابقة نطاق الطلب مع صلاحية المستخدم في الـ Token
    if (requestOrgId && requestOrgId !== user.orgId) {
      throw new ForbiddenException('Cross-tenant access is strictly prohibited');
    }

    // حقن الـ tenantId في الطلب لاستخدامه لاحقاً في خدمات قاعدة البيانات
    request.tenantId = user.orgId;

    return true;
  }
}
