# What changed

## Added
- frontend/src/auth/AuthContext.jsx   sign-in state (token kept in localStorage, checked via /api/auth/me/)
- frontend/src/pages/Auth.jsx         /login and /register
- backend/accounts/                   register, login, logout, me (DRF token auth)

## Replaced
- frontend/src/components/Layout.jsx  sticky header, desktop nav, hamburger menu for screens under 768px
  (closes on navigation / Escape / resize, aria-expanded, plain-language labels)
- frontend/src/main.jsx, App.jsx, api.js   AuthProvider, /login + /register routes, token header on every request

## Backend wiring (not done: backend was not in the upload)
1. settings.py: add 'rest_framework.authtoken' and 'accounts' to INSTALLED_APPS
2. settings.py REST_FRAMEWORK: add 'rest_framework.authentication.TokenAuthentication' to
   DEFAULT_AUTHENTICATION_CLASSES, keep default permission AllowAny so the demo still works
3. urls.py: path('api/auth/', include('accounts.urls'))
4. python manage.py migrate
5. Profile model: add user = ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=SET_NULL),
   set it in the create view when request.user.is_authenticated, then add a "my plans" endpoint.
