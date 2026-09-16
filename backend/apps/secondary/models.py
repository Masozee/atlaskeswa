from django.db import models


class SecondaryDataset(models.Model):
    """One published table of secondary data about kecamatan.

    "Data sekunder" arrives as a spreadsheet from another agency — a Dinkes
    morbidity table, a BPS population series — rather than from the survey. Each
    import becomes a dataset so a later edition does not overwrite the one
    before it, and so the frontend can say where a number came from.
    """

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    source = models.CharField(
        max_length=255, blank=True,
        help_text='Agency the table came from, e.g. "Dinkes Kabupaten Kebumen"'
    )
    # Nullable: a table often arrives with no period stated, and inventing one
    # would make two editions look like different years.
    year = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    is_published = models.BooleanField(
        default=True, db_index=True,
        help_text='Visible on the public kecamatan pages and the map'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'secondary_datasets'
        ordering = ['-year', 'name']

    def __str__(self):
        return f'{self.name} ({self.year})' if self.year else self.name


class SecondaryIndicator(models.Model):
    """One column group of a dataset — a diagnosis, a population count.

    `is_population` marks the denominator: rates per 10,000 divide by it, so a
    dataset without one can report counts but no rates. `is_aggregate` marks a
    column the source already totalled (ODGJ Berat SPM), which must stay out of
    any sum the app computes itself or it double-counts.
    """

    dataset = models.ForeignKey(
        SecondaryDataset, on_delete=models.CASCADE, related_name='indicators'
    )
    code = models.SlugField(max_length=120)
    name = models.CharField(max_length=255)
    unit = models.CharField(max_length=60, blank=True, default='jiwa')
    order = models.PositiveIntegerField(default=0)
    is_population = models.BooleanField(default=False)
    is_aggregate = models.BooleanField(default=False)

    class Meta:
        db_table = 'secondary_indicators'
        ordering = ['dataset', 'order', 'name']
        unique_together = [['dataset', 'code']]

    def __str__(self):
        return f'{self.dataset.slug}/{self.code}'


class KecamatanIndicatorValue(models.Model):
    """One indicator's value for one kecamatan.

    Split by sex because every table so far arrives that way; `value_total` is
    stored rather than summed on read, since a source's own total occasionally
    disagrees with its parts and the published figure is the one to show.
    """

    indicator = models.ForeignKey(
        SecondaryIndicator, on_delete=models.CASCADE, related_name='values'
    )
    kecamatan = models.ForeignKey(
        'survey.GeographicUnit',
        on_delete=models.CASCADE,
        related_name='secondary_values',
        limit_choices_to={'level': 'KECAMATAN'},
    )
    value_male = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    value_female = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    value_total = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'secondary_kecamatan_values'
        ordering = ['indicator', 'kecamatan__name']
        unique_together = [['indicator', 'kecamatan']]

    def __str__(self):
        return f'{self.indicator.code} @ {self.kecamatan.name}: {self.value_total}'
