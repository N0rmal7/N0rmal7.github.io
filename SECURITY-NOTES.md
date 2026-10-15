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
