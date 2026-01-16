# Advanced Logging System

This app provides comprehensive logging functionality for the DESDE-LTC Survey & Dashboard System, supporting all frontend logging menu items.

## Log Types

### 1. Activity Logs (`ActivityLog`)
**Purpose**: Track all user activities and system actions

**Features**:
- Comprehensive action tracking (Login, Logout, CRUD operations, File operations, etc.)
- Severity levels (INFO, WARNING, ERROR, CRITICAL)
- Generic foreign key to any model
- Request metadata (IP, User Agent, HTTP method, path)
- Before/after change tracking with JSON fields
- Automatic username storage (persists even if user deleted)

**Use Cases**:
- User authentication audit
- Data access monitoring
- Security incident investigation
- User behavior analysis
- Compliance reporting

**Admin Features**:
- Filterable by action, severity, model, timestamp
- Searchable by username, description, model
- Date hierarchy for time-based browsing
- Clickable links to related objects
- Read-only (auto-generated logs)

---

### 2. Verification Logs (`VerificationLog`)
**Purpose**: Track complete survey verification workflow

**Features**:
- Action tracking (SUBMITTED, ASSIGNED, VERIFIED, REJECTED, etc.)
- Status change tracking (before/after)
- Verifier assignment tracking
- Field-level change tracking
- Time-taken metrics (submission to verification duration)
- Rejection reason logging
- IP address tracking

**Use Cases**:
- Survey verification audit trail
- Verifier performance metrics
- Quality control monitoring
- Rejection pattern analysis
- Workflow bottleneck identification

**Admin Features**:
- Direct link to related survey
- Filterable by action, status, timestamp
- Time-taken display
- Inline display in Survey admin
- Read-only audit trail

---

### 3. Data Change Logs (`DataChangeLog`)
**Purpose**: Complete audit trail for all data modifications

**Features**:
- Operation tracking (INSERT, UPDATE, DELETE, BULK operations)
- Full before/after state capture (JSON)
- Changed fields tracking
- Bulk operation support with affected count
- Generic foreign key to any model
- Reason field for change justification
- Request context capture

**Use Cases**:
- Data integrity auditing
- Rollback reference
- Compliance requirements (GDPR, audit trails)
- Change history analysis
- Debugging data issues

**Admin Features**:
- Filterable by operation, model, bulk status
- Display changed fields summary
- Expandable before/after JSON views
- Clickable links to related objects
- Bulk operation indicators
- Read-only protection

---

### 4. System Errors (`SystemError`)
**Purpose**: Application error and exception tracking

**Features**:
- Severity levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- Error type classification (VALIDATION, DATABASE, API, etc.)
- Full stack trace capture
- Module/function/line number tracking
- Request context (method, path, data)
- Occurrence counting (duplicate detection)
- Resolution workflow (mark as resolved, add notes)
- First/last occurrence timestamps

**Use Cases**:
- Bug tracking and resolution
- Application stability monitoring
- Error pattern analysis
- Performance issue detection
- Production incident response

**Admin Features**:
- Color-coded severity badges
- Filterable by severity, type, resolution status
- Searchable error messages and codes
- Occurrence count display
- Resolution workflow (assign resolver, add notes)
- Collapsible stack traces
- Editable resolution fields

---

### 5. Import/Export Logs (`ImportExportLog`)
**Purpose**: Track all data import and export operations

**Features**:
- Operation tracking (IMPORT, EXPORT)
- Status workflow (INITIATED, IN_PROGRESS, COMPLETED, FAILED, PARTIALLY_COMPLETED)
- File format support (CSV, Excel, JSON, XML, PDF)
- Processing statistics (total, success, failed, skipped counts)
- Error and warning collection (JSON arrays)
- Duration tracking
- Success rate calculation
- Filter and option tracking
- File size tracking

**Use Cases**:
- Data migration audit
- Export request tracking
- Import error debugging
- Performance monitoring
- User data download compliance (GDPR)

**Admin Features**:
- Color-coded status badges
- Success rate display with color indicators
- Duration display (minutes/seconds)
- Human-readable file size
- Filterable by operation, status, format
- Expandable error/warning details
- Processing statistics dashboard

---

## Database Schema

All log models include:
- Comprehensive indexing for performance
- JSON fields for flexible data storage
- Timestamp fields for temporal queries
- Foreign keys with SET_NULL for data preservation
- Proper db_table names for clarity

### Indexes
- User + timestamp (activity tracking)
- Action + timestamp (action analysis)
- Model + timestamp (model-specific logs)
- Content type + object ID (related object lookup)
- Severity/Status + timestamp (filtering)

---

## Admin Interface Features

### Common Features Across All Logs:
- **Read-only** by default (logs are immutable)
- **Date hierarchy** for time-based navigation
- **Advanced filtering** by multiple dimensions
- **Full-text search** on relevant fields
- **Collapsible sections** for detailed data (JSON, stack traces)
- **Color-coded badges** for status/severity
- **Clickable links** to related objects
- **No add permission** (logs are auto-generated)

### Special Admin Features:

**ActivityLog**:
- Related object auto-linking
- Severity color badges
- Request method/path display

**VerificationLog**:
- Survey quick link
- Time-taken calculation
- Status transition display

**DataChangeLog**:
- Before/after comparison
- Changed fields summary
- Bulk operation indicators

**SystemError**:
- Resolution workflow
- Occurrence tracking
- Stack trace viewer
- Error code indexing

**ImportExportLog**:
- Progress indicators
- Success rate calculation
- File size formatting
- Duration formatting

---

## Frontend Integration

### API Endpoints (to be created)
```
/api/v1/logs/activity/
/api/v1/logs/verification/
/api/v1/logs/data-changes/
/api/v1/logs/system-errors/
/api/v1/logs/import-export/
```

### Frontend Menu Structure
```
Logs & Monitoring
├── Activity Logs (ActivityLog)
├── Verification Logs (VerificationLog)
├── Data Change Logs (DataChangeLog)
├── System Errors (SystemError)
└── Import/Export Logs (ImportExportLog)
```

### Recommended Frontend Features:
1. **Real-time log streaming** (WebSocket)
2. **Advanced filters** (date range, user, action, severity)
3. **Export to CSV/Excel**
4. **Dashboard widgets** (error rate, activity timeline)
5. **Search with highlighting**
6. **Pagination** with infinite scroll
7. **Detail modals** for log inspection
8. **Related object navigation**

---

## Usage Examples

### Creating Activity Logs
```python
from apps.logs.models import ActivityLog

ActivityLog.objects.create(
    user=request.user,
    username=request.user.username,
    action=ActivityLog.Action.CREATE,
    severity=ActivityLog.Severity.INFO,
    description=f"Created new service: {service.name}",
    content_object=service,
    model_name='Service',
    object_repr=str(service),
    ip_address=get_client_ip(request),
    user_agent=request.META.get('HTTP_USER_AGENT', ''),
    request_method=request.method,
    request_path=request.path
)
```

### Creating Verification Logs
```python
from apps.logs.models import VerificationLog

VerificationLog.objects.create(
    survey=survey,
    action=VerificationLog.Action.VERIFIED,
    performed_by=request.user,
    previous_status=survey.verification_status,
    new_status='VERIFIED',
    new_verifier=request.user,
    notes="All data verified successfully"
)
```

### Logging System Errors
```python
from apps.logs.models import SystemError
import traceback

try:
    # Some operation
    pass
except Exception as e:
    SystemError.objects.create(
        severity=SystemError.Severity.ERROR,
        error_type=SystemError.ErrorType.DATABASE,
        error_message=str(e),
        exception_type=type(e).__name__,
        stack_trace=traceback.format_exc(),
        user=request.user if request.user.is_authenticated else None,
        username=request.user.username if request.user.is_authenticated else 'anonymous',
        request_method=request.method,
        request_path=request.path,
        ip_address=get_client_ip(request)
    )
```

---

## Performance Considerations

1. **Indexing**: All timestamp fields are indexed for fast queries
2. **Bulk Operations**: Use `bulk_create()` for high-volume logging
3. **Async Logging**: Consider Celery tasks for non-critical logs
4. **Log Rotation**: Implement archival strategy for old logs
5. **Partitioning**: Consider table partitioning for very large datasets

---

## Security & Compliance

- **Immutable Logs**: Admin interface prevents modification
- **Data Retention**: Configurable retention policies
- **PII Handling**: Sensitive data stored in encrypted JSON fields
- **Access Control**: Only admin users can view logs
- **Audit Trail**: Logs cannot be deleted (only archived)

---

## Maintenance

### Recommended Archival Strategy:
- **Activity Logs**: 90 days hot, 1 year warm, 7 years cold
- **Verification Logs**: 1 year hot, permanent warm
- **Data Change Logs**: 180 days hot, 2 years warm, permanent cold
- **System Errors**: Until resolved + 90 days
- **Import/Export Logs**: 1 year hot, 3 years warm

### Cleanup Commands (to be created):
```bash
python manage.py archive_logs --days=90 --log-type=activity
python manage.py cleanup_resolved_errors --days=90
python manage.py export_logs --start-date=2024-01-01 --end-date=2024-12-31
```
