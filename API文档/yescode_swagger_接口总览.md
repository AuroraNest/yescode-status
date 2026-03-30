# YesCode Swagger 接口总览

更新时间：2026-03-22

## 1. 文档来源

- Swagger 页面：`https://co.yes.vg/docs?tab=api`
- Swagger 原始规范：`GET https://co.yes.vg/api/v1/docs/spec`
- 辅助校验来源：页面实际发出的已登录请求

## 2. 适用范围

这份文档以 yesCode 当前 swagger 导出的接口为准，并补充了页面真实请求中能确认到的字段轮廓。

注意三点：

1. swagger 导出的很多路径写成 `/auth/profile`、`/user/team` 这种相对路径，但页面真实请求实际都带 `/api/v1` 前缀。本文统一按实际调用地址写成完整路径，例如 `GET /api/v1/auth/profile`。
2. swagger 的 operation 上引用了 `UserApiKey`、`UserToken`、`TeamApiKey` 三类鉴权，但导出的 JSON 里没有 `securityDefinitions`，所以鉴权方案要结合页面真实请求理解。
3. 当前仓库前端仍在调用 `GET /api/v1/user/balance`、`PUT /api/v1/user/balance-preference` 和 `GET /api/v1/user/rate-limit`，但这三个接口不在当前 swagger 导出中，本文会单独标成“非 swagger 覆盖接口”。

## 3. 鉴权约定

### 3.1 用户接口

swagger 标记为：

- `UserApiKey`
- `UserToken`

当前页面和当前项目里都能看到的实际请求头通常是：

```http
Authorization: Bearer <user_token_or_api_key>
X-API-Key: <user_token_or_api_key>
Accept: application/json
Content-Type: application/json
```

对当前项目新增的 RPM 查询，已经确认存在一条稳定链路：

1. 先在已登录状态下调用 `GET /api/v1/auth/profile`
2. 从响应中取出 `api_key`
3. 再使用 `Authorization: Bearer <api_key>` 与 `X-API-Key: <api_key>` 调用 `GET /api/v1/user/rate-limit`

这个接口无查询参数，返回的是当前用户实时 RPM 窗口状态，而不是团队限额配置。

### 3.2 团队接口

swagger 标记为：

- `TeamApiKey`

页面真实返回的团队信息里可拿到 `team_api_key`。团队统计接口适合用团队 key 调用。

## 4. 当前 swagger 覆盖概览

swagger 共导出 55 个 operation，主要分成这些组：

| 分组 | 说明 |
| --- | --- |
| Authentication | 登录态相关，当前只有登出 |
| User | 用户资料、主题、颜色、邮箱、密码、重新生成 key |
| User Teams | 当前用户所属团队、团队用量、购买 owner 资格 |
| Team Owner | owner 侧 dashboard、邀请码、成员管理 |
| Team Stats | 团队 key 视角的 usage / spending |
| Admin / rate-limits / Admin Email | 管理员和限流、邮件队列相关 |
| Chat / Tickets | 站内聊天、工单上传相关 |

## 5. 与当前项目直接相关的接口

### 5.1 用户与基础状态

| 方法 | 路径 | 作用 | swagger 是否覆盖 |
| --- | --- | --- | --- |
| `GET` | `/api/v1/auth/profile` | 获取当前用户资料 | 是 |
| `POST` | `/api/v1/user/regenerate-api-key` | 重新生成用户 API Key | 是 |
| `PUT` | `/api/v1/user/theme-preference` | 更新主题偏好 | 是 |
| `PUT` | `/api/v1/user/accent-color` | 更新强调色偏好 | 是 |
| `GET` | `/api/v1/user/balance` | 获取余额摘要 | 否 |
| `PUT` | `/api/v1/user/balance-preference` | 更新扣费偏好 | 否 |
| `GET` | `/api/v1/user/rate-limit` | 获取当前 RPM 窗口状态 | 否 |

补充：

- 当前项目的个人页和团队页都会优先复用 `GET /api/v1/user/rate-limit` 来展示实时 RPM。
- 这个接口展示的是“当前窗口内的真实请求计数”，不是团队限额配置。

### 5.2 团队视图相关

| 方法 | 路径 | 作用 | 适用 key |
| --- | --- | --- | --- |
| `GET` | `/api/v1/user/team` | 获取当前用户团队信息 | 用户 key / 用户登录态 |
| `GET` | `/api/v1/user/team/usage` | 获取当前用户视角的团队 usage | 用户 key / 用户登录态 |
| `GET` | `/api/v1/team/stats/usage` | 获取团队 key 视角的 usage 明细 | 团队 key |
| `GET` | `/api/v1/team/stats/spending` | 获取团队 spending / 限额摘要 | 团队 key |
| `GET` | `/api/v1/user/team/owner/dashboard` | owner 团队总览 | 用户 key / 用户登录态 |
| `GET` | `/api/v1/user/team/owner/invitations` | owner 查看邀请码 | 用户 key / 用户登录态 |
| `POST` | `/api/v1/user/team/owner/invitations` | owner 创建邀请码 | 用户 key / 用户登录态 |
| `DELETE` | `/api/v1/user/team/owner/invitations/{invitation_id}` | owner 撤销邀请码 | 用户 key / 用户登录态 |
| `GET` | `/api/v1/user/team/owner/members` | owner 查看成员列表 | 用户 key / 用户登录态 |
| `PUT` | `/api/v1/user/team/owner/members/{member_id}` | owner 更新成员额度 | 用户 key / 用户登录态 |
| `DELETE` | `/api/v1/user/team/owner/members/{member_id}` | owner 移除成员 | 用户 key / 用户登录态 |
| `POST` | `/api/v1/user/team/purchase-ownership` | 购买团队 owner 资格 | 用户 key / 用户登录态 |

补充说明：

- 当前项目团队页已经改为优先展示 `GET /api/v1/user/rate-limit` 返回的真实个人 RPM。
- 当 `user/rate-limit` 暂时不可用时，才回退展示 `team/stats/spending` 的团队限额配置。

## 6. 重点接口说明

### 6.1 `GET /api/v1/auth/profile`

作用：

- 获取当前登录用户完整资料。
- 当前项目个人视图的用户信息主要依赖这个接口。

swagger 信息：

- summary：`Get user profile`
- 鉴权：`UserApiKey` / `UserToken`

成功响应：

- `200`：`#/definitions/claude-api-router_internal_domain.User`

错误响应：

- `401 Unauthorized`

根据 swagger `User` 定义，核心字段包括：

| 字段 | 说明 |
| --- | --- |
| `id` | 用户 ID |
| `username` | 用户名 |
| `email` | 邮箱 |
| `api_key` | 当前用户 API Key |
| `balance_preference` | 扣费偏好 |
| `balance` | 兼容字段，总余额 |
| `credit_balance` | credit 余额 |
| `pay_as_you_go_balance` | 按量余额 |
| `subscription_balance` | 订阅余额 |
| `subscription_expiry` | 订阅到期时间 |
| `subscription_plan` | 当前订阅方案 |
| `current_week_spend` | 本周消耗 |
| `current_month_spend` | 本月消耗 |
| `current_team` / `current_team_id` | 当前团队 |
| `theme_preference` | UI 主题偏好 |
| `accent_color_name` / `accent_color_hsl` | 强调色偏好 |
| `default_chat_model` | 默认聊天模型 |
| `weekly_limit_override` | 周额度覆写 |

### 6.2 `GET /api/v1/user/team`

作用：

- 获取当前用户所属团队信息。
- 当前项目团队视图最应该优先依赖这个接口，而不是单纯用 token 前缀猜测是否有团队。

swagger 信息：

- summary：`Get user's team information`
- 鉴权：`UserApiKey` / `UserToken`
- swagger 响应只写了 `object`，没有展开 schema

页面真实请求可确认的顶层字段：

| 字段 | 说明 |
| --- | --- |
| `has_team` | 是否有团队 |
| `role` | 当前用户在团队中的角色 |
| `team` | 团队对象 |
| `team_api_key` | 团队 API Key |
| `is_owner` | 当前用户是否 owner |
| `has_team_owner` | 团队是否已购买 owner 能力 |
| `owner_enabled` | 是否允许购买 owner |
| `can_purchase_ownership` | 当前用户是否可购买 owner |
| `owner_price` | owner 价格 |
| `owner_expires_at` | owner 到期时间 |
| `daily_balance` | 当前生效的日额度 |
| `daily_remaining_balance` | 当前剩余日额度 |
| `weekly_limit` | 当前周额度 |
| `monthly_limit` | 当前月额度 |
| `current_week_spend` | 当前周已消耗 |
| `current_month_spend` | 当前月已消耗 |
| `team_daily_balance` | 团队日额度 |
| `team_daily_remaining_balance` | 团队剩余日额度 |
| `team_week_spend` | 团队本周已消耗 |
| `team_monthly_limit` | 团队月额度 |
| `user_daily_balance` | 用户个人日额度 |
| `user_daily_remaining_balance` | 用户个人剩余日额度 |
| `member_week_spend` | 当前成员周消耗 |
| `member_costs` | 成员成本列表 |
| `total_team_cost` | 团队总成本 |
| `weekly_limit_override` | 周额度覆写 |
| `is_team_wide_weekly_limit` | 是否启用团队级周限制 |

`team` 对象目前可确认字段：

- `id`
- `name`
- `description`
- `max_members`
- `seat_price`
- `daily_balance`
- `per_user_daily_balance`
- `weekly_limit`
- `monthly_limit`
- `owner_enabled`
- `owner_price`
- `provider_group`
- `opus_usage_limit_percentage`
- `opus_daily_spending`
- `opus_last_reset`
- `is_active`
- `created_at`
- `updated_at`

### 6.3 `GET /api/v1/user/team/usage`

作用：

- 获取当前用户视角的团队使用统计。
- 适合做当前项目里的“团队页面概览”。

swagger 信息：

- summary：`Get team usage statistics`
- 鉴权：`UserApiKey` / `UserToken`

查询参数：

| 参数 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `period` | `string` | 否 | 聚合窗口，枚举：`5hours`、`1day`、`1week`、`1month` |

成功响应：

- `200 Team usage statistics`

错误响应：

- `400 Not a team member`
- `401 Unauthorized`

页面真实请求可确认的响应结构：

- 顶层字段：`period`、`member_stats`、`team_stats`
- `member_stats` 是数组，单项字段包括：
  - `team_member_id`
  - `user_id`
  - `username`
  - `total_requests`
  - `total_cost`
  - `total_input_tokens`
  - `total_output_tokens`
  - `daily_usage`
  - `model_stats`
- `team_stats` 是数组，单项字段包括：
  - `model`
  - `requests`
  - `input_tokens`
  - `output_tokens`
  - `cache_creation_tokens`
  - `cache_read_tokens`
  - `total_cost`

### 6.4 `GET /api/v1/team/stats/usage`

作用：

- 使用团队 key 查看团队 usage 明细。
- 更适合团队级统计、成员 usage 列表、分页展示。

swagger 信息：

- summary：`Get team usage`
- 鉴权：`TeamApiKey`

查询参数：

| 参数 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `period` | `string` | 否 | 枚举：`today`、`week`、`month` |
| `limit` | `integer` | 否 | 每页条数，swagger 默认值 `100` |
| `offset` | `integer` | 否 | 偏移量，swagger 默认值 `0` |

成功响应：

- `200 Usage data`

错误响应：

- `401 Unauthorized`
- `403 Forbidden`

页面真实请求可确认的响应结构：

- 顶层字段：`period`、`limit`、`offset`、`total_count`、`summary`、`usage`
- `summary` 是数组，单项字段包括：
  - `model`
  - `requests`
  - `input_tokens`
  - `output_tokens`
  - `cache_creation_tokens`
  - `cache_read_tokens`
  - `total_cost`
- `usage` 是数组，单项字段包括：
  - `id`
  - `request_id`
  - `created_at`
  - `model`
  - `provider_id`
  - `provider_name`
  - `provider_rate`
  - `input_tokens`
  - `output_tokens`
  - `cache_creation_tokens`
  - `cache_read_tokens`
  - `cost`
  - `client_ip`
  - `labels`
  - `team_id`
  - `team_member_id`
  - `team`
  - `team_member`

### 6.5 `GET /api/v1/team/stats/spending`

作用：

- 使用团队 key 查看团队 spending、时段限制和剩余额度。
- 如果项目要做“团队剩余额度”“近 1 小时/5 小时/当天限制”展示，这个接口优先级很高。

swagger 信息：

- summary：`Get team spending`
- 鉴权：`TeamApiKey`

成功响应：

- `200 Spending information`

错误响应：

- `401 Unauthorized`
- `403 Forbidden`

页面真实请求可确认的响应字段：

- `daily_limit`
- `daily_spending`
- `daily_remaining`
- `hourly_limit`
- `hourly_spending`
- `five_hour_limit`
- `five_hour_spending`
- `monthly_spending`
- `team_daily_limit`
- `team_daily_spending`
- `team_daily_remaining`
- `opus_hourly_limit`
- `requests_per_minute_limit`
- `requests_per_hour_limit`
- `total_spending`

### 6.6 `POST /api/v1/user/regenerate-api-key`

作用：

- 重新生成当前用户的 API Key。

swagger 信息：

- summary：`Regenerate API key`
- 鉴权：`UserApiKey` / `UserToken`
- 请求体：无

成功响应：

- `200`：`api.MessageResponse`

错误响应：

- `401 Unauthorized`

当前 swagger 只明确了 `message` 字段，没有明确写“新 key 是否直接返回”。如果项目要做前端入口，先不要假设响应里一定带新 key。

### 6.7 `PUT /api/v1/user/theme-preference`

作用：

- 更新当前用户主题偏好。

swagger 说明：

- 请求体描述：`theme_preference: dark|light`

可按如下格式理解：

```json
{
  "theme_preference": "dark"
}
```

### 6.8 `PUT /api/v1/user/accent-color`

作用：

- 更新当前用户强调色偏好。

swagger 说明：

- 请求体描述：`color_name`，以及自定义色场景下可选 `color_hsl`

可按如下格式理解：

```json
{
  "color_name": "custom",
  "color_hsl": "282 65% 53%"
}
```

### 6.9 `POST /api/v1/user/change-email`

请求体 schema：`internal_auth.EmailChangeRequest`

```json
{
  "new_email": "name@example.com"
}
```

### 6.10 `POST /api/v1/user/change-password`

请求体 schema：`internal_auth.PasswordChangeRequest`

```json
{
  "old_password": "old-password",
  "new_password": "new-password"
}
```

其中 `new_password` 最小长度为 6。

## 7. owner 侧接口

这些接口 swagger 有定义，但当前只从 swagger 描述里能确认用途，页面真实请求未能用当前登录态拿到 `200` 成功样例。

| 方法 | 路径 | 说明 | 已确认内容 |
| --- | --- | --- | --- |
| `GET` | `/api/v1/user/team/owner/dashboard` | owner 团队总览 | 描述里明确包含成员与配额概览 |
| `GET` | `/api/v1/user/team/owner/invitations` | owner 邀请码列表 | `200` 返回数组，元素为 `TeamInvitation` |
| `POST` | `/api/v1/user/team/owner/invitations` | 创建邀请码 | 请求体是 `object`，swagger 未展开字段 |
| `DELETE` | `/api/v1/user/team/owner/invitations/{invitation_id}` | 撤销邀请码 | 需要路径参数 `invitation_id` |
| `GET` | `/api/v1/user/team/owner/members` | 查看成员列表 | 支持 `page`、`limit`、`search` |
| `PUT` | `/api/v1/user/team/owner/members/{member_id}` | 修改成员额度 | 描述写明更新 daily / weekly / monthly 限制 |
| `DELETE` | `/api/v1/user/team/owner/members/{member_id}` | 移除成员 | 需要路径参数 `member_id` |
| `POST` | `/api/v1/user/team/purchase-ownership` | 购买 owner 资格 | body 可选 `team_id` |

`TeamInvitation` 定义里可确认字段：

- `id`
- `code`
- `team_id`
- `created_by_owner_id`
- `max_uses`
- `used_count`
- `redemption_days`
- `expires_at`
- `is_active`
- `created_at`
- `updated_at`

## 8. swagger 覆盖但当前项目暂未用到的组

### 8.1 管理员 / 限流

存在这些接口：

- `GET /api/v1/admin/rate-limits/export`
- `GET /api/v1/admin/rate-limits/global`
- `PUT /api/v1/admin/rate-limits/global`
- `GET /api/v1/admin/rate-limits/stats`
- `GET /api/v1/admin/rate-limits/users`
- `GET /api/v1/admin/rate-limits/users/{user_id}`
- `PUT /api/v1/admin/rate-limits/users/{user_id}`
- `DELETE /api/v1/admin/rate-limits/users/{user_id}`
- `GET /api/v1/admin/rate-limits/users/{user_id}/endpoints`
- `POST /api/v1/admin/upload-image`
- `GET /api/v1/admin/email/queue/health`
- `GET /api/v1/admin/email/queue/metrics`
- `POST /api/v1/admin/email/queue/enable`
- `POST /api/v1/admin/email/queue/disable`

### 8.2 站内聊天 / 工单

存在这些接口：

- `GET|POST|PATCH|DELETE /api/v1/chat/...`
- `POST /api/v1/tickets/upload-image`
- `POST /api/v1/tickets/assistant/chat`

当前 yescode-status 项目没有用到这部分。

## 9. 与当前仓库现状的差异

### 9.1 当前项目实际在用，但 swagger 没覆盖

当前源码中明确调用了这些接口：

- [src/services/apiService.ts](/Users/aurora/project/Aurora/yescode-status/src/services/apiService.ts)
  - `GET /api/v1/user/balance`
  - `PUT /api/v1/user/balance-preference`
  - `GET /api/v1/user/rate-limit`

其中 `GET /api/v1/user/balance` 已从页面真实请求确认返回这些顶层字段：

- `balance`
- `pay_as_you_go_balance`
- `subscription_balance`
- `total_balance`

而 `PUT /api/v1/user/balance-preference` 在当前 swagger 中没有条目，当前项目代码约定的请求体是：

```json
{
  "balance_preference": "subscription_first"
}
```

可选值来自当前项目源码：

- `subscription_first`
- `payg_only`

而 `GET /api/v1/user/rate-limit` 已从页面和 API Key 实测确认返回这些顶层字段：

- `current_rate`
- `custom_limit_enabled`
- `custom_rpm`
- `remaining`
- `rpm_limit`
- `using_default`
- `window_seconds`

页面可行链路也已经确认：

1. 在已登录状态下调用 `GET /api/v1/auth/profile`
2. 从返回中取 `api_key`
3. 使用 `Authorization: Bearer <api_key>` 和 `X-API-Key: <api_key>` 调 `GET /api/v1/user/rate-limit`
4. 可正常返回当前 RPM 窗口数据

补充结论：

- 无查询参数
- 浏览器登录态和 API Key 鉴权都可以调用
- 语义是“当前用户当前窗口的实时 RPM 状态”，不是静态限额配置

这两个接口不在当前 swagger 导出里，所以：

- 旧文档 [API文档/user_balance_doc.md](/Users/aurora/project/Aurora/yescode-status/API文档/user_balance_doc.md) 不能视为“当前 swagger 文档”
- 旧文档 [API文档/user_balance_preference_doc.md](/Users/aurora/project/Aurora/yescode-status/API文档/user_balance_preference_doc.md) 也不能视为“当前 swagger 文档”

### 9.2 页面真实请求出现，但 swagger 没覆盖

页面还实际调用了：

- `GET /api/v1/user/team/membership-status`

它返回的字段包括：

- `is_team_member`
- `membership_is_active`
- `membership_joined_at`
- `membership_expires_at`
- `days_until_expiry`
- `expiring_soon`
- `has_pending_plan`
- `current_team`
- `team_api_key`

这个接口对团队资格判断很有价值，但当前 swagger 没列出来。

### 9.3 路径前缀不一致

swagger `paths` 里很多路径没有写 `/api/v1`，但实际请求都有 `/api/v1`。后续写代码时应以真实请求地址为准，不要直接把 swagger 的裸路径拿去拼接。

### 9.4 鉴权定义缺失

operation 里引用了：

- `UserApiKey`
- `UserToken`
- `TeamApiKey`

但 swagger JSON 没有导出这三类 scheme 的正式定义。这意味着接口权限虽然能从 operation 看出方向，但不能完全依赖 swagger 自动生成客户端。

## 10. 本地旧文档状态判断

### 10.1 可保留但已过时

- [API文档/auth_profile_doc.md](/Users/aurora/project/Aurora/yescode-status/API文档/auth_profile_doc.md)
  - 有参考价值，但内容是英文手写版，不是基于本次 swagger 全量重写，且示例字段带历史时间戳。

- [yes_code_团队额度相关接口说明.md](/Users/aurora/project/Aurora/yescode-status/yes_code_团队额度相关接口说明.md)
  - 这份文档原本是“基于折叠页面推测”的说明，现在已经可以被本文替代。

### 10.2 与当前 swagger 不一致

- [API文档/user_balance_doc.md](/Users/aurora/project/Aurora/yescode-status/API文档/user_balance_doc.md)
- [API文档/user_balance_preference_doc.md](/Users/aurora/project/Aurora/yescode-status/API文档/user_balance_preference_doc.md)

原因不是它们一定错误，而是它们描述的接口不在当前 swagger 导出内。

## 11. 对当前项目的直接建议

如果后续只想“少改 UI、多补逻辑”，优先这样用：

1. 个人信息继续走 `GET /api/v1/auth/profile`
2. 团队存在性不要只看 token 前缀，优先用 `GET /api/v1/user/team`
3. 团队概览优先用 `GET /api/v1/user/team` + `GET /api/v1/user/team/usage`
4. 如果要展示团队级 spending / 限流摘要，再接 `GET /api/v1/team/stats/spending`
5. 如果要做团队 usage 明细分页，再接 `GET /api/v1/team/stats/usage`
