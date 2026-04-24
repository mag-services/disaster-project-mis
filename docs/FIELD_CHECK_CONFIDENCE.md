# Field Check Confidence – For DSPPAC Staff

This document explains how **confidence** is calculated and how staff can monitor and improve it through the backend admin.

---

## Where to View Confidence

**Admin dashboard:** `/admin/field-check/` (requires staff login)

The dashboard shows:
- **Confidence %** – Overall weighted confidence of damage estimates
- **Coverage %** – Percentage of items that have been field checked
- Counts by status (model, verified, adjusted, rejected)
- Records per week (last 8 weeks)

**API (for integrations):** `GET /api/v1/field-check/coverage/` (staff only)

Returns JSON including `confidence_percent` and `coverage_percent`.

---

## How Confidence Is Calculated

Each damage estimate item has a confidence level based on the **latest field check record**:

| Status | Meaning | Weight |
|--------|---------|--------|
| **Model (not checked)** | RAP estimate, no field verification yet | 0% |
| **Field verified** | Area admin checked on ground; estimate matches reality | 100% |
| **Field adjusted** | Area admin checked; value was corrected | 75% |
| **Rejected** | Area admin checked; estimate was wrong, not usable | 0% |

**Overall confidence %** = weighted average across all damage items:

```
(verified_count × 100 + adjusted_count × 75) / total_items × 100
```

Example: 50 items total, 20 verified, 10 adjusted, 5 rejected, 15 not checked:
- Weighted score = 20×100 + 10×75 = 2750
- Confidence = 2750 / 50 = **55%**

---

## How to Improve Confidence

1. **Continuous field checks after each cyclone** – Area administrators verify damage estimates in their provinces/area councils.
2. **More verified records** – Each "verified" record adds 100% to that item; more verified items raise the overall %.
3. **Fewer unchecked items** – Items with no field check count as 0%; getting them checked (even if adjusted or rejected) improves coverage and often confidence.

---

## Roles

- **Area administrators** – Perform field checks for items in their assigned areas.
- **Staff** – View the coverage dashboard, all records, and confidence metrics. Cannot add field check records (only area admins do that in the field).
