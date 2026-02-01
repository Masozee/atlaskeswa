from django.db import models
from django.core.validators import MinValueValidator


class MainTypeOfCare(models.Model):
    """MTC - Main Type of Care classification from DESDE-LTC"""

    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )

    # DESDE-LTC Enhanced Fields
    is_healthcare = models.BooleanField(
        default=True,
        help_text='True for healthcare facilities (R/D/O/A/I), False for non-healthcare (SR/SD/SO/SA/SI)'
    )
    service_delivery_type = models.CharField(
        max_length=20,
        choices=[
            ('RESIDENTIAL', 'Residential'),
            ('DAY_CARE', 'Day Care'),
            ('OUTPATIENT', 'Outpatient'),
            ('ACCESSIBILITY', 'Accessibility'),
            ('INFORMATION', 'Information'),
        ],
        null=True,
        blank=True,
        help_text='Main service delivery mode'
    )
    level = models.IntegerField(
        default=0,
        help_text='Hierarchy depth: 0=root, 1=first level, 2=second level, etc.'
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mtc_classifications'
        ordering = ['code']
        verbose_name = 'Main Type of Care'
        verbose_name_plural = 'Main Types of Care'
        indexes = [
            models.Index(fields=['is_healthcare', 'is_active']),
            models.Index(fields=['service_delivery_type', 'is_active']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    def get_hierarchy_level(self):
        """Calculate hierarchy level from parent chain"""
        level = 0
        current = self.parent
        while current:
            level += 1
            current = current.parent
        return level


class BasicStableInputsOfCare(models.Model):
    """BSIC - Basic Stable Inputs of Care classification from DESDE-LTC"""

    code = models.CharField(max_length=10, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bsic_classifications'
        ordering = ['code']
        verbose_name = 'Basic Stable Inputs of Care'
        verbose_name_plural = 'Basic Stable Inputs of Care'

    def __str__(self):
        return f"{self.code} - {self.name}"


class TargetPopulation(models.Model):
    """Target population categories for mental health services"""

    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'target_populations'
        ordering = ['name']

    def __str__(self):
        return self.name


class ServiceType(models.Model):
    """Service type categories"""

    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'service_types'
        ordering = ['name']

    def __str__(self):
        return self.name


class Service(models.Model):
    """Mental Health Service Directory"""

    # Basic Information
    name = models.CharField(max_length=300, db_index=True)
    description = models.TextField(blank=True)

    # DESDE-LTC Classifications
    mtc = models.ForeignKey(
        MainTypeOfCare,
        on_delete=models.PROTECT,
        related_name='services'
    )
    bsic = models.ForeignKey(
        BasicStableInputsOfCare,
        on_delete=models.PROTECT,
        related_name='services'
    )

    # Service Details
    service_type = models.ForeignKey(
        ServiceType,
        on_delete=models.PROTECT,
        related_name='services'
    )
    target_populations = models.ManyToManyField(
        TargetPopulation,
        related_name='services',
        blank=True
    )

    # Contact Information
    phone_number = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)

    # Location
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, db_index=True)
    province = models.CharField(max_length=100, db_index=True)
    postal_code = models.CharField(max_length=10, blank=True)
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        null=True,
        blank=True
    )
    longitude = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        null=True,
        blank=True
    )

    # Capacity and Staffing
    bed_capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    staff_count = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    psychiatrist_count = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    psychologist_count = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    nurse_count = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    social_worker_count = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )

    # Operating Information
    operating_hours = models.TextField(blank=True)
    is_24_7 = models.BooleanField(default=False)
    accepts_emergency = models.BooleanField(default=False)

    # Insurance and Funding
    accepts_bpjs = models.BooleanField(default=False)
    accepts_private_insurance = models.BooleanField(default=False)
    funding_sources = models.TextField(blank=True, help_text="Comma-separated funding sources")

    # Status and Metadata
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_services'
    )
    verified_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_services'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'services'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['mtc', 'bsic']),
            models.Index(fields=['city', 'province']),
            models.Index(fields=['is_verified', 'is_active']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.name} ({self.city})"

    @property
    def total_professional_staff(self):
        """Total count of professional staff"""
        return (
            self.psychiatrist_count +
            self.psychologist_count +
            self.nurse_count +
            self.social_worker_count
        )
