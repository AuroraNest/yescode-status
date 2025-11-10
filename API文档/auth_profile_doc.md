# 📘 API Documentation: Get User Profile (`/auth/profile`)

## Basic Information

| Item | Description |
|------|--------------|
| **Method** | `GET` |
| **Endpoint** | `/auth/profile` |
| **Description** | Retrieves the authenticated user's complete profile information, including balance, subscription, and preferences. |
| **Authentication** | Required (`Authorization: Bearer <token>`) |
| **Response Type** | `application/json` |

---

## Request Example

```bash
curl -X GET "https://api.example.com/auth/profile" \
  -H "Authorization: Bearer <your_access_token>" \
  -H "Accept: application/json"
```

---

## Full JSON Response

```json
{
  "accent_color_hsl": "282 65% 53%",
  "accent_color_name": "custom",
  "api_key": "cr_7b703fc0da7f00a80c42ec7d24410b2bbaf8789c003759c466df95f707865f38",
  "balance": 129.484033175,
  "balance_preference": "subscription_first",
  "created_at": "2025-09-24T17:12:04.335894+08:00",
  "credit_balance": 0,
  "current_month_spend": 140.20514553499984,
  "current_team": null,
  "current_team_id": null,
  "current_week_spend": 70.6723711699999,
  "email": "eternalflameaurorali@gmail.com",
  "email_verified": true,
  "id": 4015,
  "is_suspended": false,
  "last_daily_balance_add": "2025-11-10T00:00:00.00037+08:00",
  "last_month_reset": "2025-11-01T17:24:27.107151+08:00",
  "last_week_reset": "2025-11-04T12:02:06.991939+08:00",
  "oauth_id": null,
  "pay_as_you_go_balance": 74.8,
  "pending_team_plan_days": 0,
  "pending_team_plan_id": null,
  "referral_code": "sysadmin",
  "referred_by_user_id": null,
  "subscription_balance": 54.68403317500002,
  "subscription_expiry": "2026-01-01T08:00:00+08:00",
  "subscription_plan": {
    "id": 23,
    "name": "Ultra",
    "description": "Full Power",
    "plan_type": "recurring",
    "price": 39.9,
    "daily_balance": 100,
    "monthly_spend_limit": 860,
    "weekly_limit": 200,
    "initial_balance": 0,
    "is_team_plan": false,
    "team_membership_days": 30,
    "stock": -1,
    "is_renewable": true,
    "provider_url": "",
    "provider_api_key": "",
    "subscription_provider_id": 1,
    "opus_usage_limit_percentage": 100,
    "is_active": true,
    "created_at": "2025-08-09T10:00:35.188922+08:00",
    "updated_at": "2025-10-29T12:19:43.522405+08:00"
  },
  "subscription_plan_id": 23,
  "theme_preference": "light",
  "total_referral_earnings": 0,
  "updated_at": "2025-11-10T20:06:03.950307+08:00",
  "username": "sysadmin"
}
```

---

## Field Descriptions

| Field | Type | Description |
|--------|------|-------------|
| `id` | number | Unique user ID |
| `username` | string | Username |
| `email` | string | Registered email |
| `email_verified` | boolean | Whether the email is verified |
| `is_suspended` | boolean | Indicates if the user account is suspended |
| `api_key` | string | User API key for programmatic access |
| `balance` | number | Total available balance |
| `credit_balance` | number | Credit account balance |
| `pay_as_you_go_balance` | number | Pay-as-you-go balance |
| `subscription_balance` | number | Subscription account remaining balance |
| `balance_preference` | string | Deduction priority (`subscription_first`, etc.) |
| `subscription_expiry` | string | Subscription expiry date |
| `subscription_plan` | object | Subscription plan details |
| `current_week_spend` | number | Current week's spending |
| `current_month_spend` | number | Current month's spending |
| `theme_preference` | string | User's theme preference (`light`/`dark`) |
| `accent_color_hsl` | string | Accent color in HSL format |
| `referral_code` | string | User referral code |
| `total_referral_earnings` | number | Total earnings from referrals |
| `created_at` | string | Account creation timestamp |
| `updated_at` | string | Last updated timestamp |

---

## Error Responses

| Status | Meaning | Example |
|--------|----------|----------|
| `401 Unauthorized` | Invalid or missing token | `{"detail": "Invalid authentication credentials"}` |
| `403 Forbidden` | User account suspended | `{"detail": "User suspended"}` |
