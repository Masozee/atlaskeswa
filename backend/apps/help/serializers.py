from rest_framework import serializers
from .models import HelpCategory, HelpArticle, FAQ, SupportTicket, SupportTicketReply


class HelpCategorySerializer(serializers.ModelSerializer):
    articles_count = serializers.SerializerMethodField()
    faqs_count = serializers.SerializerMethodField()

    class Meta:
        model = HelpCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'order', 'is_active',
                  'articles_count', 'faqs_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_articles_count(self, obj):
        return obj.articles.filter(status='published').count()

    def get_faqs_count(self, obj):
        return obj.faqs.filter(is_active=True).count()


class HelpArticleSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_name = serializers.CharField(source='author.full_name', read_only=True)

    class Meta:
        model = HelpArticle
        fields = ['id', 'category', 'category_name', 'title', 'slug', 'summary',
                  'content', 'status', 'order', 'views_count', 'is_featured',
                  'author', 'author_name', 'tags', 'created_at', 'updated_at']
        read_only_fields = ['id', 'views_count', 'created_at', 'updated_at']


class HelpArticleListSerializer(serializers.ModelSerializer):
    """Lighter serializer for listing articles"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_name = serializers.CharField(source='author.full_name', read_only=True)

    class Meta:
        model = HelpArticle
        fields = ['id', 'category', 'category_name', 'title', 'slug', 'summary',
                  'status', 'is_featured', 'author_name', 'views_count', 'created_at']
        read_only_fields = ['id', 'views_count', 'created_at']


class FAQSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)

    class Meta:
        model = FAQ
        fields = ['id', 'question', 'answer', 'category', 'category_name',
                  'order', 'views_count', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'views_count', 'created_at', 'updated_at']


class SupportTicketReplySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = SupportTicketReply
        fields = ['id', 'ticket', 'user', 'user_name', 'user_email', 'message',
                  'is_staff_reply', 'created_at']
        read_only_fields = ['id', 'user', 'is_staff_reply', 'created_at']


class SupportTicketSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, allow_null=True)
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    replies = SupportTicketReplySerializer(many=True, read_only=True)
    replies_count = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = ['id', 'user', 'user_name', 'user_email', 'subject', 'description',
                  'status', 'priority', 'assigned_to', 'assigned_to_name', 'category',
                  'category_name', 'replies', 'replies_count', 'created_at', 'updated_at',
                  'resolved_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_replies_count(self, obj):
        return obj.replies.count()


class SupportTicketListSerializer(serializers.ModelSerializer):
    """Lighter serializer for listing tickets"""
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, allow_null=True)
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    replies_count = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = ['id', 'user_name', 'subject', 'status', 'priority', 'assigned_to_name',
                  'category_name', 'replies_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_replies_count(self, obj):
        return obj.replies.count()
