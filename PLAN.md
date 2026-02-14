# AI智能评测系统 - 开发计划

## 项目结构

```
ai-eval-system/
├── app/
│   ├── api/
│   │   ├── auth/           # 认证相关
│   │   ├── eval/           # 评测API
│   │   ├── admin/          # 管理后台API
│   │   └── upload/         # 文件上传
│   ├── (main)/             # 用户前台
│   │   ├── page.tsx        # 主评测页面
│   │   ├── layout.tsx
│   │   └── settings/       # 个人中心
│   ├── admin/              # 管理后台
│   │   ├── layout.tsx
│   │   ├── page.tsx        # 仪表盘
│   │   ├── users/
│   │   ├── invites/
│   │   ├── models/
│   │   ├── prompts/
│   │   └── logs/
│   ├── login/
│   ├── register/
│   └── layout.tsx
├── components/             # 共享组件
├── lib/
│   ├── prisma.ts          # Prisma客户端
│   ├── auth.ts            # 认证逻辑
│   └── ai.ts              # AI SDK配置
├── prisma/
│   └── schema.prisma      # 数据库模型
├── public/
├── middleware.ts          # 中间件（权限、频率限制）
└── package.json
```

## 数据库模型设计

### 用户 (User)
- id, email, passwordHash, name, avatar
- remainingEvals (剩余次数)
- inviteCodeId (关联邀请码)
- createdAt, updatedAt

### 邀请码 (InviteCode)
- id, code (唯一)
- status: unused | used
- usedBy (userId)
- createdAt

### 评测记录 (EvalLog)
- id, userId
- type: suggestion | policy
- input (前50字摘要)
- output (可选)
- tokensUsed
- createdAt

### AI模型配置 (AIModel)
- id, name, provider
- baseUrl, apiKey, modelName
- isActive

### Prompt模板 (PromptTemplate)
- id, name, type
- systemPrompt
- attachedFiles (JSON数组)

### 知识库文件 (KnowledgeFile)
- id, name, blobUrl, blobKey
- size, type
- uploadedAt

### 登录/操作日志 (AuditLog)
- id, userId, action, ip
- userAgent, metadata
- createdAt

## 开发阶段

### Phase 1: 基础框架 (今天)
- [ ] Next.js 初始化 + 依赖安装
- [ ] Prisma 配置 + 数据库模型
- [ ] 中间件：认证 + 频率限制

### Phase 2: 认证系统
- [ ] 邀请码验证流程
- [ ] 注册/登录页面
- [ ] 会话管理 (NextAuth.js 或自定义)

### Phase 3: 核心评测功能
- [ ] 左右分屏 UI
- [ ] 流式输出 (Vercel AI SDK)
- [ ] 额度扣减逻辑
- [ ] Markdown 渲染 + 复制功能

### Phase 4: 管理后台
- [ ] 邀请码生成/导出
- [ ] 用户管理
- [ ] AI模型配置
- [ ] Prompt编辑器 + @文件引用
- [ ] 日志查看/导出

### Phase 5: 部署文档
- [ ] README.md
- [ ] .env.example
- [ ] Vercel Deploy Button
