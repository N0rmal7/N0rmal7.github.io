# 博客安全配置说明

- 站点主地址统一为 https://n0rmal7.top/。
- Giscus 1.6.0 通过本地构建打包，依赖由 pnpm-lock.yaml 锁定；评论服务本身仍由 giscus.app 提供。
- 仅 `/dynamic/comments/` 可通过 `path` 选择实际存在的动态评论，其余页面忽略此参数。
- 移除不蒜子 JSONP 统计，以本地分类数、标签数替代访客数、浏览量，不再执行其远程脚本。
- 桌宠只加载 public/yuki/vendor 中的运行时；加载失败时隐藏，不回退到浮动 CDN。
- 页面 meta 提供 Referrer-Policy，以及禁止插件对象、限制 base 和表单提交的基础 CSP。

## 托管平台限制

当前 GitHub Pages 不支持项目自定义 HTTP 响应头，public/_headers 不会在那里生效。
此文件供未来使用 Cloudflare Pages 或 Netlify 时配置响应头。使用 CDN 代理时，需在 CDN 设置相同响应头并验证。
防嵌入必须使用响应头，不能用 meta 替代；这里保留 SAMEORIGIN / frame-ancestors 'self'，因为动态评论使用同源 iframe。
HSTS 仅应在 HTTPS 部署启用，本地 HTTP 预览无需设置；暂不包含 includeSubDomains 或 preload。

目前 CSP 未限制 script-src，不应视为完整的 XSS 防护。后续应先在支持自定义响应头的平台使用 Report-Only 测试脚本白名单，并为内联脚本生成哈希后再强制执行。

## 本地预览

运行 `pnpm dev --host 127.0.0.1`，在终端显示的本地地址查看。
Giscus 在 localhost 的显示及登录取决于远端仓库的域名允许配置。不要为了本地预览放宽生产域名权限。
本地预览不会发布线上；推送 main 后由 GitHub Actions 构建并部署到 GitHub Pages。

## 无功能变更的第二轮加固

- 构建任务仅有 contents: read，部署任务单独持有 pages/id-token 写权限。Checkout 不持久化凭据，Actions 固定完整提交 SHA；Dependabot 每周提交 npm 和 Actions 更新 PR，不自动合并。
- AES-GCM 每次加密使用独立随机 salt 和 IV，保持原载荷布局、PBKDF2 参数及浏览器解密兼容。保留现有会话密码缓存；存储受限时仍可正常解密阅读。缓存仍可被同源脚本读取，不适合保存高敏感信息。
- 客户端目录将标题作为纯文本转义，锚点属性单独转义；日历文章列表使用 DOM/textContent，保留原链接与样式，避免元数据被重新解释为 HTML。
- test:security 覆盖浏览器解密兼容、旧载荷、密码错误、密文篡改和目录注入。security:check-output 阻止常见私密配置路径进入 dist，并限制公开文章元数据字段；这不是全面的密钥扫描或渗透测试。
- 在现有依赖版本范围内更新安全修复，不强制跨主版本覆盖。2026-10-15 官方 npm 审计的告警计数从 high 27 / moderate 22 / low 8 降为 high 5 / moderate 7 / low 4，critical 始终为 0。告警计数不是可利用漏洞数量。

剩余告警主要在未启用的 Cloudflare 适配器链（miniflare 的 sharp/undici）、Swup 依赖携带的 microbundle 构建工具（serialize-javascript），以及旧版本 sprintf-js、KaTeX 和 postcss-selector-parser 链。当前使用静态 GitHub Pages，没有启用 CF_WORKERS；不因此将这些告警标记为已修复，也不通过强制跨版本覆盖来掩盖。后续随上游兼容升级处理，并持续复核调用路径。

本轮没有开启限制脚本来源的强制 CSP、关闭评论/密码缓存/组件，或修改域名、账号、CDN 设置。
