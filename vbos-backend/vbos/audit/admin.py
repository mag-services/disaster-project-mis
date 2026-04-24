"""
Admin interface for audit logs with CSV/PDF export functionality.
Provides filtering and management of audit trail.
"""
import csv
import io
from datetime import datetime, timedelta
from django.contrib import admin
from django.http import HttpResponse
from django.utils import timezone
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from .models import AuditLog


class AuditLogAdmin(admin.ModelAdmin):
    """Admin interface for viewing and managing audit logs."""
    
    list_display = [
        'timestamp',
        'action',
        'content_type',
        'object_id',
        'field_name',
        'user',
        'acting_organisation',
        'change_description',
    ]
    
    list_filter = [
        'action',
        'content_type',
        'user',
        'acting_organisation',
        'field_name',
        'timestamp',
    ]
    
    search_fields = [
        'object_repr',
        'field_name',
        'old_value',
        'new_value',
        'user__username',
    ]
    
    readonly_fields = [
        'timestamp',
        'action',
        'content_type',
        'object_id',
        'field_name',
        'old_value',
        'new_value',
        'user',
        'acting_organisation',
        'ip_address',
        'user_agent',
        'object_repr',
    ]
    
    date_hierarchy = 'timestamp'
    
    def has_change_permission(self, request):
        """Only authenticated users can access audit logs."""
        return request.user.is_authenticated
    
    def has_view_permission(self, request):
        """Only authenticated users can view audit logs."""
        return request.user.is_authenticated
    
    def has_add_permission(self, request):
        """Prevent manual creation of audit logs."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Prevent modification of audit logs."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of audit logs."""
        return False
    
    def get_queryset(self, request):
        """Filter queryset based on user permissions."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)
    
    def change_description(self, obj):
        """Custom display for change description."""
        if obj.field_name:
            return format_html(
                '<span style="color: #d67721;">{}</span>',
                obj.change_description
            )
        return obj.change_description
    
    def get_actions(self, request):
        """Remove add/edit/delete actions - view only."""
        actions = super().get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions
    
    def export_as_csv(self, request, queryset):
        """Export selected audit logs as CSV."""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename=audit_logs_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv'
        
        writer = csv.writer(response)
        headers = [
            'Timestamp', 'Action', 'Model', 'Object ID', 'Field', 
            'Old Value', 'New Value', 'User', 'IP Address', 'User Agent'
        ]
        writer.writerow(headers)
        
        for obj in queryset:
            row = [
                obj.timestamp.strftime('%Y-%m-%d %H:%M:%S') if obj.timestamp else '',
                obj.get_action_display() if obj.action else '',
                str(obj.content_type) if obj.content_type else '',
                str(obj.object_id) if obj.object_id else '',
                obj.field_name if obj.field_name else '',
                obj.old_value if obj.old_value else '',
                obj.new_value if obj.new_value else '',
                str(obj.user) if obj.user else '',
                str(obj.ip_address) if obj.ip_address else '',
                obj.user_agent if obj.user_agent else '',
            ]
            writer.writerow(row)
        
        return response
    
    def export_as_pdf(self, request, queryset):
        """Export selected audit logs as PDF."""
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
            from reportlab.lib import colors
            from reportlab.lib.units import inch
            from reportlab.pdfgen import canvas
            
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename=audit_logs_{timezone.now().strftime("%Y%m%d_%H%M%S")}.pdf'
            
            # Create PDF
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            
            # Create table data
            data = [['Timestamp', 'Action', 'Model', 'Field', 'Old Value', 'New Value', 'User']]
            for obj in queryset:
                data.append([
                    obj.timestamp.strftime('%Y-%m-%d %H:%M') if obj.timestamp else '',
                    obj.get_action_display() if obj.action else '',
                    str(obj.content_type).split('.')[-1] if obj.content_type else '',
                    obj.field_name if obj.field_name else '',
                    (obj.old_value[:50] + '...' if obj.old_value and len(obj.old_value) > 50 else obj.old_value) if obj.old_value else '',
                    (obj.new_value[:50] + '...' if obj.new_value and len(obj.new_value) > 50 else obj.new_value) if obj.new_value else '',
                    str(obj.user) if obj.user else '',
                ])
            
            # Create table
            table = Table(data, colWidths=[1.5*inch, 1*inch, 1.2*inch, 1*inch, 1.5*inch, 1.2*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), 'CENTER'),
                ('FONTNAME', (0, 0), 'Helvetica'),
                ('FONTSIZE', (0, 0), 8),
                ('BOTTOMPADDING', (0, 0), 12),
            ]))
            
            # Build PDF
            elements = []
            elements.append(table)
            doc.build(elements)
            
            pdf_value = buffer.getvalue()
            buffer.close()
            response.write(pdf_value)
            
            return response
            
        except ImportError:
            # Fallback if reportlab is not available
            return HttpResponse(
                "PDF export requires reportlab. Install with: pip install reportlab",
                status=400,
                content_type='text/plain'
            )
    
    actions = ['export_as_csv', 'export_as_pdf']
    
    export_as_csv.short_description = _("Export selected logs as CSV")
    export_as_pdf.short_description = _("Export selected logs as PDF")


# Register the admin
admin.site.register(AuditLog, AuditLogAdmin)
