/** 长文左侧 / 折叠目录复用（避免在页面中重复维护两份结构） */
export function OAuth2DocsToc() {
  return (
    <nav className="docs-toc text-sm leading-relaxed" aria-label="本页目录">
      <ol className="list-decimal space-y-2 pl-5 marker:font-medium marker:text-foreground/70">
        <li>
          <a href="#conventions" className="font-medium text-foreground hover:underline">
            约定、术语与边界
          </a>
          <ol className="mt-1.5 list-[lower-alpha] space-y-1 pl-5 text-muted-foreground marker:text-foreground/50">
            <li>
              <a href="#conventions-terms" className="hover:text-foreground">
                术语与引用规范
              </a>
            </li>
            <li>
              <a href="#conventions-boundary" className="hover:text-foreground">
                与本系统其它能力的关系
              </a>
            </li>
          </ol>
        </li>
        <li>
          <a href="#discovery" className="font-medium text-foreground hover:underline">
            元数据与端点发现
          </a>
          <ol className="mt-1.5 list-[lower-alpha] space-y-1 pl-5 text-muted-foreground">
            <li>
              <a href="#discovery-why" className="hover:text-foreground">
                为何以 Discovery 为第一步
              </a>
            </li>
            <li>
              <a href="#discovery-requests" className="hover:text-foreground">
                请求与缓存建议
              </a>
            </li>
            <li>
              <a href="#discovery-fields" className="hover:text-foreground">
                元数据字段说明（摘要）
              </a>
            </li>
          </ol>
        </li>
        <li>
          <a href="#register" className="font-medium text-foreground hover:underline">
            在管理控制台注册客户端
          </a>
          <ol className="mt-1.5 list-[lower-alpha] space-y-1 pl-5 text-muted-foreground">
            <li>
              <a href="#register-console" className="hover:text-foreground">
                入口、权限与数据模型
              </a>
            </li>
            <li>
              <a href="#register-fields" className="hover:text-foreground">
                回调、Scope、令牌与客户端类型
              </a>
            </li>
            <li>
              <a href="#register-seed" className="hover:text-foreground">
                开发环境种子客户端
              </a>
            </li>
          </ol>
        </li>
        <li>
          <a href="#flow" className="font-medium text-foreground hover:underline">
            授权码 + PKCE 全流程
          </a>
          <ol className="mt-1.5 list-[lower-alpha] space-y-1 pl-5 text-muted-foreground">
            <li>
              <a href="#flow-roles" className="hover:text-foreground">
                浏览器端与后端职责划分
              </a>
            </li>
            <li>
              <a href="#flow-authorize" className="hover:text-foreground">
                授权请求与错误表现
              </a>
            </li>
            <li>
              <a href="#flow-login-mfa" className="hover:text-foreground">
                登录页与 MFA 插页
              </a>
            </li>
            <li>
              <a href="#flow-consent-callback" className="hover:text-foreground">
                同意页与回调校验
              </a>
            </li>
          </ol>
        </li>
        <li>
          <a href="#token" className="font-medium text-foreground hover:underline">
            令牌端点
          </a>
          <ol className="mt-1.5 list-[lower-alpha] space-y-1 pl-5 text-muted-foreground">
            <li>
              <a href="#token-transport" className="hover:text-foreground">
                传输格式与客户端认证
              </a>
            </li>
            <li>
              <a href="#token-code" className="hover:text-foreground">
                授权码换 token
              </a>
            </li>
            <li>
              <a href="#token-refresh" className="hover:text-foreground">
                刷新令牌与轮换
              </a>
            </li>
            <li>
              <a href="#token-errors" className="hover:text-foreground">
                错误码与响应体
              </a>
            </li>
          </ol>
        </li>
        <li>
          <a href="#resource" className="font-medium text-foreground hover:underline">
            UserInfo、吊销、自省、登出
          </a>
          <ol className="mt-1.5 list-[lower-alpha] space-y-1 pl-5 text-muted-foreground">
            <li>
              <a href="#resource-userinfo" className="hover:text-foreground">
                UserInfo
              </a>
            </li>
            <li>
              <a href="#resource-revoke" className="hover:text-foreground">
                吊销
              </a>
            </li>
            <li>
              <a href="#resource-introspect" className="hover:text-foreground">
                自省
              </a>
            </li>
            <li>
              <a href="#resource-logout" className="hover:text-foreground">
                登出
              </a>
            </li>
          </ol>
        </li>
        <li>
          <a href="#security" className="font-medium text-foreground hover:underline">
            安全清单、核对表与排障
          </a>
          <ol className="mt-1.5 list-[lower-alpha] space-y-1 pl-5 text-muted-foreground">
            <li>
              <a href="#security-checklist" className="hover:text-foreground">
                实施核对表
              </a>
            </li>
            <li>
              <a href="#security-faq" className="hover:text-foreground">
                常见问题
              </a>
            </li>
          </ol>
        </li>
      </ol>
    </nav>
  )
}
