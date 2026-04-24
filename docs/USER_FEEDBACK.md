# User Feedback Feature

Users can submit feedback (bugs, feature requests, general) with optional screenshots via a floating button.

## Frontend

- **Floating button**: Bottom-right, speech-bubble icon. Hidden when screen is locked.
- **Modal form**:
  - Category: Bug, Feature request, General feedback
  - Description: Required text area
  - Screenshot: Optional – "Take screenshot" (captures map area via html2canvas) or "Upload image"

## Backend

- **Endpoint**: `POST /api/v1/feedback/feedback/` (multipart/form-data)
- **Auth**: Required (Token)
- **Payload**: `category`, `message`, `screenshot?`, `user_email?`, `page_url?`, `user_agent?`
- **Storage**: Feedback model; screenshots in `media/feedback/YYYY-MM/`
- **Admin**: Django admin lists feedback with category, message preview, user, date

## Migration

```bash
python manage.py migrate feedback
```

## Optional enhancements (not implemented)

- Annotate screenshot before sending
- Email notification to admins
- Error reporting (auto-attach error info)
