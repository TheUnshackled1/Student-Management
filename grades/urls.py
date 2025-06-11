from django.urls import path
from . import views

app_name = 'enrollment'

urlpatterns = [
    # Main page
    path('', views.index, name='index'),
    
    # Dashboard
    path('api/dashboard/stats/', views.get_dashboard_stats, name='dashboard_stats'),
    path('api/activity-log/', views.get_activity_log, name='activity_log'),
    
    # Students
    path('api/students/', views.get_students, name='get_students'),
    path('api/students/enroll/', views.enroll_student, name='enroll_student'),
    path('api/students/delete/', views.delete_student, name='delete_student'),
    path('api/students/promote/', views.promote_student, name='promote_student'),
    path('api/students/<str:student_id>/', views.get_student_details, name='student_details'),
    
    # Professors
    path('api/professors/', views.get_professors, name='get_professors'),
    path('api/professors/add/', views.add_professor, name='add_professor'),
    path('api/professors/delete/', views.delete_professor, name='delete_professor'),
    
    # Subjects
    path('api/subjects/', views.get_subjects, name='get_subjects'),
    path('api/subjects/add/', views.add_subject, name='add_subject'),
    path('api/subjects/delete/', views.delete_subject, name='delete_subject'),
    path('api/subjects/assign-professor/', views.assign_professor_to_subject, name='assign_professor'),
    path('api/subjects/available/', views.get_available_subjects, name='available_subjects'),
    path('api/subjects/unassigned/', views.get_unassigned_subjects, name='unassigned_subjects'),
    
    # Grades
    path('api/grades/enter/', views.enter_grade, name='enter_grade'),
]
