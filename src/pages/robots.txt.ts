import type { APIRoute } from "astro";

export const prerender = true;

// 允许爬虫抓取 CSS/JS（/_astro/）：Google 需要这些资源来渲染页面、
// 评估移动友好性与页面体验；屏蔽静态资源只会损害收录质量。
// 只排除无 SEO 价值的查询参数筛选视图，避免重复内容。
const robotsTxt = `
User-agent: *
Allow: /
Disallow: /archive/?tag=
Disallow: /archive/?category=
Disallow: /archive/?uncategorized=

Sitemap: ${new URL("sitemap-index.xml", import.meta.env.SITE).href}
`.trim();

export const GET: APIRoute = () => {
	return new Response(robotsTxt, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};
