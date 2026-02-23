# AI智能评测系统 - 完整技术文档

> **系统版本**: v1.0.0  
> **最后更新**: 2026-02-22  
> **文档目标**: 帮助维护人员在零了解前提下掌握系统全部细节

---

## 目录

1. [系统概述](#1-系统概述)
2. [技术架构](#2-技术架构)
3. [项目结构](#3-项目结构)
4. [数据模型](#4-数据模型)
5. [核心模块详解](#5-核心模块详解)
6. [API接口文档](#6-api接口文档)
7. [配置说明](#7-配置说明)
8. [部署指南](#8-部署指南)
9. [开发维护](#9-开发维护)
10. [故障排查](#10-故障排查)
11. [附录](#11-附录)

---

## 1. 系统概述

### 1.1 系统定位

AI智能评测系统是一个基于 **Next.js + Vercel Serverless** 架构的智能文本评测平台。用户输入文本后，系统调用AI模型进行分析和评测，返回结构化的评测结果。

### 1.2 核心功能

| 功能模块 | 说明 |
|---------|------|
| **邀请码注册** | 强身份验证机制，支持批量生成和导出邀请码 |
| **额度管理** | 新用户默认99次评测额度，管理员可充值 |
| **多模型支持** | OpenAI、Azure、DeepSeek、Claude、月之暗面、智谱AI等 |
| **流式输出** | 打字机效果，Markdown渲染，一键复制 |
| **知识库RAG** | 上传PDF/TXT，在Prompt中`@引用` |
| **管理后台** | 用户管理、模型配置、Prompt编辑、日志审计 |

### 1.3 业务流程

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ 获取邀请码 │────▶│ 用户注册  │────▶│ 登录系统  │────▶│ 输入文本  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                           │
     ┌─────────────────────────────────────────────────────┘
     │
     ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ AI模型调用 │────▶│ 流式输出  │────▶│ 额度扣减  │────▶│ 结果展示  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

---

## 2. 技术架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                           前端层                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   评测页面   │  │   管理后台   │  │  登录/注册(邀请码验证)   │  │
│  │  (main)     │  │  (admin)    │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                        Next.js 14 (App Router)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API路由层                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  /api/eval  │  │  /api/auth  │  │     /api/admin/*        │  │
│  │  评测接口   │  │  认证接口   │  │     管理后台接口         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                        Next.js Edge Functions                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         服务层                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  lib/auth   │  │ lib/prisma  │  │    lib/rate-limit       │  │
│  │  JWT认证   │  │  ORM客户端  │  │      限流控制            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         数据层                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Postgres  │  │  Vercel KV  │  │    Vercel Blob          │  │
│  │  主数据库   │  │  缓存/限流  │  │    文件存储              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

| 层级 | 技术 | 版本 | 用途 |
|-----|------|------|------|
| **框架** | Next.js | 14.x | React全栈框架 |
| **运行时** | Node.js | 18+ | 服务端运行环境 |
| **样式** | Tailwind CSS | 3.x | 原子化CSS |
| **UI组件** | Radix UI | 最新 | 无样式组件库 |
| **图标** | Lucide React | 最新 | 图标库 |
| **数据库** | PostgreSQL | 15+ | 主数据库 |
| **ORM** | Prisma | 5.x | 数据库ORM |
| **缓存** | Vercel KV | - | Redis缓存 |
| **存储** | Vercel Blob | - | 文件存储 |
| **AI SDK** | OpenAI SDK | 4.x | AI模型调用 |
| **认证** | jose | 5.x | JWT处理 |
| **加密** | bcryptjs | 2.x | 密码哈希 |

---

## 3. 项目结构

```
ai-eval-system/
├── app/                          # Next.js App Router
│   ├── (main)/                   # 用户前台路由组
│   │   ├── page.tsx              # 评测主页面(Server Component)
│   │   ├── page.client.tsx       # 评测页面(Client Component)
│   │   └── settings/             # 个人设置
│   │       ├── page.tsx
│   │       └── page.client.tsx
│   │
│   ├── admin/                    # 管理后台路由组
│   │   ├── layout.tsx            # 管理后台布局(含侧边栏)
│   │   ├── page.tsx              # 仪表盘页面
│   │   ├── users/                # 用户管理
│   │   │   ├── page.tsx          # Server Component(获取数据)
│   │   │   └── page.client.tsx   # Client Component(交互逻辑)
│   │   ├── invites/              # 邀请码管理
│   │   ├── models/               # AI模型配置
│   │   ├── prompts/              # Prompt模板管理
│   │   ├── files/                # 知识库文件管理
│   │   ├── logs/                 # 日志审计
│   │   └── settings/             # 系统设置
│   │
│   ├── api/                      # API路由
│   │   ├── auth/                 # 认证相关API
│   │   │   ├── login/route.ts    # 登录
│   │   │   ├── register/route.ts # 注册
│   │   │   ├── logout/route.ts   # 登出
│   │   │   └── verify-invite/route.ts  # 邀请码验证
│   │   ├── eval/route.ts         # 评测API(核心)
│   │   ├── config/route.ts       # 系统配置API
│   │   └── admin/                # 管理后台API
│   │       ├── users/route.ts    # 用户管理API
│   │       ├── invites/route.ts  # 邀请码API
│   │       ├── models/route.ts   # 模型配置API
│   │       ├── prompts/route.ts  # Prompt模板API
│   │       ├── files/route.ts    # 文件管理API
│   │       └── config/route.ts   # 系统配置API
│   │
│   ├── login/page.tsx            # 登录页面
│   └── register/page.tsx         # 注册页面(邀请码验证)
│
├── lib/                          # 工具库
│   ├── prisma.ts                 # Prisma客户端初始化
│   ├── auth.ts                   # 认证相关(JWT/密码)
│   ├── rate-limit.ts             # 限流控制
│   └── utils.ts                  # 通用工具函数
│
├── prisma/
│   └── schema.prisma             # 数据库模型定义
│
├── public/                       # 静态资源
├── .env.example                  # 环境变量模板
├── next.config.mjs               # Next.js配置
├── tailwind.config.ts            # Tailwind配置
├── tsconfig.json                 # TypeScript配置
└── package.json                  # 依赖管理
```

### 3.1 关键文件说明

| 文件 | 职责 |
|------|------|
| `middleware.ts` | 全局中间件(路由权限、JWT验证) |
| `lib/auth.ts` | JWT生成/验证、密码哈希/验证 |
| `lib/prisma.ts` | Prisma客户端单例模式 |
| `lib/rate-limit.ts` | 基于Vercel KV的限流 |
| `app/api/eval/route.ts` | 核心评测API，流式输出 |
| `prisma/schema.prisma` | 数据库模型定义 |

---

## 4. 数据模型

### 4.1 ER图

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                │
│   ┌──────────┐       ┌──────────┐       ┌──────────┐          │
│   │   User   │◄──────┤ InviteCode│       │ EvalLog  │          │
│   ├──────────┤  1:1  ├──────────┤       ├──────────┤          │
│   │ id       │       │ id       │       │ id       │          │
│   │ email    │       │ code     │       │ userId   │          │
│   │ password │       │ status   │       │ type     │          │
│   │ remaining│       │ usedAt   │       │ input    │          │
│   │ isAdmin  │       └──────────┘       │ output   │          │
│   │ inviteId │                          │ tokens   │          │
│   └──────────┘                          └────┬─────┘          │
│        │                                     │                 │
│        │                                     │                 │
│        │    ┌──────────┐                     │                 │
│        └───►│ AuditLog │◄────────────────────┘                 │
│             ├──────────┤                                      │
│             │ id       │                                      │
│             │ userId   │       ┌──────────┐                   │
│             │ action   │       │ AIModel  │                   │
│             │ ip       │       ├──────────┤                   │
│             │ metadata │       │ id       │                   │
│             └──────────┘       │ name     │                   │
│                                │ provider │                   │
│   ┌──────────────────┐         │ apiKey   │                   │
│   │ PromptTemplate   │         │ modelName│                   │
│   ├──────────────────┤         │ isActive │                   │
│   │ id               │         └────┬─────┘                   │
│   │ name             │              │                         │
│   │ type             │              │                         │
│   │ systemPrompt     │              │                         │
│   │ attachedFiles    │              │                         │
│   │ modelId          │              │                         │
│   └──────────────────┘              │                         │
│                                     ▼                         │
│                          ┌──────────────────┐                │
│                          │  KnowledgeFile   │                │
│                          ├──────────────────┤                │
│                          │ id               │                │
│                          │ name             │                │
│                          │ blobUrl          │                │
│                          │ content          │                │
│                          └──────────────────┘                │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 完整数据模型定义

```prisma
// prisma/schema.prisma

// 用户表
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?   // 昵称(可选)
  passwordHash    String    // bcrypt加密
  avatar          String?   // 头像URL
  remainingEvals  Int       @default(99)  // 剩余评测次数
  isAdmin         Boolean   @default(false)
  
  // 关联
  inviteCode      InviteCode? @relation(name: "UserInviteCode", fields: [inviteCodeId], references: [id])
  inviteCodeId    String?     @unique
  evalLogs        EvalLog[]
  auditLogs       AuditLog[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// 邀请码表
model InviteCode {
  id              String      @id @default(cuid())
  code            String      @unique  // 12位随机码
  status          InviteStatus @default(UNUSED)
  
  user            User?       @relation(name: "UserInviteCode")
  
  createdAt       DateTime    @default(now())
  usedAt          DateTime?
}

enum InviteStatus {
  UNUSED
  USED
}

// 评测记录表
model EvalLog {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  
  type            EvalType  // SUGGESTION(建议) | POLICY(策略)
  input           String    @db.Text  // 输入文本(前50字+...)
  output          String?   @db.Text  // 完整输出
  tokensUsed      Int?      // Token消耗
  
  modelId         String?
  model           AIModel?  @relation(fields: [modelId], references: [id])
  
  createdAt       DateTime  @default(now())
}

enum EvalType {
  SUGGESTION
  POLICY
}

// AI模型配置表
model AIModel {
  id              String    @id @default(cuid())
  name            String    // 显示名称(如"GPT-4")
  provider        String    // openai/azure/deepseek/claude等
  baseUrl         String?   // 自定义Base URL
  apiKey          String    // API密钥(明文存储)
  modelName       String    // 实际模型名(如"gpt-4-turbo")
  isActive        Boolean   @default(true)
  
  evalLogs        EvalLog[]
  promptTemplates PromptTemplate[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// Prompt模板表
model PromptTemplate {
  id              String    @id @default(cuid())
  name            String    // 模板名称
  type            EvalType  // 关联的评测类型
  systemPrompt    String    @db.Text  // 系统提示词
  attachedFiles   String[]  // 关联文件ID数组
  
  modelId         String?
  model           AIModel?  @relation(fields: [modelId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// 知识库文件表
model KnowledgeFile {
  id              String    @id @default(cuid())
  name            String    // 文件名
  blobUrl         String    // Vercel Blob URL
  blobKey         String    @unique  // Blob唯一标识
  size            Int       // 文件大小(字节)
  type            String    // MIME类型
  content         String?   @db.Text  // 文本内容缓存(仅txt)
  
  createdAt       DateTime  @default(now())
}

// 审计日志表
model AuditLog {
  id              String    @id @default(cuid())
  userId          String?
  user            User?     @relation(fields: [userId], references: [id])
  
  action          String    // LOGIN/LOGOUT/EVAL/ADMIN_ADD_EVALS等
  ip              String?   // IP地址
  userAgent       String?   // 浏览器UA
  metadata        Json?     // 额外信息(JSON)
  
  createdAt       DateTime  @default(now())
}

// 系统配置表
model SystemConfig {
  id              String    @id @default(cuid())
  key             String    @unique  // 配置项key
  value           String    // 配置值
  
  updatedAt       DateTime  @updatedAt
}
```

### 4.3 数据库关系说明

| 关系 | 类型 | 说明 |
|------|------|------|
| User ↔ InviteCode | 1:1 | 用户通过邀请码注册，一对一关联 |
| User → EvalLog | 1:N | 用户有多条评测记录 |
| User → AuditLog | 1:N | 用户有多条审计日志 |
| AIModel → EvalLog | 1:N | 模型有多条使用记录 |
| AIModel → PromptTemplate | 1:N | 模型可用于多个Prompt模板 |

---

## 5. 核心模块详解

### 5.1 认证模块 (`lib/auth.ts`)

**职责**: JWT令牌生成/验证、密码哈希/验证

```typescript
// JWT Payload结构
interface JWTPayload {
  userId: string    // 用户ID
  email: string     // 用户邮箱
  isAdmin: boolean  // 是否管理员
}

// 核心函数
- hashPassword(password): Promise<string>           // bcrypt哈希
- verifyPassword(password, hash): Promise<boolean>  // 验证密码
- createJWT(payload): Promise<string>               // 生成JWT
- verifyJWT(token): Promise<JWTPayload | null>      // 验证JWT
- getSession(): Promise<JWTPayload | null>          // 从Cookie获取会话
- requireAuth(): Promise<JWTPayload>                // 要求登录，否则报错
- requireAdmin(): Promise<JWTPayload>               // 要求管理员权限
- setAuthCookie(token): void                        // 设置Cookie
- clearAuthCookie(): void                           // 清除Cookie
```

**工作流程**:
1. 登录时验证密码 → 生成JWT → 设置HttpOnly Cookie
2. 中间件读取Cookie → 验证JWT → 附加到请求
3. API路由调用 `requireAuth()` 获取当前用户
4. 管理员路由调用 `requireAdmin()` 验证权限

### 5.2 限流模块 (`lib/rate-limit.ts`)

**职责**: 防止API滥用，基于Vercel KV或内存回退

```typescript
// 限流配置
const RATE_LIMIT_WINDOW = 60      // 1分钟窗口
const MAX_REQUESTS = 5            // 每窗口最大请求数

// 核心函数
rateLimit(identifier, maxRequests?, windowSeconds?): Promise<{
  success: boolean    // 是否允许请求
  limit: number       // 限制次数
  remaining: number   // 剩余次数
  reset: number       // 重置时间戳
}>
```

**使用场景**:
- 登录接口：5次/分钟
- 注册接口：3次/5分钟
- 邀请码验证：10次/分钟

### 5.3 评测模块 (`app/api/eval/route.ts`)

**职责**: 核心评测逻辑，流式输出AI结果

**处理流程**:

```
1. 验证用户登录 (requireAuth)
2. 检查评测额度 (remainingEvals > 0)
3. 获取活跃模型配置
4. 获取Prompt模板 + 处理@文件引用
5. 调用OpenAI SDK创建流式对话
6. 流式返回SSE格式数据
7. 完成后扣除额度 + 记录日志
```

**SSE输出格式**:
```
data: {"content": "这是"}

data: {"content": "评测"}

data: {"content": "结果"}

data: [DONE]
```

**RAG文件引用处理**:
```typescript
// 在Prompt中支持 @文件名 引用知识库
let systemPrompt = promptTemplate.systemPrompt

// 查找所有 @文件名 引用
const fileRefs = systemPrompt.match(/@([\w.-]+\.\w+)/g) || []

// 替换为文件内容
for (const file of files) {
  const placeholder = `@${file.name}`
  if (systemPrompt.includes(placeholder) && file.content) {
    systemPrompt = systemPrompt.replace(placeholder, file.content)
  }
}
```

### 5.4 管理后台模块

**仪表盘** (`app/admin/page.tsx`):
- 统计总用户数、邀请码使用情况
- 显示AI模型数量、知识库文件数
- 展示今日评测次数、24小时日志数

**用户管理** (`app/admin/users/`):
- 查看用户列表(邮箱、昵称、剩余额度)
- 为用户充值额度(增加/减少)
- 设置/取消管理员权限

**邀请码管理** (`app/admin/invites/`):
- 批量生成随机邀请码(1-100个)
- 查看邀请码使用状态
- 导出未使用邀请码为CSV

**模型配置** (`app/admin/models/`):
- 支持多种服务商：OpenAI、Azure、DeepSeek、Claude、Moonshot、GLM、自定义
- 配置API Key、Base URL、模型名称
- 启用/禁用模型

**Prompt模板** (`app/admin/prompts/`):
- 创建/编辑系统提示词
- 支持关联知识库文件(@引用)
- 绑定特定AI模型

**知识库文件** (`app/admin/files/`):
- 上传.txt/.pdf文件
- 文本文件自动提取内容
- 在Prompt中使用@文件名引用

---

## 6. API接口文档

### 6.1 认证接口

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# 响应
{
  "user": {
    "id": "xxx",
    "email": "user@example.com",
    "name": "用户名",
    "isAdmin": false
  }
}
# 同时设置 HttpOnly Cookie: token=xxx
```

#### 注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名",
  "inviteCode": "ABC123XYZ789"
}

# 验证邀请码 → 创建用户 → 自动登录 → 设置Cookie
```

#### 验证邀请码
```http
POST /api/auth/verify-invite
Content-Type: application/json

{
  "code": "ABC123XYZ789"
}

# 响应
{ "valid": true }
# 或
{ "error": "邀请码不存在" }
```

#### 登出
```http
POST /api/auth/logout

# 清除Cookie，返回重定向
```

### 6.2 评测接口

#### 执行评测 (流式)
```http
POST /api/eval
Content-Type: application/json
Cookie: token=xxx

{
  "input": "需要评测的文本内容",
  "type": "SUGGESTION"  // 可选，默认为SUGGESTION
}

# 响应: text/event-stream

data: {"content": "评测"}

data: {"content": "结果"}

data: [DONE]
```

### 6.3 管理后台接口

#### 用户管理
```http
# 获取用户列表
GET /api/admin/users

# 充值额度
PATCH /api/admin/users
{
  "userId": "xxx",
  "action": "addEvals",
  "delta": 100  // 可为负数
}

# 切换管理员权限
PATCH /api/admin/users
{
  "userId": "xxx",
  "action": "toggleAdmin",
  "isAdmin": true
}
```

#### 邀请码管理
```http
# 获取邀请码列表
GET /api/admin/invites

# 生成邀请码
POST /api/admin/invites
{
  "count": 10  // 生成数量(1-100)
}
```

#### 模型配置
```http
# 获取模型列表
GET /api/admin/models

# 添加模型
POST /api/admin/models
{
  "name": "GPT-4 Turbo",
  "provider": "openai",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-xxx",
  "modelName": "gpt-4-turbo-preview"
}

# 启用/禁用模型
PATCH /api/admin/models
{
  "id": "xxx",
  "isActive": true
}

# 删除模型
DELETE /api/admin/models?id=xxx
```

#### Prompt模板
```http
# 获取模板列表
GET /api/admin/prompts

# 创建模板
POST /api/admin/prompts
{
  "name": "默认评测模板",
  "type": "SUGGESTION",
  "systemPrompt": "你是一个评测助手...\n\n参考资料:\n@知识库.txt"
}

# 更新模板(自动解析@文件引用)
PATCH /api/admin/prompts
{
  "id": "xxx",
  "name": "xxx",
  "type": "SUGGESTION",
  "systemPrompt": "...",
  "modelId": "xxx"  // 可选
}

# 删除模板
DELETE /api/admin/prompts?id=xxx
```

#### 知识库文件
```http
# 获取文件列表
GET /api/admin/files

# 上传文件 (multipart/form-data)
POST /api/admin/files
file: <File>  // .txt 或 .pdf

# 删除文件
DELETE /api/admin/files?id=xxx
```

#### 系统配置
```http
# 获取公开配置
GET /api/config

# 更新配置(管理员)
PATCH /api/admin/config
{
  "key": "siteTitle",
  "value": "自定义标题"
}
```

---

## 7. 配置说明

### 7.1 环境变量 (.env)

```bash
# ============================================
# 数据库配置 (必需)
# ============================================
# Prisma连接URL(带pgbouncer连接池)
POSTGRES_PRISMA_URL="postgres://user:password@host:5432/db?pgbouncer=true&connection_limit=10"

# 直连URL(用于数据库迁移)
POSTGRES_URL_NON_POOLING="postgres://user:password@host:5432/db"

# ============================================
# 存储配置 (必需)
# ============================================
# Vercel Blob Token (文件存储)
BLOB_READ_WRITE_TOKEN="vercel_blob_token_here"

# ============================================
# 认证配置 (必需)
# ============================================
# JWT签名密钥(随机字符串，至少32位)
NEXTAUTH_SECRET="your-secret-key-here-min-32-chars"

# 应用URL
NEXTAUTH_URL="http://localhost:3000"

# ============================================
# 管理员配置 (必需)
# ============================================
# 初始管理员密钥(首次部署使用)
ADMIN_SECRET="admin123"

# ============================================
# AI 配置 (可选，也可后台配置)
# ============================================
# 默认AI API Key
AI_API_KEY="sk-..."

# ============================================
# 缓存配置 (可选)
# ============================================
# Vercel KV (用于限流)
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."

# ============================================
# 前端展示配置 (可选)
# ============================================
# 联系方式(显示在次数用尽弹窗)
NEXT_PUBLIC_CONTACT="WeChat: xxx"

# 联系二维码URL
NEXT_PUBLIC_CONTACT_QR="https://..."
```

### 7.2 环境变量说明

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `POSTGRES_PRISMA_URL` | ✅ | PostgreSQL连接URL，需要`pgbouncer=true` |
| `POSTGRES_URL_NON_POOLING` | ✅ | 无连接池的直连URL，用于Prisma迁移 |
| `BLOB_READ_WRITE_TOKEN` | ✅ | Vercel Blob文件存储Token |
| `NEXTAUTH_SECRET` | ✅ | JWT签名密钥，生产环境必须随机生成 |
| `ADMIN_SECRET` | ✅ | 初始管理员密钥 |
| `KV_REST_API_URL` | ❌ | Vercel KV URL，未配置则使用内存限流 |
| `KV_REST_API_TOKEN` | ❌ | Vercel KV Token |

---

## 8. 部署指南

### 8.1 Vercel一键部署

1. **Fork/准备代码仓库**
   ```bash
   git clone https://github.com/your-org/ai-eval-system.git
   cd ai-eval-system
   git push your-repo-url
   ```

2. **Vercel创建项目**
   - 访问 https://vercel.com/new
   - 导入GitHub仓库
   - 选择框架预设: Next.js

3. **配置环境变量**
   在Vercel项目设置中添加上述所有必需的环境变量

4. **配置数据库**
   - 在Vercel Dashboard添加Postgres集成
   - 或使用外部PostgreSQL服务
   - 获取数据库URL填入环境变量

5. **配置Blob存储**
   - 在Vercel项目设置中启用Blob
   - 获取Token填入环境变量

6. **执行数据库迁移**
   ```bash
   # 本地执行
   npx prisma migrate deploy
   
   # 或在Vercel CLI
   vercel --prod
   ```

7. **创建初始管理员**
   - 访问 `/register`
   - 使用任意邀请码注册第一个账户
   - 在数据库中执行:
     ```sql
     UPDATE "User" SET "isAdmin" = true WHERE email = 'your@email.com';
     ```

### 8.2 本地开发部署

```bash
# 1. 克隆代码
git clone https://github.com/your-org/ai-eval-system.git
cd ai-eval-system

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入配置

# 4. 数据库迁移
npx prisma migrate dev --name init
npx prisma generate

# 5. 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 8.3 数据库迁移

```bash
# 开发环境
npx prisma migrate dev --name your_migration_name

# 生产环境
npx prisma migrate deploy

# 查看数据库(Prisma Studio)
npx prisma studio
```

---

## 9. 开发维护

### 9.1 开发命令

```bash
# 开发服务器
npm run dev

# 构建
npm run build

# 代码检查
npm run lint

# 数据库生成
npm run db:generate

# 数据库迁移
npm run db:migrate

# 数据库部署(生产)
npm run db:deploy

# Prisma Studio(数据库GUI)
npm run db:studio
```

### 9.2 添加新页面

**添加管理后台页面示例**:

1. 创建目录和文件
   ```
   app/admin/new-feature/
   ├── page.tsx           # Server Component
   └── page.client.tsx    # Client Component
   ```

2. Server Component (`page.tsx`)
   ```typescript
   import { requireAdmin } from '@/lib/auth'
   import { prisma } from '@/lib/prisma'
   import NewFeatureClient from './page.client'
   
   export default async function NewFeaturePage() {
     await requireAdmin()
     
     const data = await prisma.someModel.findMany()
     
     return <NewFeatureClient data={data} />
   }
   ```

3. Client Component (`page.client.tsx`)
   ```typescript
   'use client'
   
   export default function NewFeatureClient({ data }) {
     // 交互逻辑
     return <div>...</div>
   }
   ```

4. 添加到侧边栏 (`app/admin/layout.tsx`)
   ```typescript
   const navItems = [
     // ...其他菜单
     { href: '/admin/new-feature', label: '新功能', icon: SomeIcon },
   ]
   ```

### 9.3 添加API接口

**示例：添加新API路由**

```typescript
// app/api/admin/new-feature/route.ts

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await requireAdmin()
    const data = await prisma.someModel.findMany()
    return Response.json({ data })
  } catch (error) {
    // 统一错误处理
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    return Response.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    // 处理逻辑
    return Response.json({ success: true })
  } catch (error) {
    // 错误处理
  }
}
```

### 9.4 修改数据模型

1. 编辑 `prisma/schema.prisma`
2. 创建迁移
   ```bash
   npx prisma migrate dev --name add_new_field
   ```
3. 重新生成Prisma Client
   ```bash
   npx prisma generate
   ```

---

## 10. 故障排查

### 10.1 常见问题

#### 问题1: 数据库连接失败

**症状**: 页面报错 "Database connection failed"

**排查**:
```bash
# 1. 检查环境变量
echo $POSTGRES_PRISMA_URL

# 2. 测试数据库连接
npx prisma db pull

# 3. 检查Vercel Postgres状态
# 访问 Vercel Dashboard -> Storage
```

**解决**:
- 确认 `POSTGRES_PRISMA_URL` 包含 `pgbouncer=true`
- 确认 `POSTGRES_URL_NON_POOLING` 不带连接池参数
- 检查数据库白名单是否允许Vercel IP

#### 问题2: 评测接口返回500

**症状**: 点击"开始评测"无响应或报错

**排查**:
```bash
# 1. 检查是否有配置AI模型
# 访问 /admin/models 确认有启用的模型

# 2. 查看Vercel函数日志
# Vercel Dashboard -> Functions -> 查看错误

# 3. 检查API Key是否有效
# 在后台重新配置API Key
```

**解决**:
- 在管理后台添加至少一个AI模型配置
- 确认API Key有效且有额度
- 检查模型Base URL是否正确

#### 问题3: 文件上传失败

**症状**: 上传知识库文件报错

**排查**:
```bash
# 1. 检查BLOB_READ_WRITE_TOKEN
echo $BLOB_READ_WRITE_TOKEN

# 2. 检查文件大小(限制10MB)
ls -lh your-file.txt

# 3. 检查文件类型(仅支持txt/pdf)
file your-file.txt
```

**解决**:
- 重新配置Vercel Blob Token
- 压缩PDF文件至10MB以下
- 确保文件扩展名正确

#### 问题4: 邀请码注册失败

**症状**: 提示"邀请码无效或已被使用"

**排查**:
```bash
# 1. 检查邀请码状态
# 访问 /admin/invites 查看邀请码

# 2. 数据库查询
SELECT * FROM "InviteCode" WHERE code = 'YOUR_CODE';

# 3. 检查大小写(系统自动转大写)
```

**解决**:
- 在管理后台生成新的邀请码
- 确认邀请码未被使用(status = UNUSED)

#### 问题5: 前端显示缓存旧数据

**症状**: 修改配置后前端仍显示旧内容

**解决**:
```bash
# 1. 清除Next.js缓存
rm -rf .next

# 2. 重新构建
npm run build

# 3. Vercel部署时清除CDN缓存
# Dashboard -> Project -> Purge Cache
```

### 10.2 性能优化

#### 数据库查询优化

```typescript
// 使用select减少返回字段
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true, remainingEvals: true },
})

// 使用include优化关联查询
const users = await prisma.user.findMany({
  include: {
    inviteCode: { select: { code: true } },
    _count: { select: { evalLogs: true } },
  },
})
```

#### 添加数据库索引

```prisma
// 在频繁查询的字段添加索引
model EvalLog {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())
  
  @@index([userId])      // 用户查询索引
  @@index([createdAt])   // 时间查询索引
}
```

---

## 11. 附录

### 11.1 支持的AI服务商

| 服务商 | provider值 | 默认Base URL |
|--------|-----------|--------------|
| OpenAI | `openai` | https://api.openai.com/v1 |
| Azure OpenAI | `azure` | - |
| DeepSeek | `deepseek` | https://api.deepseek.com/v1 |
| Claude | `claude` | https://api.anthropic.com/v1 |
| Moonshot | `moonshot` | https://api.moonshot.cn/v1 |
| GLM(智谱) | `glm` | https://open.bigmodel.cn/api/paas/v4 |
| 自定义 | `custom` | 用户填写 |

### 11.2 API错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录 |
| 403 | 无权限(非管理员) |
| 404 | 资源不存在 |
| 429 | 请求过于频繁(限流) |
| 500 | 服务器内部错误 |

### 11.3 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0.0 | 2026-02-22 | 初始版本 |

### 11.4 相关链接

- [Next.js文档](https://nextjs.org/docs)
- [Prisma文档](https://www.prisma.io/docs)
- [Tailwind CSS文档](https://tailwindcss.com/docs)
- [Vercel文档](https://vercel.com/docs)

---

**文档结束**

> 如有疑问，请查阅相关技术文档或联系开发团队。
