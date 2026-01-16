from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import HelpCategory, HelpArticle, FAQ, SupportTicket, SupportTicketReply
from .serializers import (
    HelpCategorySerializer, HelpArticleSerializer, HelpArticleListSerializer,
    FAQSerializer, SupportTicketSerializer, SupportTicketListSerializer,
    SupportTicketReplySerializer
)


class HelpCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for help categories
    """
    queryset = HelpCategory.objects.filter(is_active=True)
    serializer_class = HelpCategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'

    @action(detail=True, methods=['get'])
    def articles(self, request, slug=None):
        """Get all articles in this category"""
        category = self.get_object()
        articles = category.articles.filter(status='published')
        serializer = HelpArticleListSerializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def faqs(self, request, slug=None):
        """Get all FAQs in this category"""
        category = self.get_object()
        faqs = category.faqs.filter(is_active=True)
        serializer = FAQSerializer(faqs, many=True)
        return Response(serializer.data)


class HelpArticleViewSet(viewsets.ModelViewSet):
    """
    API endpoint for help articles
    """
    queryset = HelpArticle.objects.filter(status='published')
    serializer_class = HelpArticleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status', 'is_featured']
    search_fields = ['title', 'summary', 'content', 'tags']
    ordering_fields = ['created_at', 'views_count', 'order']
    ordering = ['category', 'order', 'title']

    def get_serializer_class(self):
        if self.action == 'list':
            return HelpArticleListSerializer
        return HelpArticleSerializer

    def retrieve(self, request, *args, **kwargs):
        """Increment view count when article is retrieved"""
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured articles"""
        articles = self.queryset.filter(is_featured=True)
        serializer = HelpArticleListSerializer(articles, many=True)
        return Response(serializer.data)


class FAQViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for FAQs
    """
    queryset = FAQ.objects.filter(is_active=True)
    serializer_class = FAQSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category']
    search_fields = ['question', 'answer']

    def retrieve(self, request, *args, **kwargs):
        """Increment view count when FAQ is retrieved"""
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class SupportTicketViewSet(viewsets.ModelViewSet):
    """
    API endpoint for support tickets
    """
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'category']
    search_fields = ['subject', 'description']
    ordering_fields = ['created_at', 'updated_at', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        """Users can only see their own tickets unless they're staff"""
        user = self.request.user
        if user.is_staff or user.role in ['admin', 'data_manager']:
            return SupportTicket.objects.all()
        return SupportTicket.objects.filter(user=user)

    def get_serializer_class(self):
        if self.action == 'list':
            return SupportTicketListSerializer
        return SupportTicketSerializer

    def perform_create(self, serializer):
        """Set the user when creating a ticket"""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def add_reply(self, request, pk=None):
        """Add a reply to a ticket"""
        ticket = self.get_object()
        message = request.data.get('message')
        
        if not message:
            return Response(
                {'error': 'Message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reply = SupportTicketReply.objects.create(
            ticket=ticket,
            user=request.user,
            message=message,
            is_staff_reply=request.user.is_staff or request.user.role in ['admin', 'data_manager']
        )
        
        serializer = SupportTicketReplySerializer(reply)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close a ticket"""
        ticket = self.get_object()
        ticket.status = 'closed'
        ticket.resolved_at = timezone.now()
        ticket.save()
        
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        """Reopen a closed ticket"""
        ticket = self.get_object()
        ticket.status = 'open'
        ticket.resolved_at = None
        ticket.save()
        
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)
