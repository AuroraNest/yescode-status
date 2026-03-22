# YesCode Swagger 接口文档汇总

更新时间：2026-03-22

## 1. 说明

本文档基于以下来源整理：

- 在线 Swagger 页面：`https://co.yes.vg/docs?tab=api`
- 在线说明页：`https://co.yes.vg/docs?slug=how-to-create-seprate-keys`
- 当前项目代码：
  - `src/services/apiService.ts`
  - `src/services/teamApiService.ts`
  - `src/types/user.ts`
  - `src/types/team.ts`
- 仓库内历史文档：
  - `API文档/auth_profile_doc.md`
  - `API文档/user_balance_doc.md`
  - `API文档/user_balance_preference_doc.md`
  - `yes_code_团队额度相关接口说明.md`

重要说明：

- 本文档优先以 Swagger 页面实测结果为准。
- 某些接口在 Swagger 页里只展示了占位对象，例如 `{"additionalProp1": {}}`，这不代表真实返回结构，仅表示“官方文档未给出字段模型”。
- 当前项目真实使用但 Swagger 页面未列出的接口，我单独放在文档最后说明。

## 2. 全局约定

### 2.1 Base URL

```text
https://co.yes.vg/api/v1
```

### 2.2 当前客户端使用的请求头

```http
accept: application/json
Authorization: Bearer <token>
X-API-Key: <token>
Content-Type: application/json
User-Agent: yescode-status/2.0
```

说明：

- `GET` 请求通常不一定强依赖 `Content-Type`，但当前项目统一带了。
- 当前项目个人接口通常使用 `cr_...` token。
- 当前项目团队接口在客户端侧按前缀决定是否调用：`team_...`。

### 2.3 Swagger 页当前可见接口标签

- Authentication
- User
- Team Stats
- User Teams
- Team Owner

### 2.4 Swagger 页当前未列出的项目实际接口

以下两个接口被当前项目真实调用，但在 `tab=api` 的 Swagger 规范中搜索 `balance` 时返回 `No operations defined in spec!`：

- `GET /user/balance`
- `PUT /user/balance-preference`

它们的说明见本文档末尾“项目实际使用但 Swagger 未列出接口”。

## 3. Swagger 接口总览

| 标签 | 方法 | 路径 | 简介 |
|---|---|---|---|
| Authentication | `POST` | `/auth/logout` | User logout |
| User | `GET` | `/auth/profile` | Get user profile |
| User | `PUT` | `/user/accent-color` | Update accent color preference |
| User | `POST` | `/user/change-email` | Request email change |
| User | `POST` | `/user/change-password` | Change password |
| User | `POST` | `/user/regenerate-api-key` | Regenerate API key |
| User | `PUT` | `/user/theme-preference` | Update theme preference |
| Team Stats | `GET` | `/team/stats/spending` | Get team spending |
| Team Stats | `GET` | `/team/stats/usage` | Get team usage |
| User Teams | `GET` | `/user/team` | Get user's team information |
| User Teams | `POST` | `/user/team/purchase-ownership` | Purchase team ownership |
| User Teams | `GET` | `/user/team/usage` | Get team usage statistics |
| Team Owner | `GET` | `/user/team/owner/dashboard` | Get team owner dashboard |
| Team Owner | `GET` | `/user/team/owner/invitations` | Get team invitations (owner) |
| Team Owner | `POST` | `/user/team/owner/invitations` | Create team invitation (owner) |
| Team Owner | `DELETE` | `/user/team/owner/invitations/{invitation_id}` | Revoke team invitation (owner) |
| Team Owner | `GET` | `/user/team/owner/members` | Get team members (owner) |
| Team Owner | `DELETE` | `/user/team/owner/members/{member_id}` | Remove team member (owner) |
| Team Owner | `PUT` | `/user/team/owner/members/{member_id}` | Update team member quotas (owner) |

## 4. 逐接口说明

## 4.1 User logout

### 1. 基本信息
- 标签：Authentication
- 方法：`POST`
- 路径：`/auth/logout`
- 状态：中等确认
- 适用角色：已登录用户
- 当前项目是否使用：否

### 2. 接口说明
- 用途：退出当前登录会话。
- 典型场景：网页端用户主动登出。
- 注意事项：Swagger 页当前未展开出参数和响应详情。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：大概率需要
- 必需请求头：待实测

### 4. 请求参数
#### 4.1 Path 参数
无

#### 4.2 Query 参数
无

#### 4.3 Body 参数
Swagger 未展示

### 5. 请求示例
```bash
curl -X POST "https://co.yes.vg/api/v1/auth/logout" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>"
```

### 6. 成功响应
- Swagger 页当前未展示

### 7. 错误响应
- Swagger 页当前未展示

### 8. 补充说明
- Swagger 是否给出真实模型：否
- 当前是否需要实测：是

## 4.2 Get user profile

### 1. 基本信息
- 标签：User
- 方法：`GET`
- 路径：`/auth/profile`
- 状态：已确认
- 适用角色：已登录用户
- 当前项目是否使用：是
- 代码位置：`src/services/apiService.ts`

### 2. 接口说明
- 用途：获取当前认证用户的完整资料。
- 典型场景：展示用户名、邮箱、套餐、余额偏好、订阅信息。
- 注意事项：Swagger 示例字段很多，但当前项目只用其中一部分。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：是
- 必需请求头：`Authorization`、`X-API-Key`

### 4. 请求参数
#### 4.1 Path 参数
无

#### 4.2 Query 参数
无

#### 4.3 Body 参数
无

### 5. 请求示例
```bash
curl -X GET "https://co.yes.vg/api/v1/auth/profile" \
  -H "accept: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>"
```

### 6. 成功响应
- 状态码：`200`
- 说明：返回用户资料

Swagger 示例包含的核心字段：

```json
{
  "id": 0,
  "username": "string",
  "email": "string",
  "api_key": "string",
  "balance": 0,
  "pay_as_you_go_balance": 0,
  "subscription_balance": 0,
  "balance_preference": "string",
  "current_week_spend": 0,
  "current_month_spend": 0,
  "subscription_expiry": "string",
  "subscription_plan_id": 0,
  "subscription_plan": {
    "id": 0,
    "name": "string",
    "plan_type": "string",
    "price": 0,
    "daily_balance": 0,
    "weekly_limit": 0
  },
  "current_team": {},
  "current_team_id": 0,
  "default_chat_model": "string",
  "oauth": {},
  "pending_team_plan": {},
  "theme_preference": "string",
  "tickets_enabled": true,
  "updated_at": "string"
}
```

### 7. 响应字段

当前项目重点字段：

| 字段 | 类型 | 说明 | 来源 |
|---|---|---|---|
| `id` | `number` | 用户 ID | Swagger 明确 |
| `username` | `string` | 用户名 | Swagger 明确 |
| `email` | `string` | 邮箱 | Swagger 明确 |
| `balance_preference` | `string` | 扣费偏好 | Swagger 明确 |
| `balance` | `number` | 总余额 | Swagger 明确 |
| `pay_as_you_go_balance` | `number` | 按量余额 | Swagger 明确 |
| `subscription_balance` | `number` | 订阅余额 | Swagger 明确 |
| `subscription_expiry` | `string` | 订阅到期时间 | Swagger 明确 |
| `current_week_spend` | `number` | 本周花费 | Swagger 明确 |
| `current_month_spend` | `number` | 本月花费 | Swagger 明确 |
| `subscription_plan_id` | `number` | 套餐 ID | Swagger 明确 |
| `subscription_plan` | `object` | 套餐详情 | Swagger 明确 |
| `current_team` | `object` | 当前团队对象 | Swagger 明确 |
| `default_chat_model` | `string` | 默认对话模型 | Swagger 明确 |
| `oauth` | `object` | OAuth 绑定信息 | Swagger 明确 |
| `pending_team_plan` | `object` | 待生效团队套餐 | Swagger 明确 |
| `theme_preference` | `string` | 主题偏好 | Swagger 明确 |
| `tickets_enabled` | `boolean` | 是否启用工单 | Swagger 明确 |

### 8. 错误响应

| 状态码 | 含义 | 返回示例 |
|---|---|---|
| `401` | 未授权 | `{"error":{"code":"invalid_argument","message":"Invalid request parameters"},"request_id":"req_xxx","type":"error"}` |

### 9. 补充说明
- Swagger 是否给出真实模型：是，字段较多
- 当前是否需要实测：可选
- 与当前项目关系：个人主页关键依赖接口

## 4.3 Update accent color preference

### 1. 基本信息
- 标签：User
- 方法：`PUT`
- 路径：`/user/accent-color`
- 状态：待补充
- 适用角色：已登录用户
- 当前项目是否使用：否

### 2. 接口说明
- 用途：更新用户强调色偏好。
- 典型场景：站内主题或品牌色切换。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：大概率需要
- 必需请求头：待实测

### 4. 请求参数
Swagger 页当前未展示。

### 5. 请求示例
```bash
curl -X PUT "https://co.yes.vg/api/v1/user/accent-color" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>" \
  -H "Content-Type: application/json"
```

### 6. 成功响应
- Swagger 页当前未展示

### 7. 错误响应
- Swagger 页当前未展示

### 8. 补充说明
- Swagger 是否给出真实模型：否
- 当前是否需要实测：是

## 4.4 Request email change

### 1. 基本信息
- 标签：User
- 方法：`POST`
- 路径：`/user/change-email`
- 状态：待补充
- 适用角色：已登录用户
- 当前项目是否使用：否

### 2. 接口说明
- 用途：提交邮箱变更请求。
- 典型场景：修改账户绑定邮箱。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：大概率需要
- 必需请求头：待实测

### 4. 请求参数
Swagger 页当前未展示。

### 5. 请求示例
```bash
curl -X POST "https://co.yes.vg/api/v1/user/change-email" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>" \
  -H "Content-Type: application/json"
```

### 6. 成功响应
- Swagger 页当前未展示

### 7. 错误响应
- Swagger 页当前未展示

### 8. 补充说明
- Swagger 是否给出真实模型：否
- 当前是否需要实测：是

## 4.5 Change password

### 1. 基本信息
- 标签：User
- 方法：`POST`
- 路径：`/user/change-password`
- 状态：待补充
- 适用角色：已登录用户
- 当前项目是否使用：否

### 2. 接口说明
- 用途：修改用户密码。
- 典型场景：账户安全设置。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：大概率需要
- 必需请求头：待实测

### 4. 请求参数
Swagger 页当前未展示。

### 5. 请求示例
```bash
curl -X POST "https://co.yes.vg/api/v1/user/change-password" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>" \
  -H "Content-Type: application/json"
```

### 6. 成功响应
- Swagger 页当前未展示

### 7. 错误响应
- Swagger 页当前未展示

### 8. 补充说明
- Swagger 是否给出真实模型：否
- 当前是否需要实测：是

## 4.6 Regenerate API key

### 1. 基本信息
- 标签：User
- 方法：`POST`
- 路径：`/user/regenerate-api-key`
- 状态：已确认
- 适用角色：已登录用户
- 当前项目是否使用：否

### 2. 接口说明
- 用途：为当前认证用户生成新的 API Key。
- 典型场景：旧 Key 泄漏、失效或希望强制轮换密钥。
- 注意事项：Swagger 示例没有直接给出新 key 字段，因此不能仅凭文档断定“响应里一定直接返回新 key 明文”。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：是
- 必需请求头：`Authorization`、`X-API-Key`

### 4. 请求参数
#### 4.1 Path 参数
无

#### 4.2 Query 参数
无

#### 4.3 Body 参数
无

### 5. 请求示例
```bash
curl -X POST "https://co.yes.vg/api/v1/user/regenerate-api-key" \
  -H "accept: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>"
```

### 6. 成功响应
- 状态码：`200`
- 说明：新 API key 已生成

```json
{
  "message": "Operation completed successfully"
}
```

### 7. 响应字段

| 字段 | 类型 | 说明 | 来源 |
|---|---|---|---|
| `message` | `string` | 操作成功提示 | Swagger 明确 |

### 8. 错误响应

| 状态码 | 含义 | 返回示例 |
|---|---|---|
| `401` | 未授权 | `{"error":{"code":"invalid_argument","message":"Invalid request parameters"},"request_id":"req_xxx","type":"error"}` |

### 9. 补充说明
- Swagger 是否给出真实模型：部分给出
- 当前是否需要实测：是
- 与在线说明页关系：和 `how-to-create-seprate-keys` 页主题直接相关

## 4.7 Update theme preference

### 1. 基本信息
- 标签：User
- 方法：`PUT`
- 路径：`/user/theme-preference`
- 状态：待补充
- 适用角色：已登录用户
- 当前项目是否使用：否

### 2. 接口说明
- 用途：更新网页端主题偏好。
- 典型场景：站内亮色/暗色切换。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：大概率需要
- 必需请求头：待实测

### 4. 请求参数
Swagger 页当前未展示。

### 5. 请求示例
```bash
curl -X PUT "https://co.yes.vg/api/v1/user/theme-preference" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>" \
  -H "Content-Type: application/json"
```

### 6. 成功响应
- Swagger 页当前未展示

### 7. 错误响应
- Swagger 页当前未展示

### 8. 补充说明
- Swagger 是否给出真实模型：否
- 当前是否需要实测：是

## 4.8 Get team spending

### 1. 基本信息
- 标签：Team Stats
- 方法：`GET`
- 路径：`/team/stats/spending`
- 状态：已确认
- 适用角色：已认证团队成员
- 当前项目是否使用：否

### 2. 接口说明
- 用途：获取当前团队成员的花费限制与已使用情况。
- 典型场景：团队消费概览、限制提醒。
- 注意事项：Swagger 只给了占位对象，没有给真实字段模型。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：是
- 必需请求头：`Authorization`、`X-API-Key`

### 4. 请求参数
#### 4.1 Path 参数
无

#### 4.2 Query 参数
无

#### 4.3 Body 参数
无

### 5. 请求示例
```bash
curl -X GET "https://co.yes.vg/api/v1/team/stats/spending" \
  -H "accept: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>"
```

### 6. 成功响应
- 状态码：`200`
- 说明：Spending information

Swagger 示例：

```json
{
  "additionalProp1": {}
}
```

### 7. 响应字段
- Swagger 未给出真实字段表。

### 8. 错误响应

| 状态码 | 含义 | 返回示例 |
|---|---|---|
| `401` | 未授权 | `{"additionalProp1":"string","additionalProp2":"string","additionalProp3":"string"}` |
| `403` | 无权限 | `{"additionalProp1":"string","additionalProp2":"string","additionalProp3":"string"}` |

### 9. 补充说明
- Swagger 是否给出真实模型：否，仅占位示例
- 当前是否需要实测：是

## 4.9 Get team usage

### 1. 基本信息
- 标签：Team Stats
- 方法：`GET`
- 路径：`/team/stats/usage`
- 状态：已确认
- 适用角色：已认证团队成员
- 当前项目是否使用：否

### 2. 接口说明
- 用途：获取团队使用记录和模型汇总。
- 典型场景：团队明细页、分页浏览用量记录。
- 注意事项：这个接口偏“明细/记录”；当前项目团队页展示用量进度时使用的是 `/user/team/usage`。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：是
- 必需请求头：`Authorization`、`X-API-Key`

### 4. 请求参数
#### 4.1 Path 参数
无

#### 4.2 Query 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---:|---|
| `period` | `string` | 否 | 无 | 过滤周期，可选：`today`、`week`、`month` |
| `limit` | `integer` | 否 | `100` | 每页条数 |
| `offset` | `integer` | 否 | `0` | 分页偏移量 |

#### 4.3 Body 参数
无

### 5. 请求示例
```bash
curl -X GET "https://co.yes.vg/api/v1/team/stats/usage?period=week&limit=100&offset=0" \
  -H "accept: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>"
```

### 6. 成功响应
- 状态码：`200`
- 说明：Usage data

Swagger 示例：

```json
{
  "additionalProp1": {}
}
```

### 7. 响应字段
- Swagger 未给出真实字段表。

### 8. 错误响应

| 状态码 | 含义 | 返回示例 |
|---|---|---|
| `401` | 未授权 | `{"additionalProp1":"string","additionalProp2":"string","additionalProp3":"string"}` |
| `403` | 无权限 | `{"additionalProp1":"string","additionalProp2":"string","additionalProp3":"string"}` |

### 9. 补充说明
- Swagger 是否给出真实模型：否，仅占位示例
- 当前是否需要实测：是

## 4.10 Get user's team information

### 1. 基本信息
- 标签：User Teams
- 方法：`GET`
- 路径：`/user/team`
- 状态：已确认
- 适用角色：已认证团队成员
- 当前项目是否使用：是
- 代码位置：`src/services/teamApiService.ts`

### 2. 接口说明
- 用途：获取当前用户所属团队信息。
- 典型场景：判断用户是否有团队、展示团队名称、角色、套餐和配额。
- 注意事项：Swagger 示例只给占位对象；当前项目的字段结构来自代码类型定义。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：是
- 必需请求头：`Authorization`、`X-API-Key`

### 4. 请求参数
#### 4.1 Path 参数
无

#### 4.2 Query 参数
无

#### 4.3 Body 参数
无

### 5. 请求示例
```bash
curl -X GET "https://co.yes.vg/api/v1/user/team" \
  -H "accept: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>"
```

### 6. 成功响应
- 状态码：`200`
- 说明：Team information

Swagger 示例：

```json
{
  "additionalProp1": {}
}
```

当前项目推断的主要字段：

```json
{
  "team_id": "team_xxx",
  "name": "My Team",
  "role": "member",
  "plan": {
    "id": 1,
    "name": "Team Pro",
    "type": "team_pro"
  },
  "member_quota": 100,
  "team_quota": 1000
}
```

### 7. 响应字段

| 字段 | 类型 | 说明 | 来源 |
|---|---|---|---|
| `team_id` | `string` | 团队 ID | 项目代码推断 |
| `name` | `string` | 团队名 | 项目代码推断 |
| `role` | `string` | 当前用户角色：`owner`、`admin`、`member` | 项目代码推断 |
| `plan` | `object` | 团队套餐 | 项目代码推断 |
| `member_quota` | `number` | 当前用户个人配额 | 项目代码推断 |
| `team_quota` | `number` | 团队总配额 | 项目代码推断 |

### 8. 错误响应

| 状态码 | 含义 | 返回示例 |
|---|---|---|
| `401` | 未授权 | `{"additionalProp1":"string","additionalProp2":"string","additionalProp3":"string"}` |
| `500` | 服务端错误 | `{"additionalProp1":"string","additionalProp2":"string","additionalProp3":"string"}` |

### 9. 补充说明
- Swagger 是否给出真实模型：否，仅占位示例
- 当前是否需要实测：建议
- 与当前项目关系：团队页入口接口

## 4.11 Purchase team ownership

### 1. 基本信息
- 标签：User Teams
- 方法：`POST`
- 路径：`/user/team/purchase-ownership`
- 状态：待补充
- 适用角色：已登录用户
- 当前项目是否使用：否

### 2. 接口说明
- 用途：购买团队所有权。
- 典型场景：把个人团队升级到 owner 管理态。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：大概率需要
- 必需请求头：待实测

### 4. 请求参数
Swagger 页当前未展示。

### 5. 请求示例
```bash
curl -X POST "https://co.yes.vg/api/v1/user/team/purchase-ownership" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>" \
  -H "Content-Type: application/json"
```

### 6. 成功响应
- Swagger 页当前未展示

### 7. 错误响应
- Swagger 页当前未展示

### 8. 补充说明
- Swagger 是否给出真实模型：否
- 当前是否需要实测：是

## 4.12 Get team usage statistics

### 1. 基本信息
- 标签：User Teams
- 方法：`GET`
- 路径：`/user/team/usage`
- 状态：已确认
- 适用角色：团队成员
- 当前项目是否使用：是
- 代码位置：`src/services/teamApiService.ts`

### 2. 接口说明
- 用途：获取团队统计用量。
- 典型场景：团队页展示当前成员额度、团队总额度和进度条。
- 注意事项：这个接口是当前项目团队页的主要数据源；与 `/team/stats/usage` 不同，它更偏汇总视图。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：是
- 必需请求头：`Authorization`、`X-API-Key`

### 4. 请求参数
#### 4.1 Path 参数
无

#### 4.2 Query 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---:|---|
| `period` | `string` | 否 | 无 | 聚合窗口，可选：`5hours`、`1day`、`1week`、`1month` |

#### 4.3 Body 参数
无

### 5. 请求示例
```bash
curl -X GET "https://co.yes.vg/api/v1/user/team/usage?period=1week" \
  -H "accept: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>"
```

### 6. 成功响应
- 状态码：`200`
- 说明：Team usage statistics

Swagger 示例：

```json
{
  "additionalProp1": {}
}
```

当前项目推断的主要字段：

```json
{
  "member_used": 20,
  "member_remaining": 80,
  "member_quota": 100,
  "team_total_used": 300,
  "team_total_remaining": 700,
  "team_total_quota": 1000,
  "period_start": "2026-03-01T00:00:00+08:00",
  "period_end": "2026-03-31T23:59:59+08:00"
}
```

### 7. 响应字段

| 字段 | 类型 | 说明 | 来源 |
|---|---|---|---|
| `member_used` | `number` | 当前成员已使用额度 | 项目代码推断 |
| `member_remaining` | `number` | 当前成员剩余额度 | 项目代码推断 |
| `member_quota` | `number` | 当前成员总配额 | 项目代码推断 |
| `team_total_used` | `number` | 团队总已使用额度 | 项目代码推断 |
| `team_total_remaining` | `number` | 团队总剩余额度 | 项目代码推断 |
| `team_total_quota` | `number` | 团队总配额 | 项目代码推断 |
| `period_start` | `string` | 统计周期开始时间 | 项目代码推断 |
| `period_end` | `string` | 统计周期结束时间 | 项目代码推断 |

### 8. 错误响应

| 状态码 | 含义 | 返回示例 |
|---|---|---|
| `400` | 非团队成员 | `{"additionalProp1":"string","additionalProp2":"string","additionalProp3":"string"}` |
| `401` | 未授权 | `{"additionalProp1":"string","additionalProp2":"string","additionalProp3":"string"}` |

### 9. 补充说明
- Swagger 是否给出真实模型：否，仅占位示例
- 当前是否需要实测：建议
- 与当前项目关系：团队页核心接口

## 4.13 Get team owner dashboard

### 1. 基本信息
- 标签：Team Owner
- 方法：`GET`
- 路径：`/user/team/owner/dashboard`
- 状态：已确认
- 适用角色：团队 Owner
- 当前项目是否使用：否

### 2. 接口说明
- 用途：获取团队 Owner 总览，包括成员与配额信息。
- 典型场景：Owner 管理控制台首页。
- 注意事项：Swagger 只给占位响应，但描述已经明确“包含成员和配额总览”。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：是
- 必需请求头：`Authorization`、`X-API-Key`

### 4. 请求参数
#### 4.1 Path 参数
无

#### 4.2 Query 参数
无

#### 4.3 Body 参数
无

### 5. 请求示例
```bash
curl -X GET "https://co.yes.vg/api/v1/user/team/owner/dashboard" \
  -H "accept: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>"
```

### 6. 成功响应
- 状态码：`200`
- 说明：Owner dashboard data

Swagger 示例：

```json
{
  "additionalProp1": {}
}
```

### 7. 响应字段
- Swagger 未给出真实字段表。

### 8. 错误响应

| 状态码 | 含义 | 返回示例 |
|---|---|---|
| `403` | 非 owner 无权限 | `{"additionalProp1":"string","additionalProp2":"string","additionalProp3":"string"}` |
| `404` | 未找到 | `{"additionalProp1":"string","additionalProp2":"string","additionalProp3":"string"}` |

### 9. 补充说明
- Swagger 是否给出真实模型：否，仅占位示例
- 当前是否需要实测：是

## 4.14 Get team invitations (owner)

### 1. 基本信息
- 标签：Team Owner
- 方法：`GET`
- 路径：`/user/team/owner/invitations`
- 状态：待补充
- 适用角色：团队 Owner
- 当前项目是否使用：否

### 2. 接口说明
- 用途：获取团队邀请列表。
- 典型场景：Owner 查看已发出的邀请。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：大概率需要
- 必需请求头：待实测

### 4. 请求参数
Swagger 页当前未展示。

### 5. 请求示例
```bash
curl -X GET "https://co.yes.vg/api/v1/user/team/owner/invitations" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>"
```

### 6. 成功响应
- Swagger 页当前未展示

### 7. 错误响应
- Swagger 页当前未展示

### 8. 补充说明
- Swagger 是否给出真实模型：否
- 当前是否需要实测：是

## 4.15 Create team invitation (owner)

### 1. 基本信息
- 标签：Team Owner
- 方法：`POST`
- 路径：`/user/team/owner/invitations`
- 状态：待补充
- 适用角色：团队 Owner
- 当前项目是否使用：否

### 2. 接口说明
- 用途：创建团队邀请。
- 典型场景：Owner 邀请新成员加入团队。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：大概率需要
- 必需请求头：待实测

### 4. 请求参数
Swagger 页当前未展示。

### 5. 请求示例
```bash
curl -X POST "https://co.yes.vg/api/v1/user/team/owner/invitations" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>" \
  -H "Content-Type: application/json"
```

### 6. 成功响应
- Swagger 页当前未展示

### 7. 错误响应
- Swagger 页当前未展示

### 8. 补充说明
- Swagger 是否给出真实模型：否
- 当前是否需要实测：是

## 4.16 Revoke team invitation (owner)

### 1. 基本信息
- 标签：Team Owner
- 方法：`DELETE`
- 路径：`/user/team/owner/invitations/{invitation_id}`
- 状态：待补充
- 适用角色：团队 Owner
- 当前项目是否使用：否

### 2. 接口说明
- 用途：撤销已发出的团队邀请。
- 典型场景：邀请发错、邀请过期前主动撤回。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：大概率需要
- 必需请求头：待实测

### 4. 请求参数
#### 4.1 Path 参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `invitation_id` | `string` | 是 | 邀请 ID，Swagger 页只在路径中出现，未展开说明 |

#### 4.2 Query 参数
无

#### 4.3 Body 参数
无

### 5. 请求示例
```bash
curl -X DELETE "https://co.yes.vg/api/v1/user/team/owner/invitations/<invitation_id>" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>"
```

### 6. 成功响应
- Swagger 页当前未展示

### 7. 错误响应
- Swagger 页当前未展示

### 8. 补充说明
- Swagger 是否给出真实模型：否
- 当前是否需要实测：是

## 4.17 Get team members (owner)

### 1. 基本信息
- 标签：Team Owner
- 方法：`GET`
- 路径：`/user/team/owner/members`
- 状态：待补充
- 适用角色：团队 Owner
- 当前项目是否使用：否

### 2. 接口说明
- 用途：获取团队成员列表。
- 典型场景：Owner 管理成员、查看成员额度。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：大概率需要
- 必需请求头：待实测

### 4. 请求参数
Swagger 页当前未展示。

### 5. 请求示例
```bash
curl -X GET "https://co.yes.vg/api/v1/user/team/owner/members" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>"
```

### 6. 成功响应
- Swagger 页当前未展示

### 7. 错误响应
- Swagger 页当前未展示

### 8. 补充说明
- Swagger 是否给出真实模型：否
- 当前是否需要实测：是

## 4.18 Remove team member (owner)

### 1. 基本信息
- 标签：Team Owner
- 方法：`DELETE`
- 路径：`/user/team/owner/members/{member_id}`
- 状态：待补充
- 适用角色：团队 Owner
- 当前项目是否使用：否

### 2. 接口说明
- 用途：移除团队成员。
- 典型场景：Owner 踢出成员、清理无效账号。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：大概率需要
- 必需请求头：待实测

### 4. 请求参数
#### 4.1 Path 参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `member_id` | `string` | 是 | 成员 ID，Swagger 页只在路径中出现，未展开说明 |

#### 4.2 Query 参数
无

#### 4.3 Body 参数
无

### 5. 请求示例
```bash
curl -X DELETE "https://co.yes.vg/api/v1/user/team/owner/members/<member_id>" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>"
```

### 6. 成功响应
- Swagger 页当前未展示

### 7. 错误响应
- Swagger 页当前未展示

### 8. 补充说明
- Swagger 是否给出真实模型：否
- 当前是否需要实测：是

## 4.19 Update team member quotas (owner)

### 1. 基本信息
- 标签：Team Owner
- 方法：`PUT`
- 路径：`/user/team/owner/members/{member_id}`
- 状态：待补充
- 适用角色：团队 Owner
- 当前项目是否使用：否

### 2. 接口说明
- 用途：更新团队成员额度配置。
- 典型场景：Owner 调整某个成员的个人配额。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：大概率需要
- 必需请求头：待实测

### 4. 请求参数
#### 4.1 Path 参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `member_id` | `string` | 是 | 成员 ID，Swagger 页只在路径中出现，未展开说明 |

#### 4.2 Query 参数
无

#### 4.3 Body 参数
Swagger 页当前未展示；预计会包含额度相关字段。

### 5. 请求示例
```bash
curl -X PUT "https://co.yes.vg/api/v1/user/team/owner/members/<member_id>" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>" \
  -H "Content-Type: application/json"
```

### 6. 成功响应
- Swagger 页当前未展示

### 7. 错误响应
- Swagger 页当前未展示

### 8. 补充说明
- Swagger 是否给出真实模型：否
- 当前是否需要实测：是

## 5. 项目实际使用但 Swagger 未列出接口

## 5.1 Get user balance

### 1. 基本信息
- 标签：项目实际接口，未出现在当前 Swagger
- 方法：`GET`
- 路径：`/user/balance`
- 状态：已确认
- 适用角色：已登录用户
- 当前项目是否使用：是
- 代码位置：`src/services/apiService.ts`

### 2. 接口说明
- 用途：获取轻量余额摘要。
- 典型场景：当前项目个人主页卡片展示。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：是
- 必需请求头：`Authorization`、`X-API-Key`

### 4. 请求参数
无

### 5. 请求示例
```bash
curl -X GET "https://co.yes.vg/api/v1/user/balance" \
  -H "accept: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>"
```

### 6. 成功响应

```json
{
  "balance": 129.484033175,
  "pay_as_you_go_balance": 74.8,
  "subscription_balance": 54.68403317500002,
  "total_balance": 129.484033175,
  "weekly_limit": 200,
  "weekly_spent_balance": 70.6723711699999
}
```

### 7. 响应字段

| 字段 | 类型 | 说明 | 来源 |
|---|---|---|---|
| `balance` | `number` | 总余额 | 历史文档明确 |
| `pay_as_you_go_balance` | `number` | 按量余额 | 历史文档明确 |
| `subscription_balance` | `number` | 订阅余额 | 历史文档明确 |
| `total_balance` | `number` | 总余额汇总 | 历史文档明确 |
| `weekly_limit` | `number` | 周额度上限 | 历史文档明确 |
| `weekly_spent_balance` | `number` | 本周已使用额度 | 历史文档明确 |

### 8. 错误响应
- `401 Unauthorized`

### 9. 补充说明
- Swagger 是否给出真实模型：当前 `tab=api` 未列出
- 与当前项目关系：个人主页核心接口

## 5.2 Update balance preference

### 1. 基本信息
- 标签：项目实际接口，未出现在当前 Swagger
- 方法：`PUT`
- 路径：`/user/balance-preference`
- 状态：已确认
- 适用角色：已登录用户
- 当前项目是否使用：是
- 代码位置：`src/services/apiService.ts`

### 2. 接口说明
- 用途：更新余额扣费策略。
- 典型场景：在“订阅优先”和“仅按量”之间切换。

### 3. 请求要求
- Base URL：`https://co.yes.vg/api/v1`
- 是否鉴权：是
- 必需请求头：`Authorization`、`X-API-Key`、`Content-Type: application/json`

### 4. 请求参数
#### 4.1 Body 参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `balance_preference` | `string` | 是 | 可选值：`subscription_first`、`payg_only` |

### 5. 请求示例
```bash
curl -X PUT "https://co.yes.vg/api/v1/user/balance-preference" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>" \
  -d '{"balance_preference":"subscription_first"}'
```

### 6. 成功响应

```json
{
  "message": "Preference updated successfully",
  "balance_preference": "subscription_first"
}
```

### 7. 响应字段

| 字段 | 类型 | 说明 | 来源 |
|---|---|---|---|
| `message` | `string` | 更新成功提示 | 历史文档明确 |
| `balance_preference` | `string` | 更新后的扣费偏好 | 历史文档明确 |

### 8. 错误响应

| 状态码 | 含义 |
|---|---|
| `400` | 参数错误 |
| `401` | 未授权 |

### 9. 补充说明
- Swagger 是否给出真实模型：当前 `tab=api` 未列出
- 与当前项目关系：个人主页和设置页会调用

## 6. 结论

当前这套接口可以分成三类：

1. 当前项目已稳定依赖：
   - `/auth/profile`
   - `/user/balance`
   - `/user/balance-preference`
   - `/user/team`
   - `/user/team/usage`

2. Swagger 已明确存在，但字段模型不足：
   - `/team/stats/spending`
   - `/team/stats/usage`
   - `/user/team/owner/dashboard`

3. Swagger 已列出，但参数和响应还需后续实测：
   - `/auth/logout`
   - `/user/accent-color`
   - `/user/change-email`
   - `/user/change-password`
   - `/user/theme-preference`
   - `/user/team/purchase-ownership`
   - `/user/team/owner/invitations*`
   - `/user/team/owner/members*`
