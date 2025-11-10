# 💰 API Documentation: Get User Balance (`/user/balance`)

## Basic Information

| Item | Description |
|------|--------------|
| **Method** | `GET` |
| **Endpoint** | `/user/balance` |
| **Description** | Retrieves the authenticated user's current balance, pay-as-you-go credit, subscription balance, and weekly spending information. |
| **Authentication** | Required (`Authorization: Bearer <token>`) |
| **Response Type** | `application/json` |

---

## Request Example

```bash
curl -X GET "https://co.yes.vg/api/v1/user/balance" \
  -H "accept: application/json" \
  -H "X-API-key: cr_7b703fc0da7f00a80c42ec7d24410b2bbaf8789c003759c466df95f707865f38" \
  -H "Authorization: Bearer <your_access_token>"
```

---

## Success Response (HTTP 200)

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

---

## Field Descriptions

| Field | Type | Description |
|--------|------|-------------|
| `balance` | number | The total available balance for the user (sum of all types). |
| `pay_as_you_go_balance` | number | Remaining balance for pay-as-you-go (usage-based) credits. |
| `subscription_balance` | number | Remaining credits from the user's active subscription plan. |
| `total_balance` | number | Combined balance, usually the same as `balance`. |
| `weekly_limit` | number | Weekly spending limit defined by the plan. |
| `weekly_spent_balance` | number | Amount already spent this week. |

---

## Error Responses

| Status | Meaning | Example |
|--------|----------|----------|
| `401 Unauthorized` | Invalid or missing token | `{"detail": "Invalid authentication credentials"}` |

---

## Notes

- This endpoint provides a **lightweight balance summary** for dashboards or periodic checks.  
- Related endpoint `/user/balance-preference` allows changing deduction priority (`subscription_first`, etc.).  
- Balance and spend data correspond to fields shown in `/auth/profile` but omit unrelated user metadata.  
- Useful for displaying usage limits and remaining credits in web or mobile client UIs.

---
