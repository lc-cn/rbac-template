import Link from 'next/link'
import { validateAuthorizeSearchParams } from '@/lib/oauth2/validate-authorize'
import { getOAuth2ClientByClientId } from '@/lib/oauth2/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PageShell, PageHeader } from '@/components/layout/page-shell'

type SearchParams = Record<string, string | string[] | undefined>

export default async function OAuthConsentPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string') sp.set(k, v)
    else if (Array.isArray(v) && v[0]) sp.set(k, v[0])
  }

  const validated = await validateAuthorizeSearchParams(sp)
  if (!validated.ok) {
    return (
      <PageShell>
        <PageHeader title="授权" description="请求参数无效或客户端校验未通过。" />
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            请从第三方应用重新发起登录；若问题持续，请联系管理员检查 client_id、redirect_uri 与 PKCE 配置。
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/">返回首页</Link>
            </Button>
          </CardFooter>
        </Card>
      </PageShell>
    )
  }

  const { clientId, redirectUri, scope, state, codeChallenge, codeChallengeMethod, nonce, responseType } =
    validated.data
  const row = await getOAuth2ClientByClientId(clientId)
  const appName = row?.name ?? clientId
  const scopes = scope.split(/\s+/).filter(Boolean)

  const metaLinks = [
    row?.clientUri ? { href: row.clientUri, label: '应用主页' } : null,
    row?.policyUri ? { href: row.policyUri, label: '隐私政策' } : null,
    row?.tosUri ? { href: row.tosUri, label: '服务条款' } : null,
  ].filter((x): x is { href: string; label: string } => x != null)

  return (
    <PageShell>
      <PageHeader title="授权确认" description="第三方应用请求访问你的账号信息，请确认是否允许。" />
      <Card className="max-w-lg">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          {row?.logoUrl ? (
            <img
              src={row.logoUrl}
              alt=""
              className="mt-0.5 h-14 w-14 shrink-0 rounded-xl border border-border/60 bg-muted object-cover"
            />
          ) : (
            <div className="mt-0.5 h-14 w-14 shrink-0 rounded-xl bg-muted ring-1 ring-border/60" />
          )}
          <div className="min-w-0 flex-1">
            <CardTitle className="leading-snug">{appName}</CardTitle>
            <CardDescription className="mt-2 break-all">回调地址：{redirectUri}</CardDescription>
            {metaLinks.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {metaLinks.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-foreground">请求的权限（scope）</p>
            <ul className="mt-2 list-inside list-disc text-muted-foreground">
              {scopes.length ? scopes.map((s) => <li key={s}>{s}</li>) : <li>openid</li>}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <form method="post" action="/api/oauth/consent" className="inline">
            <input type="hidden" name="response_type" value={responseType} />
            <input type="hidden" name="client_id" value={clientId} />
            <input type="hidden" name="redirect_uri" value={redirectUri} />
            <input type="hidden" name="scope" value={scope} />
            {state ? <input type="hidden" name="state" value={state} /> : null}
            {codeChallenge ? <input type="hidden" name="code_challenge" value={codeChallenge} /> : null}
            {codeChallengeMethod ? (
              <input type="hidden" name="code_challenge_method" value={codeChallengeMethod} />
            ) : null}
            {nonce ? <input type="hidden" name="nonce" value={nonce} /> : null}
            <Button type="submit" name="action" value="approve">
              同意并继续
            </Button>
          </form>
          <form method="post" action="/api/oauth/consent" className="inline">
            <input type="hidden" name="response_type" value={responseType} />
            <input type="hidden" name="client_id" value={clientId} />
            <input type="hidden" name="redirect_uri" value={redirectUri} />
            <input type="hidden" name="scope" value={scope} />
            {state ? <input type="hidden" name="state" value={state} /> : null}
            {codeChallenge ? <input type="hidden" name="code_challenge" value={codeChallenge} /> : null}
            {codeChallengeMethod ? (
              <input type="hidden" name="code_challenge_method" value={codeChallengeMethod} />
            ) : null}
            {nonce ? <input type="hidden" name="nonce" value={nonce} /> : null}
            <Button type="submit" name="action" value="deny" variant="outline">
              拒绝
            </Button>
          </form>
        </CardFooter>
      </Card>
    </PageShell>
  )
}
