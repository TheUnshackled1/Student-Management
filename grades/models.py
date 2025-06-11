from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import json

class Professor(models.Model):
    professor_id = models.CharField(max_length=20, unique=True, primary_key=True)
    name = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.department})"
    
    def get_subjects_count(self):
        return self.subjects.count()

class Subject(models.Model):
    YEAR_CHOICES = [
        (1, 'Year 1'),
        (2, 'Year 2'),
        (3, 'Year 3'),
        (4, 'Year 4'),
    ]
    
    subject_code = models.CharField(max_length=20, unique=True, primary_key=True)
    name = models.CharField(max_length=100)
    units = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    year_level = models.IntegerField(choices=YEAR_CHOICES)
    professor = models.ForeignKey(Professor, on_delete=models.SET_NULL, null=True, blank=True, related_name='subjects')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.subject_code} - {self.name}"
    
    def get_enrolled_students_count(self):
        return self.enrollments.count()

class Student(models.Model):
    YEAR_CHOICES = [
        (1, 'Year 1'),
        (2, 'Year 2'),
        (3, 'Year 3'),
        (4, 'Year 4'),
    ]
    
    STATUS_CHOICES = [
        ('PASSED', 'Passed'),
        ('FAILED', 'Failed'),
        ('INCOMPLETE', 'Incomplete'),
    ]
    
    student_id = models.CharField(max_length=20, unique=True, primary_key=True)
    name = models.CharField(max_length=100)
    year_level = models.IntegerField(choices=YEAR_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.student_id} - {self.name}"
    
    def get_enrolled_subjects_count(self):
        return self.enrollments.count()
    
    def get_gpa(self):
        enrollments = self.enrollments.filter(grade__isnull=False)
        if not enrollments.exists():
            return 0.0
        
        total_grade = sum(enrollment.grade for enrollment in enrollments)
        return round(total_grade / enrollments.count(), 2)
    
    def get_overall_status(self):
        enrollments = self.enrollments.all()
        if not enrollments.exists():
            return "No subjects enrolled"
        
        # Check if all subjects have grades
        ungraded = enrollments.filter(grade__isnull=True)
        if ungraded.exists():
            return "INCOMPLETE"
        
        # Check if all subjects are passed (grade >= 75)
        failed = enrollments.filter(grade__lt=75)
        if failed.exists():
            return "FAILED"
        
        return "PASSED"
    
    def can_proceed_to_next_year(self):
        if self.year_level >= 4:
            return {"can_proceed": False, "message": "Already in final year"}
        
        enrollments = self.enrollments.all()
        if not enrollments.exists():
            return {"can_proceed": False, "message": "No subjects enrolled"}
        
        # Check if all subjects have grades
        ungraded = enrollments.filter(grade__isnull=True)
        if ungraded.exists():
            return {"can_proceed": False, "message": "Not all subjects have been graded"}
        
        # Check for failed subjects
        failed = enrollments.filter(grade__lt=75)
        if failed.exists():
            failed_subjects = [enrollment.subject.name for enrollment in failed]
            return {
                "can_proceed": False, 
                "message": f"Failed subjects: {', '.join(failed_subjects)}"
            }
        
        return {
            "can_proceed": True, 
            "message": f"Can proceed to Year {self.year_level + 1}"
        }

class Enrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='enrollments')
    grade = models.FloatField(
        null=True, 
        blank=True, 
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('student', 'subject')
    
    def __str__(self):
        return f"{self.student.name} - {self.subject.name}"
    
    def get_status(self):
        if self.grade is None:
            return "PENDING"
        return "PASSED" if self.grade >= 75 else "FAILED"

class ActivityLog(models.Model):
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')} - {self.message}"
