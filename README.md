# AI智能评测系统

基于 Next.js + Vercel Serverless 的 AI 智能评测平台。

## 功能特性

- 🤖 **多模型支持** - OpenAI、Azure、DeepSeek、Claude 等多种 AI 服务商
- 🎫 **邀请码注册** - 强身份验证机制，支持批量生成和导出
- 💰 **额度管理** - 新用户默认 99 次，管理员可随时充值
- 📝 **流式输出** - 打字机效果，Markdown 渲染，一键复制
- 📚 **知识库 RAG** - 上传 PDF/TXT，在 Prompt 中 `@引用`
- 🔧 **管理后台** - 用户管理、模型配置、Prompt 编辑、日志审计

## 快速部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/itestit/ai-eval-system)

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/itestit/ai-eval-system.git
cd ai-eval-system

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的配置

# 数据库迁移
npx prisma migrate dev --name init

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 环境变量配置

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `POSTGRES_PRISMA_URL` | PostgreSQL 连接 URL (带 pgbouncer) | ✅ |
| `POSTGRES_URL_NON_POOLING` | PostgreSQL 直连 URL | ✅ |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob Token | ✅ |
| `NEXTAUTH_SECRET` | JWT 密钥 (随机字符串) | ✅ |
| `ADMIN_SECRET` | 初始管理员密钥 | ✅ |
| `NEXT_PUBLIC_CONTACT` | 前端展示联系方式 | ❌ |

## 项目结构

```
app/
├── (main)/           # 用户前台
│   ├── page.tsx      # 评测主界面（左右分屏）
│   └── settings/     # 个人设置
├── admin/            # 管理后台
│   ├── page.tsx      # 仪表盘
│   ├── users/        # 用户管理
│   ├── invites/      # 邀请码管理
│   ├── models/       # AI模型配置
│   ├── prompts/      # Prompt模板
│   ├── files/        # 知识库文件
│   └── logs/         # 日志审计
├── api/              # API路由
├── login/            # 登录
└── register/         # 注册（邀请码验证）
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 样式 | Tailwind CSS + Radix UI |
| 数据库 | Vercel Postgres + Prisma |
| 存储 | Vercel Blob |
| AI | Vercel AI SDK + OpenAI SDK |
| 认证 | JWT (jose) |
| 部署 | Vercel Edge Functions |

## 使用指南

### 1. 首次部署

1. 点击上方 "Deploy" 按钮，在 Vercel 创建项目
2. 配置 PostgreSQL 数据库（可用 Vercel Postgres）
3. 配置 Blob 存储（在 Vercel 项目设置中）
4. 设置环境变量
5. 部署后访问 `/register`，使用任意邀请码注册第一个账户
6. 在数据库中将该用户设为管理员：`UPDATE "User" SET "isAdmin" = true WHERE email = 'your@email.com'`

### 2. 管理后台

登录后访问 `/admin`

- **仪表盘** - 查看系统统计数据
- **邀请码** - 生成/导出邀请码
- **用户管理** - 查看用户、充值额度
- **模型配置** - 添加 AI 服务商（OpenAI/DeepSeek等）
- **Prompt模板** - 编辑系统提示词，使用 `@文件名` 引用知识库
- **知识库** - 上传 PDF/TXT 文件供 RAG 使用
- **日志审计** - 查看用户操作记录

### 3. 评测流程

1. 用户在左侧输入文本
2. 点击"开始评测"
3. AI 流式返回结果（右侧显示）
4. 支持 Markdown 渲染
5. 点击右上角复制按钮复制结果

## 开发文档

详见 [DEVELOPMENT.md](./DEVELOPMENT.md)

## License

MIT
# Build fix
