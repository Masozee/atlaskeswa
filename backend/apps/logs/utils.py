"""
Utility functions for activity logging
"""
from .models import ActivityLog


def get_client_ip(request):
    """Extract client IP from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_activity(
    request,
    action,
    description,
    model_name='',
    object_repr='',
    obj=None,
    severity=ActivityLog.Severity.INFO,
    changes=None,
    metadata=None
):
    """
    Create an activity log entry.

    Args:
        request: The HTTP request object
        action: ActivityLog.Action choice
        description: Human-readable description of the action
        model_name: Name of the model being acted upon
        object_repr: String representation of the object
        obj: The model instance (optional, for content_type)
        severity: ActivityLog.Severity choice
        changes: Dict of before/after values
        metadata: Additional context data
    """
    from django.contrib.contenttypes.models import ContentType

    user = request.user if request.user.is_authenticated else None
    username = user.email if user else 'anonymous'

    log_data = {
        'user': user,
        'username': username,
        'action': action,
        'severity': severity,
        'description': description,
        'model_name': model_name,
        'object_repr': object_repr,
        'ip_address': get_client_ip(request),
        'user_agent': request.META.get('HTTP_USER_AGENT', '')[:500],
        'request_method': request.method,
        'request_path': request.path[:500],
        'changes': changes,
        'metadata': metadata,
    }

    # Add content type if object is provided
    if obj is not None:
        log_data['content_type'] = ContentType.objects.get_for_model(obj)
        log_data['object_id'] = obj.pk
        if not object_repr:
            log_data['object_repr'] = str(obj)[:200]

    return ActivityLog.objects.create(**log_data)


def log_create(request, obj, description=None):
    """Log a CREATE action"""
    model_name = obj.__class__.__name__
    desc = description or f'Created {model_name}: {obj}'
    return log_activity(
        request=request,
        action=ActivityLog.Action.CREATE,
        description=desc,
        model_name=model_name,
        obj=obj,
    )


def log_update(request, obj, description=None, changes=None):
    """Log an UPDATE action"""
    model_name = obj.__class__.__name__
    desc = description or f'Updated {model_name}: {obj}'
    return log_activity(
        request=request,
        action=ActivityLog.Action.UPDATE,
        description=desc,
        model_name=model_name,
        obj=obj,
        changes=changes,
    )


def log_delete(request, obj, description=None):
    """Log a DELETE action"""
    model_name = obj.__class__.__name__
    desc = description or f'Deleted {model_name}: {obj}'
    return log_activity(
        request=request,
        action=ActivityLog.Action.DELETE,
        description=desc,
        model_name=model_name,
        object_repr=str(obj)[:200],
    )


def log_survey_submit(request, survey):
    """Log survey submission"""
    return log_activity(
        request=request,
        action=ActivityLog.Action.SURVEY_SUBMIT,
        description=f'Submitted survey for service: {survey.service.name}',
        model_name='Survey',
        obj=survey,
    )


def log_survey_verify(request, survey):
    """Log survey verification"""
    return log_activity(
        request=request,
        action=ActivityLog.Action.SURVEY_VERIFY,
        description=f'Verified survey for service: {survey.service.name}',
        model_name='Survey',
        obj=survey,
    )


def log_survey_reject(request, survey, reason=''):
    """Log survey rejection"""
    return log_activity(
        request=request,
        action=ActivityLog.Action.SURVEY_REJECT,
        description=f'Rejected survey for service: {survey.service.name}',
        model_name='Survey',
        obj=survey,
        metadata={'rejection_reason': reason} if reason else None,
    )


def log_export(request, model_name, format_type, count=0):
    """Log data export"""
    return log_activity(
        request=request,
        action=ActivityLog.Action.EXPORT,
        description=f'Exported {count} {model_name} records to {format_type}',
        model_name=model_name,
        metadata={'format': format_type, 'record_count': count},
    )


def log_file_upload(request, obj, filename):
    """Log file upload"""
    model_name = obj.__class__.__name__
    return log_activity(
        request=request,
        action=ActivityLog.Action.FILE_UPLOAD,
        description=f'Uploaded file: {filename}',
        model_name=model_name,
        obj=obj,
        metadata={'filename': filename},
    )
