# 超级个体社区

AI 时代，一个人就是一支队伍。围绕超级个体与一人公司，讲 AI 如何改变个体与公司。

轻量**静态站**（无后端、无构建步骤），直接双击 `index.html` 即可打开，或任意静态服务器托管。

## 为什么是静态

原来是一套 Next.js + Supabase 的动态站（97 个文件）。对「展示 + 阅读」这个场景来说太重了。
现在对齐成「**超级个体社区**」单一方向，并改为单文件 HTML + 一个数据源脚本驱动，参照 `leaping/你好丽萍` 的轻量范式：

- 文件少、改起来快
- 不依赖数据库 / 运行时
- 内容集中在一个文件里维护

## 文件结构

```
AIclaw网站/
├── index.html     # 首页：顶栏 + 一句话 + 倒序内容流 + 分类筛选 + 搜索
├── article.html   # 文章详情页（?id=xxx）
├── posts.js       # ★ 内容单源（window.POSTS，倒序；改文章只动这里）
├── site.js        # 渲染逻辑：流 / 筛选 / ⌘K 搜索 / 详情 / localStorage 点赞
├── site.css       # 浅色样式（不暗底）
└── README.md
```

## 六个主题

| 主题 | slug | 色 |
|------|------|----|
| 认知觉醒 | cognition | #6366f1 |
| 一人公司 | solo-company | #0ea5e9 |
| AI 实战 | ai-practice | #22c55e |
| 我的践行 | my-journey | #f59e0b |
| 个体案例 | cases | #ec4899 |
| 变现与商业化 | monetization | #ef4444 |

## 怎么发一篇新内容

打开 `posts.js`，在 `window.POSTS` 数组**最前面**加一条即可（数组是倒序，第一条最新）：

```js
{
  id: "p20260810-xxx",              // 唯一 id，详情页靠它跳转
  title: "标题",
  summary: "一句话摘要",
  category: { name: "AI 实战", slug: "ai-practice", color: "#22c55e" },
  date: "2026-08-10",
  views: 0, likes: 0,
  content: "正文，用 \\n\\n 分段；## 小标题；- 列表；1. 有序列表。"
}
```

正文支持极简 markdown：`## ` 小标题、`- ` 列表、`1. ` 有序列表，其余按段落。

## 交互说明（纯前端）

- 分类筛选、⌘K/Ctrl+K 搜索：前端 JS 过滤，不需要服务器
- 点赞：仅存浏览器 `localStorage`，是「本地收藏」，不跨设备
- 无真实评论 / 发帖：静态站只做展示与阅读

## 本地预览

```bash
# 任选其一
python3 -m http.server 3000      # 然后访问 http://localhost:3000
# 或直接双击 index.html
```
