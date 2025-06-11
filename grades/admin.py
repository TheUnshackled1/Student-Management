from django.contrib import admin
from .models import Student, Professor, Subject, Enrollment, ActivityLog

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'name', 'year_level', 'get_enrolled_subjects_count', 'get_gpa', 'get_overall_status')
    list_filter = ('year_level', 'created_at')
    search_fields = ('student_id', 'name')
    readonly_fields = ('created_at',)

@admin.register(Professor)
class ProfessorAdmin(admin.ModelAdmin):
    list_display = ('professor_id', 'name', 'department', 'get_subjects_count')
    list_filter = ('department', 'created_at')
    search_fields = ('professor_id', 'name', 'department')
    readonly_fields = ('created_at',)

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('subject_code', 'name', 'units', 'year_level', 'professor', 'get_enrolled_students_count')
    list_filter = ('year_level', 'units', 'professor', 'created_at')
    search_fields = ('subject_code', 'name')
    readonly_fields = ('created_at',)

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'grade', 'get_status', 'enrolled_at')
    list_filter = ('subject__year_level', 'enrolled_at', 'grade')
    search_fields = ('student__name', 'subject__name')
    readonly_fields = ('enrolled_at',)

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('message', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('message',)
    readonly_fields = ('timestamp',)
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
