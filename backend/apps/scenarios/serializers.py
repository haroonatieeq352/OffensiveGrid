from rest_framework import serializers
from .models import Category, Difficulty, Scenario, Flag, ScenarioFile


class CategorySerializer(serializers.ModelSerializer):
    scenario_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'scenario_count']


class DifficultySerializer(serializers.ModelSerializer):
    level_value = serializers.IntegerField(min_value=0, max_value=1000)
    scenario_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Difficulty
        fields = ['id', 'name', 'level_value', 'color_code', 'scenario_count']


class ScenarioFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScenarioFile
        fields = ['id', 'file_name', 'file_path', 'file_size_bytes', 'file_type', 'is_public', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class FlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flag
        fields = ['id', 'flag_value', 'is_case_sensitive', 'is_regex']


class ScenarioListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    difficulty = DifficultySerializer(read_only=True)
    is_solved = serializers.BooleanField(read_only=True, default=False)
    attempts_used = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Scenario
        fields = [
            'id',
            'title',
            'slug',
            'description',
            'category',
            'difficulty',
            'points',
            'max_attempts',
            'is_paid',
            'status',
            'is_solved',
            'attempts_used',
            'created_at',
        ]


class ScenarioDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    difficulty = DifficultySerializer(read_only=True)
    files = ScenarioFileSerializer(many=True, read_only=True)
    is_solved = serializers.BooleanField(read_only=True, default=False)
    attempts_used = serializers.IntegerField(read_only=True, default=0)
    is_locked = serializers.SerializerMethodField()

    class Meta:
        model = Scenario
        fields = [
            'id',
            'title',
            'slug',
            'description',
            'instructions',
            'category',
            'difficulty',
            'points',
            'target_url',
            'max_attempts',
            'time_limit_minutes',
            'is_paid',
            'is_locked',
            'status',
            'files',
            'is_solved',
            'attempts_used',
            'created_at',
        ]

    def get_is_locked(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return obj.is_paid

        is_staff = user.is_staff or user.is_superuser or user.roles.filter(name__in=['ADMIN', 'SUPER_ADMIN']).exists()
        has_access = is_staff or getattr(user, 'has_paid_access', False)
        return obj.is_paid and not has_access

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        
        is_staff = user and user.is_authenticated and (user.is_staff or user.is_superuser or user.roles.filter(name__in=['ADMIN', 'SUPER_ADMIN']).exists())
        has_access = is_staff or (user and user.is_authenticated and getattr(user, 'has_paid_access', False))

        if instance.is_paid and not has_access:
            data['is_locked'] = True
            data['instructions'] = "🔒 This challenge requires an OffensiveGrid Pro Subscription. Please upgrade your account to access the mission briefing, attachments, and sandbox environment."
            data['target_url'] = None
            data['files'] = []
        else:
            data['is_locked'] = False

        return data


class AdminScenarioSerializer(serializers.ModelSerializer):
    category_details = CategorySerializer(source='category', read_only=True)
    difficulty_details = DifficultySerializer(source='difficulty', read_only=True)
    flags = FlagSerializer(many=True, required=False, read_only=True)
    files = ScenarioFileSerializer(many=True, read_only=True)
    flag = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=255)
    points = serializers.IntegerField(min_value=0, max_value=10000)
    max_attempts = serializers.IntegerField(min_value=0, max_value=10000)
    time_limit_minutes = serializers.IntegerField(min_value=0, max_value=43200, required=False, default=0)
    slug = serializers.SlugField(required=False, max_length=255)

    class Meta:
        model = Scenario
        fields = [
            'id',
            'title',
            'slug',
            'description',
            'instructions',
            'category',
            'category_details',
            'difficulty',
            'difficulty_details',
            'points',
            'target_url',
            'max_attempts',
            'time_limit_minutes',
            'is_paid',
            'status',
            'flags',
            'files',
            'flag',
            'created_at',
            'updated_at',
        ]

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        # Seamlessly accept either category or category_id
        if 'category_id' in data and 'category' not in data:
            data['category'] = data.get('category_id')
        # Seamlessly accept either difficulty or difficulty_id
        if 'difficulty_id' in data and 'difficulty' not in data:
            data['difficulty'] = data.get('difficulty_id')
        if 'time_limit_minutes' not in data or data.get('time_limit_minutes') is None:
            data['time_limit_minutes'] = 0
        return super().to_internal_value(data)

    def validate(self, attrs):
        # Auto-generate unique slug from title if not provided or empty
        if not attrs.get('slug') and attrs.get('title'):
            from django.utils.text import slugify
            base_slug = slugify(attrs['title']) or 'scenario'
            slug = base_slug
            counter = 1
            current_pk = self.instance.pk if self.instance else None
            while Scenario.objects.filter(slug=slug).exclude(pk=current_pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            attrs['slug'] = slug
        return attrs

    def create(self, validated_data):
        flag_val = validated_data.pop('flag', None)
        scenario = super().create(validated_data)
        if flag_val:
            Flag.objects.create(
                scenario=scenario,
                flag_value=flag_val.strip(),
                is_case_sensitive=True,
                is_regex=False
            )
        return scenario

    def update(self, instance, validated_data):
        flag_val = validated_data.pop('flag', None)
        scenario = super().update(instance, validated_data)
        if flag_val:
            Flag.objects.filter(scenario=scenario).delete()
            Flag.objects.create(
                scenario=scenario,
                flag_value=flag_val.strip(),
                is_case_sensitive=True,
                is_regex=False
            )
        return scenario
