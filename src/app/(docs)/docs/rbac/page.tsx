import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsArticle } from '@/components/docs/docs-article'

export const metadata: Metadata = {
  title: '权限与治理',
  description: '租户治理（UserTenant.tenantRole）与第二波 RBAC（Permission.code）的关系、403 机器码与运维旁路开关。',
}

export default function DocsRbacPage() {
  return (
    <DocsArticle
      title="权限与治理"
      description="先满足组织治理规则（若路由声明了治理要求），再校验业务权限码（若声明了 permission）。二者数据来源不同，请勿混用。"
    >
      <section className="space-y-4">
        <h2 className="docs-article-h2">两波能力如何叠加</h2>
        <p>
          <strong className="text-foreground">第一波（治理）</strong>：针对部分用户管理写路径，要求调用者在目标租户下具备{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">owner</code> 或{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">admin</code> 等条件（例如不可删除 owner）。不满足时返回 HTTP 403，机器码形如{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">forbidden_*</code>。
        </p>
        <p>
          <strong className="text-foreground">第二波（RBAC）</strong>：在已具备当前租户成员资格的前提下，按{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">Permission.code</code> 校验（联结路径：UserRole → Role → RolePermission → Permission，且 Role 的 tenantId 与当前租户一致）。不满足时返回 HTTP 403，JSON 中常见{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">forbidden_permission</code>。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">权限码一览（与种子数据一致）</h2>
        <p>业务权限码在源码中定义为常量，便于与 API 守卫对照：</p>
        <ul className="list-disc space-y-2 pl-5 font-mono text-[0.8125rem] text-foreground/90">
          <li>user:read / create / update / delete</li>
          <li>role:read / create / update / delete</li>
          <li>perm:read / create / update / delete</li>
          <li>application:read / create / update / delete</li>
          <li>feature:read / create / update / delete（应用下的功能模块实体）</li>
          <li>oauth_client:read / write（含密钥等敏感字段）</li>
          <li>system_config:read / update</li>
        </ul>
        <p>
          完整路由 × 方法 × 治理 × Permission 对照表见仓库内{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">docs/governance-matrix.md</code> 与{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">src/lib/tenant-route-permissions.ts</code>。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">平台管理员与「无租户」会话</h2>
        <p>
          标记为平台管理员（<code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">User.isPlatformAdmin</code>）的账号，在<strong className="text-foreground">未选择</strong>{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">currentTenantId</code> 时，仅可访问<strong className="text-foreground">只读</strong>的跨租户平台 API（
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">/platform</code>、
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">/api/platform/*</code>）。进入某一租户后，<strong className="text-foreground">不享受 RBAC 豁免</strong>，仍须具备该租户的{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">UserTenant</code> 成员关系及对应 permission。
        </p>
        <p>
          个人资料、租户列表与自助创建租户等路由属于<strong className="text-foreground">账户或入驻流程</strong>，不按上表 permission 守卫；OAuth 协议端点另有独立流程，见{' '}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/docs/oauth2">
            OIDC 接入指南
          </Link>
          。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">运维旁路：ENFORCE_RBAC_ON_WRITE</h2>
        <p>
          环境变量 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">ENFORCE_RBAC_ON_WRITE</code> 为关闭值时，可<strong className="text-foreground">跳过</strong>第二波租户内 permission 校验（仅用于排障；生产默认值应为开启）。第一波治理规则不受影响。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">升级与种子</h2>
        <p>
          合并包含新 permission 的代码后，请在目标环境执行一次幂等种子（例如 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">pnpm run seed</code>）或等价 SQL，为默认租户「超级管理员」角色绑定全量权限，避免升级后无法操作后台。详见{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">docs/governance-matrix.md</code> 末尾说明。
        </p>
      </section>
    </DocsArticle>
  )
}
