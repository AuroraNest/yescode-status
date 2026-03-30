# 账号密码登录接口文档（`/auth/login`）

## 1. 基本信息

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 完整路径 | `/api/v1/auth/login` |
| 作用 | 使用账户名/邮箱和密码登录，返回后续接口可复用的 `token` 与 `api_key` |
| 鉴权 | 无，登录前接口 |
| 响应类型 | `application/json` |

## 2. 请求体

```json
{
  "username": "your-username",
  "password": "******"
}
```

说明：

- `username` 可以是用户名，也可以是邮箱。
- `password` 是账户密码。

## 3. 请求示例

```bash
curl -X POST "https://co.yes.vg/api/v1/auth/login" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"username":"your-username","password":"your-password"}'
```

## 4. 成功响应

```json
{
  "token": "jwt-token",
  "api_key": "cr_xxx",
  "user": {
    "id": 4015,
    "username": "your-username",
    "email": "example@example.com",
    "api_key": "cr_xxx",
    "balance_preference": "payg_only"
  }
}
```

## 5. 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `token` | `string` | 登录成功后返回的认证 token |
| `api_key` | `string` | 当前用户 API Key |
| `user.id` | `number` | 用户 ID |
| `user.username` | `string` | 用户名 |
| `user.email` | `string` | 用户邮箱 |
| `user.api_key` | `string` | 用户 API Key，通常与顶层 `api_key` 一致 |
| `user.balance_preference` | `string` | 当前扣费偏好 |

## 6. 当前项目中的使用方式

- app 设置页支持直接输入账户名和密码。
- 登录成功后，本地保存返回的 `token` 和 `api_key`。
- 后续接口统一复用这份鉴权，不再要求用户手动输入 API Key。
