from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import transaction
from django.core.exceptions import ValidationError
import json
from .models import Student, Professor, Subject, Enrollment, ActivityLog

def index(request):
    """Main enrollment system page"""
    return render(request, 'index.html')

def get_dashboard_stats(request):
    """Get dashboard statistics"""
    stats = {
        'students': Student.objects.count(),
        'professors': Professor.objects.count(),
        'subjects': Subject.objects.count(),
    }
    return JsonResponse(stats)

def get_activity_log(request):
    """Get recent activity log"""
    activities = ActivityLog.objects.all()[:20]
    activity_data = []
    
    for activity in activities:
        activity_data.append({
            'message': activity.message,
            'time': activity.timestamp.strftime('%m/%d/%Y %I:%M:%S %p')
        })
    
    return JsonResponse({'activities': activity_data})

def log_activity(message):
    """Helper function to log activities"""
    ActivityLog.objects.create(message=message)

# Student Views
def get_students(request):
    """Get all students with their data"""
    students = Student.objects.all()
    student_data = {}
    
    for student in students:
        enrollments = student.enrollments.all()
        subjects = []
        grades = {}
        
        for enrollment in enrollments:
            subject_data = {
                'id': enrollment.subject.subject_code,
                'name': enrollment.subject.name,
                'units': enrollment.subject.units,
                'yearLevel': enrollment.subject.year_level,
                'professor': {
                    'id': enrollment.subject.professor.professor_id,
                    'name': enrollment.subject.professor.name
                } if enrollment.subject.professor else None
            }
            subjects.append(subject_data)
            grades[enrollment.subject.subject_code] = enrollment.grade
        
        student_data[student.student_id] = {
            'id': student.student_id,
            'name': student.name,
            'yearLevel': student.year_level,
            'subjects': subjects,
            'grades': grades
        }
    
    return JsonResponse({'students': student_data})

@csrf_exempt
@require_http_methods(["POST"])
def enroll_student(request):
    """Enroll a new student"""
    try:
        data = json.loads(request.body)
        student_id = data.get('student_id')
        name = data.get('name')
        year_level = int(data.get('year_level'))
        subject_ids = data.get('subject_ids', [])
        
        # Check if student already exists
        if Student.objects.filter(student_id=student_id).exists():
            return JsonResponse({'error': 'A student with this ID already exists.'}, status=400)
        
        # Check subject limit (max 3)
        if len(subject_ids) > 3:
            return JsonResponse({'error': 'Maximum 3 subjects allowed per student.'}, status=400)
        
        with transaction.atomic():
            # Create student
            student = Student.objects.create(
                student_id=student_id,
                name=name,
                year_level=year_level
            )
            
            # Enroll in subjects
            for subject_id in subject_ids:
                try:
                    subject = Subject.objects.get(subject_code=subject_id)
                    Enrollment.objects.create(student=student, subject=subject)
                except Subject.DoesNotExist:
                    continue
            
            # Log activity
            log_activity(f"Student {name} enrolled in Year {year_level}")
            
            return JsonResponse({'success': True, 'message': 'Student enrolled successfully'})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def delete_student(request):
    """Delete a student"""
    try:
        data = json.loads(request.body)
        student_id = data.get('student_id')
        
        student = get_object_or_404(Student, student_id=student_id)
        student_name = student.name
        student.delete()
        
        log_activity(f"Student {student_name} deleted")
        
        return JsonResponse({'success': True, 'message': 'Student deleted successfully'})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def promote_student(request):
    """Promote student to next year"""
    try:
        data = json.loads(request.body)
        student_id = data.get('student_id')
        
        student = get_object_or_404(Student, student_id=student_id)
        
        if student.year_level >= 4:
            return JsonResponse({'error': 'Student is already in final year'}, status=400)
        
        # Check if student can proceed
        progression = student.can_proceed_to_next_year()
        if not progression['can_proceed']:
            return JsonResponse({'error': progression['message']}, status=400)
        
        student.year_level += 1
        student.save()
        
        log_activity(f"{student.name} promoted to Year {student.year_level}")
        
        return JsonResponse({'success': True, 'message': f'Student promoted to Year {student.year_level}'})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

# Professor Views
def get_professors(request):
    """Get all professors with their data"""
    professors = Professor.objects.all()
    professor_data = {}
    
    for professor in professors:
        subjects = []
        for subject in professor.subjects.all():
            subjects.append({
                'id': subject.subject_code,
                'name': subject.name,
                'units': subject.units,
                'yearLevel': subject.year_level
            })
        
        professor_data[professor.professor_id] = {
            'id': professor.professor_id,
            'name': professor.name,
            'department': professor.department,
            'subjects': subjects
        }
    
    return JsonResponse({'professors': professor_data})

@csrf_exempt
@require_http_methods(["POST"])
def add_professor(request):
    """Add a new professor"""
    try:
        data = json.loads(request.body)
        professor_id = data.get('professor_id')
        name = data.get('name')
        department = data.get('department')
        subject_ids = data.get('subject_ids', [])
        
        # Check if professor already exists
        if Professor.objects.filter(professor_id=professor_id).exists():
            return JsonResponse({'error': 'A professor with this ID already exists.'}, status=400)
        
        with transaction.atomic():
            # Create professor
            professor = Professor.objects.create(
                professor_id=professor_id,
                name=name,
                department=department
            )
            
            # Assign subjects
            for subject_id in subject_ids:
                try:
                    subject = Subject.objects.get(subject_code=subject_id, professor__isnull=True)
                    subject.professor = professor
                    subject.save()
                except Subject.DoesNotExist:
                    continue
            
            # Log activity
            log_activity(f"Professor {name} added to department {department}")
            
            return JsonResponse({'success': True, 'message': 'Professor added successfully'})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def delete_professor(request):
    """Delete a professor"""
    try:
        data = json.loads(request.body)
        professor_id = data.get('professor_id')
        
        professor = get_object_or_404(Professor, professor_id=professor_id)
        professor_name = professor.name
        
        # Remove professor from subjects
        professor.subjects.update(professor=None)
        professor.delete()
        
        log_activity(f"Professor {professor_name} deleted")
        
        return JsonResponse({'success': True, 'message': 'Professor deleted successfully'})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

# Subject Views
def get_subjects(request):
    """Get all subjects with their data"""
    subjects = Subject.objects.all()
    subject_data = {}
    
    for subject in subjects:
        subject_data[subject.subject_code] = {
            'id': subject.subject_code,
            'name': subject.name,
            'units': subject.units,
            'yearLevel': subject.year_level,
            'professor': {
                'id': subject.professor.professor_id,
                'name': subject.professor.name
            } if subject.professor else None
        }
    
    return JsonResponse({'subjects': subject_data})

@csrf_exempt
@require_http_methods(["POST"])
def add_subject(request):
    """Add a new subject"""
    try:
        data = json.loads(request.body)
        subject_code = data.get('subject_code')
        name = data.get('name')
        units = int(data.get('units'))
        year_level = int(data.get('year_level'))
        professor_id = data.get('professor_id')
        
        # Check if subject already exists
        if Subject.objects.filter(subject_code=subject_code).exists():
            return JsonResponse({'error': 'A subject with this code already exists.'}, status=400)
        
        # Create subject
        subject = Subject.objects.create(
            subject_code=subject_code,
            name=name,
            units=units,
            year_level=year_level
        )
        
        # Assign professor if provided
        if professor_id:
            try:
                professor = Professor.objects.get(professor_id=professor_id)
                subject.professor = professor
                subject.save()
            except Professor.DoesNotExist:
                pass
        
        # Log activity
        log_activity(f"Subject {name} added for Year {year_level}")
        
        return JsonResponse({'success': True, 'message': 'Subject added successfully'})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def delete_subject(request):
    """Delete a subject"""
    try:
        data = json.loads(request.body)
        subject_code = data.get('subject_code')
        
        subject = get_object_or_404(Subject, subject_code=subject_code)
        subject_name = subject.name
        subject.delete()
        
        log_activity(f"Subject {subject_name} deleted")
        
        return JsonResponse({'success': True, 'message': 'Subject deleted successfully'})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def assign_professor_to_subject(request):
    """Assign or remove professor from subject"""
    try:
        data = json.loads(request.body)
        subject_code = data.get('subject_code')
        professor_id = data.get('professor_id')  # Can be None to remove professor
        
        subject = get_object_or_404(Subject, subject_code=subject_code)
        
        if professor_id:
            professor = get_object_or_404(Professor, professor_id=professor_id)
            subject.professor = professor
            log_activity(f"{professor.name} assigned to {subject.name}")
        else:
            if subject.professor:
                log_activity(f"Professor removed from {subject.name}")
            subject.professor = None
        
        subject.save()
        
        return JsonResponse({'success': True, 'message': 'Professor assignment updated'})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

# Grade Views
@csrf_exempt
@require_http_methods(["POST"])
def enter_grade(request):
    """Enter or update a grade for a student in a subject"""
    try:
        data = json.loads(request.body)
        student_id = data.get('student_id')
        subject_code = data.get('subject_code')
        grade = float(data.get('grade'))
        
        if not (0 <= grade <= 100):
            return JsonResponse({'error': 'Grade must be between 0 and 100'}, status=400)
        
        enrollment = get_object_or_404(
            Enrollment, 
            student__student_id=student_id, 
            subject__subject_code=subject_code
        )
        
        enrollment.grade = grade
        enrollment.save()
        
        log_activity(f"Grade for {enrollment.student.name} in {enrollment.subject.name} set to {grade}")
        
        return JsonResponse({'success': True, 'message': 'Grade saved successfully'})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

def get_student_details(request, student_id):
    """Get detailed information about a specific student"""
    try:
        student = get_object_or_404(Student, student_id=student_id)
        enrollments = student.enrollments.all()
        
        subjects = []
        for enrollment in enrollments:
            subjects.append({
                'subject': {
                    'id': enrollment.subject.subject_code,
                    'name': enrollment.subject.name
                },
                'professor': {
                    'name': enrollment.subject.professor.name
                } if enrollment.subject.professor else None,
                'grade': enrollment.grade,
                'status': enrollment.get_status()
            })
        
        progression = student.can_proceed_to_next_year()
        
        data = {
            'id': student.student_id,
            'name': student.name,
            'year_level': student.year_level,
            'status': student.get_overall_status(),
            'gpa': student.get_gpa(),
            'subjects': subjects,
            'progression': progression
        }
        
        return JsonResponse(data)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

def get_available_subjects(request):
    """Get subjects available for a specific year level"""
    year_level = request.GET.get('year_level')
    if not year_level:
        return JsonResponse({'error': 'Year level is required'}, status=400)
    
    try:
        year_level = int(year_level)
        subjects = Subject.objects.filter(year_level=year_level)
        
        subject_data = []
        for subject in subjects:
            subject_data.append({
                'id': subject.subject_code,
                'name': subject.name,
                'units': subject.units,
                'professor': subject.professor.name if subject.professor else 'Not assigned'
            })
        
        return JsonResponse({'subjects': subject_data})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

def get_unassigned_subjects(request):
    """Get subjects that don't have a professor assigned"""
    subjects = Subject.objects.filter(professor__isnull=True)
    
    subject_data = []
    for subject in subjects:
        subject_data.append({
            'id': subject.subject_code,
            'name': subject.name,
            'year_level': subject.year_level,
            'units': subject.units
        })
    
    return JsonResponse({'subjects': subject_data})
