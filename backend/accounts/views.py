from django.contrib.auth import authenticate, get_user_model
from django.db import IntegrityError
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

User = get_user_model()


def ok(data, status=200):
    return Response({"ok": True, "data": data}, status=status)


def fail(code, message, details=None, status=400):
    return Response({"ok": False, "error": {"code": code, "message": message, "details": details}}, status=status)


def payload(user):
    token, _ = Token.objects.get_or_create(user=user)
    return {"token": token.key, "user": {"id": user.id, "name": user.first_name, "email": user.email}}


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def register(request):
    name = (request.data.get("name") or "").strip()
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    errors = {}
    if not name or len(name) > 150:
        errors["name"] = "Please enter your name (up to 150 characters)."
    if "@" not in email or len(email) > 150:
        errors["email"] = "Enter a valid email address."
    elif User.objects.filter(username__iexact=email).exists():
        errors["email"] = "An account with this email already exists."
    if len(password) < 8:
        errors["password"] = "Use at least 8 characters."
    if errors:
        return fail("validation_error", "Please fix the highlighted fields.", errors)
    try:
        user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
    except IntegrityError:  # two sign-ups with the same email at once
        return fail("validation_error", "Please fix the highlighted fields.", {"email": "An account with this email already exists."})
    return ok(payload(user), 201)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def login(request):
    email = (request.data.get("email") or "").strip().lower()
    user = authenticate(username=email, password=request.data.get("password") or "")
    if not user:
        return fail("invalid_credentials", "Email or password is incorrect.", status=401)
    return ok(payload(user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return ok({})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user
    return ok({"id": u.id, "name": u.first_name, "email": u.email})
