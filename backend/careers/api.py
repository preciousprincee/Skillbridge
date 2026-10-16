"""Consistent JSON envelope: {"ok": true, "data": ...} or {"ok": false, "error": {...}}."""
import logging

from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_handler

from ai_services.gemma_client import AIServiceError

logger = logging.getLogger(__name__)


def ok(data, http_status=status.HTTP_200_OK):
    return Response({"ok": True, "data": data}, status=http_status)


def fail(code, message, http_status, details=None):
    return Response({"ok": False, "error": {"code": code, "message": message, "details": details}},
                    status=http_status)


def exception_handler(exc, context):
    if isinstance(exc, AIServiceError):
        return fail(exc.code, exc.message, exc.http_status)
    if isinstance(exc, ValidationError):
        return fail("validation_error", "Please check the highlighted fields.", 400, exc.detail)
    response = drf_handler(exc, context)
    if response is not None:  # 404, 405, throttled, parse errors...
        detail = exc.detail if isinstance(exc, APIException) else None
        msg = str(detail) if isinstance(detail, (str,)) else "Request could not be processed."
        return fail("request_error", msg, response.status_code)
    logger.exception("Unhandled error", exc_info=exc)  # stack trace stays in server logs only
    return fail("server_error", "Something went wrong on our side. Please try again.", 500)
