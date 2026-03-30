# 用户 RPM 接口文档（`/user/rate-limit`）

## 1. 基本信息

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 完整路径 | `/api/v1/user/rate-limit` |
| 作用 | 获取当前用户 RPM 窗口状态和当前生效的 RPM 上限 |
| 鉴权 | `Authorization: Bearer <token>` + `X-API-Key: <token>` |
| 响应类型 | `application/json` |

## 2. 请求前提

- 不需要业务入参。
- 已登录浏览器 Cookie 上下文也可访问。
- 桌面端主链路建议先调用 `GET /api/v1/auth/profile` 取得 `api_key`，再把该值同时放进 `Authorization` 和 `X-API-Key`。

## 3. 请求示例

```bash
curl -X GET "https://co.yes.vg/api/v1/user/rate-limit" \
  -H "accept: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-API-Key: <token>"
```

## 4. 成功响应

```json
{
  "current_rate": 0,
  "custom_limit_enabled": false,
  "custom_rpm": 1200,
  "remaining": 50,
  "rpm_limit": 50,
  "using_default": true,
  "window_seconds": 60
}
```

## 5. 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `current_rate` | `number` | 当前 RPM 窗口内已使用请求数，不是并发线程数 |
| `custom_limit_enabled` | `boolean` | 是否启用自定义限流策略 |
| `custom_rpm` | `number` | 自定义 RPM 值 |
| `remaining` | `number` | 当前窗口剩余请求数 |
| `rpm_limit` | `number` | 当前生效的 RPM 上限 |
| `using_default` | `boolean` | 当前是否使用默认限流策略 |
| `window_seconds` | `number` | RPM 统计窗口秒数 |

## 6. 错误响应

| 状态码 | 含义 | 示例 |
|------|------|------|
| `401 Unauthorized` | 鉴权缺失或 token 无效 | `{"detail":"Invalid authentication credentials"}` |
| `403 Forbidden` | 用户无权限或被限制访问 | `{"detail":"Forbidden"}` |

## 7. UI 映射关系

- 个人页“当前 RPM”卡片优先读取这个接口。
- 团队页“RPM”卡片也优先读取这个接口。
- 当前项目实现里，RPM 刷新已经独立于余额/团队数据刷新。
- RPM 卡片支持单独刷新间隔和单独手动刷新按钮。
- 当这个接口不可用时，团队页才回退展示 `GET /api/v1/team/stats/spending` 返回的团队限额配置。

## 8. 备注

- 该接口不在当前 Swagger 导出中，应视为“项目实际依赖但非 swagger 覆盖接口”。
- 浏览器登录态和 API Key 鉴权两条链路都已实测可访问。
