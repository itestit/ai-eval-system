> **Warning**: Need to run `npm install` and setup environment variables before development.

## 环境要求

- Node.js 18+
- PostgreSQL 数据库 (推荐使用 Vercel Postgres)
- Vercel Blob 存储

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的数据库和 Blob 配置

# 3. 初始化数据库
npx prisma migrate dev --name init

# 4. 启动开发服务器
npm run dev
```

## 首次部署

1. 在 Vercel 创建项目，连接到你的 GitHub 仓库
2. 添加以下环境变量到 Vercel：
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `BLOB_READ_WRITE_TOKEN`
   - `NEXTAUTH_SECRET`
   - `ADMIN_SECRET`

3. 部署后访问 `/admin`，使用 `ADMIN_SECRET` 作为密码创建初始管理员账户

## 数据库更新

每次修改 `prisma/schema.prisma` 后运行：

```bash
npx prisma migrate dev --name your_change_name
npx prisma generate
```

## 项目结构

```
app/
├── (main)/              # 用户前台（需登录）
│   ├── page.tsx         # 评测主页面
│   └── settings/        # 个人设置
├── admin/               # 管理后台（需管理员权限）
│   ├── page.tsx         # 仪表盘
│   ├── users/           # 用户管理
│   ├── invites/         # 邀请码
│   ├── models/          # AI模型配置
│   ├── prompts/         # Prompt模板
│   ├── files/           # 知识库文件
│   └── logs/            # 日志审计
├── api/                 # API路由
├── login/               # 登录页
└── register/            # 注册页
```
