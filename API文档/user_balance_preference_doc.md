# ⚙️ API Documentation: Update Balance Preference (`/user/balance-preference`)

## 基本信息

| 项目 | 内容 |
|------|------|
| **请求方法** | `PUT` |
| **接口路径** | `/user/balance-preference` |
| **接口功能** | 修改当前用户的余额扣费策略（优先订阅额度或仅按量付费） |
| **是否需要鉴权** | 是（需携带 `Authorization: Bearer <token>`） |
| **请求类型** | `application/json` |

---

## 📥 请求体参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `balance_preference` | `string` | ✅ 是 | 扣费策略，可选值：<br>• `"subscription_first"` —— 优先使用订阅额度，再使用按量付费额度。<br>• `"payg_only"` —— 仅使用按量付费额度，不动订阅额度。 |

---

## 💻 请求示例

```bash
curl -X PUT "https://co.yes.vg/api/v1/user/balance-preference" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
        "balance_preference": "subscription_first"
      }'
```

---

## ✅ 成功响应（200 OK）

```json
{
  "message": "Preference updated successfully",
  "balance_preference": "subscription_first"
}
```

说明：表示用户的扣费策略已成功更新，变更会立即生效。

---

## ⚠️ 错误响应

| 状态码 | 含义 | 示例 |
|--------|------|------|
| `400` | 参数错误（传入了无效的 balance_preference） | `{ "error": "Invalid balance preference" }` |
| `401` | 未授权（Token 缺失或无效） | `{ "error": "Unauthorized" }` |

---

## 💡 备注

- 该接口主要用于账户额度和消费策略的个性化设置。  
- 系统默认策略为 `"subscription_first"`，即优先使用订阅额度。  
- 设置更新后无需重新登录，立即生效。  
- 团队账户或自动化脚本可使用此接口，防止意外消耗订阅额度。  

---
