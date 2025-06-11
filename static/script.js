// Data storage
const data = {
    students: {},
    professors: {},
    subjects: {},
    activityLog: []
};

// Constants
const MAX_SUBJECTS_PER_STUDENT = 3;
const PASSING_GRADE = 75;

// Classes
class Student {
    constructor(id, name, yearLevel) {
        this.id = id;
        this.name = name;
        this.yearLevel = parseInt(yearLevel);
        this.subjects = [];
        this.grades = {};
    }
    
    enroll(subject) {
        if (this.subjects.length >= MAX_SUBJECTS_PER_STUDENT) {
            return false;
        }
        
        this.subjects.push(subject);
        this.grades[subject.id] = null;
        return true;
    }
    
    setGrade(subjectId, grade) {
        if (subjectId in this.grades) {
            this.grades[subjectId] = parseFloat(grade);
            return true;
        }
        return false;
    }
    
    getOverallStatus() {
        if (this.subjects.length === 0) {
            return "No subjects enrolled";
        }
        
        const allGraded = Object.values(this.grades).every(grade => grade !== null);
        const allPassed = Object.values(this.grades).every(grade => grade === null || grade >= PASSING_GRADE);
        
        if (!allGraded) {
            return "INCOMPLETE";
        } else if (allPassed) {
            return "PASSED";
        } else {
            return "FAILED";
        }
    }
    
    getGPA() {
        if (this.subjects.length === 0) {
            return 0;
        }
        
        let totalGrade = 0;
        let gradedSubjects = 0;
        
        for (const subjectId in this.grades) {
            const grade = this.grades[subjectId];
            if (grade !== null) {
                totalGrade += grade;
                gradedSubjects++;
            }
        }
        
        if (gradedSubjects === 0) {
            return 0;
        }
        
        return (totalGrade / gradedSubjects).toFixed(2);
    }
    
    canProceedToNextYear() {
        if (this.yearLevel >= 4) {
            return { canProceed: false, message: "Already in final year" };
        }
        
        if (this.subjects.length === 0) {
            return { canProceed: false, message: "No subjects enrolled" };
        }
        
        const allGraded = Object.values(this.grades).every(grade => grade !== null);
        if (!allGraded) {
            return { canProceed: false, message: "Not all subjects have been graded" };
        }
        
        const failedSubjects = [];
        for (const subject of this.subjects) {
            const grade = this.grades[subject.id];
            if (grade < PASSING_GRADE) {
                failedSubjects.push(subject.name);
            }
        }
        
        if (failedSubjects.length > 0) {
            return { 
                canProceed: false, 
                message: `Failed subjects: ${failedSubjects.join(', ')}` 
            };
        }
        
        return { 
            canProceed: true, 
            message: `Can proceed to Year ${this.yearLevel + 1}` 
        };
    }
}

class Professor {
    constructor(id, name, department) {
        this.id = id;
        this.name = name;
        this.department = department;
        this.subjects = [];
    }
    
    assignSubject(subject) {
        this.subjects.push(subject);
    }
}

class Subject {
    constructor(id, name, units, yearLevel) {
        this.id = id;
        this.name = name;
        this.units = parseInt(units);
        this.yearLevel = parseInt(yearLevel);
        this.professor = null;
    }
    
    assignProfessor(professor) {
        this.professor = professor;
        professor.assignSubject(this);
    }
    
    getEnrolledStudents() {
        return Object.values(data.students).filter(student => 
            student.subjects.some(s => s.id === this.id)
        );
    }
}

// DOM Elements
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('nav a');

// Modals
const enrollStudentModal = document.getElementById('enroll-student-modal');
const addProfessorModal = document.getElementById('add-professor-modal');
const addSubjectModal = document.getElementById('add-subject-modal');
const studentDetailsModal = document.getElementById('student-details-modal');
const enterGradeModal = document.getElementById('enter-grade-modal');

// Forms
const enrollStudentForm = document.getElementById('enroll-student-form');
const addProfessorForm = document.getElementById('add-professor-form');
const addSubjectForm = document.getElementById('add-subject-form');
const enterGradeForm = document.getElementById('enter-grade-form');

// Tables
const studentsTableBody = document.getElementById('students-table-body');
const professorsTableBody = document.getElementById('professors-table-body');
const subjectsTableBody = document.getElementById('subjects-table-body');
const studentSubjectsBody = document.getElementById('student-subjects-body');

// Dashboard elements
const studentCount = document.getElementById('student-count');
const professorCount = document.getElementById('professor-count');
const subjectCount = document.getElementById('subject-count');
const activityLog = document.getElementById('activity-log');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            sections.forEach(section => {
                section.classList.remove('active-section');
                if (section.id === targetSection) {
                    section.classList.add('active-section');
                }
            });
        });
    });

    
    // Quick action buttons
    document.getElementById('enroll-student-btn').addEventListener('click', () => openEnrollStudentModal());
    document.getElementById('add-professor-btn').addEventListener('click', () => openAddProfessorModal());
    document.getElementById('add-subject-btn').addEventListener('click', () => openAddSubjectModal());
    document.getElementById('view-grades-btn').addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        document.querySelector('nav a[data-section="students"]').classList.add('active');
        
        sections.forEach(section => {
            section.classList.remove('active-section');
            if (section.id === 'students') {
                section.classList.add('active-section');
            }
        });
    });
    
    // Section action buttons
    document.getElementById('add-student-btn').addEventListener('click', () => openEnrollStudentModal());
    document.getElementById('add-professor-btn-2').addEventListener('click', () => openAddProfessorModal());
    document.getElementById('add-subject-btn-2').addEventListener('click', () => openAddSubjectModal());
    
    // Modal close buttons
    document.querySelectorAll('.close, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            enrollStudentModal.style.display = 'none';
            addProfessorModal.style.display = 'none';
            addSubjectModal.style.display = 'none';
            studentDetailsModal.style.display = 'none';
            enterGradeModal.style.display = 'none';
        });
    });
    
    // Form submissions
    enrollStudentForm.addEventListener('submit', handleEnrollStudent);
    addProfessorForm.addEventListener('submit', handleAddProfessor);
    addSubjectForm.addEventListener('submit', handleAddSubject);
    enterGradeForm.addEventListener('submit', handleEnterGrade);
    
    
    // Student year level change
    document.getElementById('student-year').addEventListener('change', updateAvailableSubjects);
    
     // Search and filter
    document.getElementById('student-search').addEventListener('input', filterStudents);
    document.getElementById('year-filter').addEventListener('change', filterStudents);
    document.getElementById('status-filter').addEventListener('change', filterStudents);
    
    document.getElementById('professor-search').addEventListener('input', filterProfessors);
    document.getElementById('department-filter').addEventListener('change', filterProfessors);
    
    document.getElementById('subject-search').addEventListener('input', filterSubjects);
    document.getElementById('subject-year-filter').addEventListener('change', filterSubjects);
    
    // Load sample data
    loadSampleData();
    updateDashboard();
    renderTables();
});

// Functions for modals
function openEnrollStudentModal() {
    enrollStudentForm.reset();
    updateAvailableSubjects();
    enrollStudentModal.style.display = 'block';
}

function openAddProfessorModal() {
    addProfessorForm.reset();
    updateAvailableSubjectsForProfessor();
    addProfessorModal.style.display = 'block';
}

function openAddSubjectModal() {
    addSubjectForm.reset();
    updateProfessorDropdown();
    addSubjectModal.style.display = 'block';
}

function openStudentDetailsModal(studentId) {
    const student = data.students[studentId];
    if (!student) return;
    
    document.getElementById('detail-student-id').textContent = student.id;
    document.getElementById('detail-student-name').textContent = student.name;
    document.getElementById('detail-student-year').textContent = `Year ${student.yearLevel}`;
    document.getElementById('detail-student-status').textContent = student.getOverallStatus();
    document.getElementById('detail-student-gpa').textContent = student.getGPA();
    
    renderStudentSubjects(student);
    
    const { canProceed, message } = student.canProceedToNextYear();
    document.getElementById('progression-message').textContent = message;
    
    const promotionAction = document.getElementById('promotion-action');
    if (canProceed) {
        promotionAction.classList.remove('hidden');
        const promoteBtn = document.getElementById('promote-student-btn');
        promoteBtn.onclick = () => {
            student.yearLevel++;
            addActivity(`${student.name} promoted to Year ${student.yearLevel}`);
            updateDashboard();
            renderTables();
            studentDetailsModal.style.display = 'none';
        };
    } else {
        promotionAction.classList.add('hidden');
    }
    
    studentDetailsModal.style.display = 'block';
}

function openEnterGradeModal(studentId, subjectId) {
    const student = data.students[studentId];
    const subject = data.subjects[subjectId];
    
    if (!student || !subject) return;
    
    document.getElementById('grade-student-name').textContent = student.name;
    document.getElementById('grade-subject-name').textContent = subject.name;
    
    const currentGrade = student.grades[subjectId];
    document.getElementById('grade-value').value = currentGrade !== null ? currentGrade : '';
    
    enterGradeForm.onsubmit = (e) => {
        e.preventDefault();
        const grade = document.getElementById('grade-value').value;
        student.setGrade(subjectId, grade);
        addActivity(`Grade for ${student.name} in ${subject.name} set to ${grade}`);
        renderStudentSubjects(student);
        enterGradeModal.style.display = 'none';
        
        // Update progression status
        const { message } = student.canProceedToNextYear();
        document.getElementById('progression-message').textContent = message;
        
        const promotionAction = document.getElementById('promotion-action');
        if (student.canProceedToNextYear().canProceed) {
            promotionAction.classList.remove('hidden');
        } else {
            promotionAction.classList.add('hidden');
        }
    };
    
    enterGradeModal.style.display = 'block';
}

// Form handlers
function handleEnrollStudent(e) {
    e.preventDefault();

    const id = document.getElementById('student-id').value;
    const name = document.getElementById('student-name').value;
    const yearLevel = document.getElementById('student-year').value;

    if (data.students[id]) {
        alert('A student with this ID already exists.');
        return;
    }

    // Check if there are any available subjects
    const checkboxes = document.querySelectorAll('#available-subjects input[type="checkbox"]:checked');
    if (checkboxes.length === 0) {
        alert("Enrollment failed: No subjects available.");
        return;
    }

    const student = new Student(id, name, yearLevel);
    data.students[id] = student;

    // Enroll in selected subjects
    checkboxes.forEach(checkbox => {
        const subjectId = checkbox.value;
        const subject = data.subjects[subjectId];
        if (subject) {
            student.enroll(subject);
        }
    });

    addActivity(`Student ${name} enrolled in Year ${yearLevel}`);
    updateDashboard();
    renderTables();
    enrollStudentModal.style.display = 'none';
}


function handleAddProfessor(e) {
    e.preventDefault();
    
    const id = document.getElementById('professor-id').value;
    const name = document.getElementById('professor-name').value;
    const department = document.getElementById('professor-department').value;
    
    if (data.professors[id]) {
        alert('A professor with this ID already exists.');
        return;
    }
    
    const professor = new Professor(id, name, department);
    data.professors[id] = professor;
    
    // Assign selected subjects
    const checkboxes = document.querySelectorAll('#available-subjects-for-professor input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        const subjectId = checkbox.value;
        const subject = data.subjects[subjectId];
        if (subject && !subject.professor) {
            subject.assignProfessor(professor);
        }
    });
    
    addActivity(`Professor ${name} added to department ${department}`);
    updateDashboard();
    renderTables();
    addProfessorModal.style.display = 'none';
    
    // Update department filter
    updateDepartmentFilter();
}

function handleAddSubject(e) {
    e.preventDefault();
    
    const id = document.getElementById('subject-code').value;
    const name = document.getElementById('subject-name').value;
    const units = document.getElementById('subject-units').value;
    const yearLevel = document.getElementById('subject-year').value;
    
    if (data.subjects[id]) {
        alert('A subject with this code already exists.');
        return;
    }
    
    const subject = new Subject(id, name, units, yearLevel);
    data.subjects[id] = subject;
    
    // Assign professor if selected
    const professorId = document.getElementById('subject-professor').value;
    if (professorId) {
        const professor = data.professors[professorId];
        if (professor) {
            subject.assignProfessor(professor);
        }
    }
    
    addActivity(`Subject ${name} added for Year ${yearLevel}`);
    updateDashboard();
    renderTables();
    addSubjectModal.style.display = 'none';
}

function handleEnterGrade(e) {
    e.preventDefault();
    // This is handled in the openEnterGradeModal function
}

// Utility functions
function updateAvailableSubjects() {
    const yearLevel = document.getElementById('student-year').value;
    const availableSubjectsDiv = document.getElementById('available-subjects');
    
    // Clear previous options
    availableSubjectsDiv.innerHTML = '';
    
    // Get subjects for the selected year level
    const yearSubjects = Object.values(data.subjects).filter(subject => 
        subject.yearLevel === parseInt(yearLevel)
    );
    
    if (yearSubjects.length === 0) {
        availableSubjectsDiv.innerHTML = '<p class="empty-message">No subjects available for this year level</p>';
        return;
    }
    
    // Create checkboxes for each subject
    yearSubjects.forEach(subject => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `subject-${subject.id}`;
        checkbox.value = subject.id;
        
        const label = document.createElement('label');
        label.htmlFor = `subject-${subject.id}`;
        label.textContent = `${subject.name} (${subject.units} units)`;
        
        checkboxItem.appendChild(checkbox);
        checkboxItem.appendChild(label);
        availableSubjectsDiv.appendChild(checkboxItem);
    });
}

function updateAvailableSubjectsForProfessor() {
    const availableSubjectsDiv = document.getElementById('available-subjects-for-professor');
    
    // Clear previous options
    availableSubjectsDiv.innerHTML = '';
    
    // Get subjects without a professor
    const unassignedSubjects = Object.values(data.subjects).filter(subject => 
        !subject.professor
    );
    
    if (unassignedSubjects.length === 0) {
        availableSubjectsDiv.innerHTML = '<p class="empty-message">No subjects available for assignment</p>';
        return;
    }
    
    // Create checkboxes for each subject
    unassignedSubjects.forEach(subject => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `prof-subject-${subject.id}`;
        checkbox.value = subject.id;
        
        const label = document.createElement('label');
        label.htmlFor = `prof-subject-${subject.id}`;
        label.textContent = `${subject.name} (Year ${subject.yearLevel})`;
        
        checkboxItem.appendChild(checkbox);
        checkboxItem.appendChild(label);
        availableSubjectsDiv.appendChild(checkboxItem);
    });
}

function updateProfessorDropdown() {
    const professorSelect = document.getElementById('subject-professor');
    
    // Clear previous options
    professorSelect.innerHTML = '<option value="">-- None --</option>';
    
    // Add professors to dropdown
    Object.values(data.professors).forEach(professor => {
        const option = document.createElement('option');
        option.value = professor.id;
        option.textContent = `${professor.name} (${professor.department})`;
        professorSelect.appendChild(option);
    });
}

function updateDepartmentFilter() {
    const departmentFilter = document.getElementById('department-filter');
    
    // Clear previous options
    departmentFilter.innerHTML = '<option value="all">All Departments</option>';
    
    // Get unique departments
    const departments = [...new Set(
        Object.values(data.professors).map(professor => professor.department)
    )];
    
    // Add departments to dropdown
    departments.forEach(department => {
        const option = document.createElement('option');
        option.value = department;
        option.textContent = department;
        departmentFilter.appendChild(option);
    });
}

function renderStudentSubjects(student) {
    const tbody = document.getElementById('student-subjects-body');
    
    // Clear previous rows
    tbody.innerHTML = '';
    
    if (student.subjects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">No subjects enrolled</td></tr>';
        return;
    }
    
    // Add a row for each subject
    student.subjects.forEach(subject => {
        const row = document.createElement('tr');
        
        const subjectCell = document.createElement('td');
        subjectCell.textContent = subject.name;
        
        const professorCell = document.createElement('td');
        professorCell.textContent = subject.professor ? subject.professor.name : 'Not assigned';
        
        const gradeCell = document.createElement('td');
        const grade = student.grades[subject.id];
        gradeCell.textContent = grade !== null ? grade : 'Not graded';
        
        const statusCell = document.createElement('td');
        let statusText = 'PENDING';
        let statusClass = '';
        
        if (grade !== null) {
            if (grade >= PASSING_GRADE) {
                statusText = 'PASSED';
                statusClass = 'status-passed';
            } else {
                statusText = 'FAILED';
                statusClass = 'status-failed';
            }
        }
        
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${statusClass}`;
        statusBadge.textContent = statusText;
        statusCell.appendChild(statusBadge);
        
        const actionsCell = document.createElement('td');
        const gradeBtn = document.createElement('button');
        gradeBtn.className = 'action-btn edit-btn';
        gradeBtn.innerHTML = '<i class="fas fa-edit"></i> Grade';
        gradeBtn.onclick = () => openEnterGradeModal(student.id, subject.id);
        actionsCell.appendChild(gradeBtn);
        
        row.appendChild(subjectCell);
        row.appendChild(professorCell);
        row.appendChild(gradeCell);
        row.appendChild(statusCell);
        row.appendChild(actionsCell);
        
        tbody.appendChild(row);
    });
}

function renderTables() {
    renderStudentsTable();
    renderProfessorsTable();
    renderSubjectsTable();
}

function renderStudentsTable() {
    const tbody = studentsTableBody;
    
    // Clear previous rows
    tbody.innerHTML = '';
    
    const students = Object.values(data.students);
    
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-message">No students enrolled yet</td></tr>';
        return;
    }
    
    // Add a row for each student
    students.forEach(student => {
        const row = document.createElement('tr');
        
        const idCell = document.createElement('td');
        idCell.textContent = student.id;
        
        const nameCell = document.createElement('td');
        nameCell.textContent = student.name;
        
        const yearCell = document.createElement('td');
        yearCell.textContent = `Year ${student.yearLevel}`;
        
        const statusCell = document.createElement('td');
        const status = student.getOverallStatus();
        let statusClass = '';
        
        if (status === 'PASSED') {
            statusClass = 'status-passed';
        } else if (status === 'FAILED') {
            statusClass = 'status-failed';
        } else if (status === 'INCOMPLETE') {
            statusClass = 'status-incomplete';
        }
        
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${statusClass}`;
        statusBadge.textContent = status;
        statusCell.appendChild(statusBadge);
        
        const gpaCell = document.createElement('td');
        gpaCell.textContent = student.getGPA();
        
        const subjectsCell = document.createElement('td');
        subjectsCell.textContent = `${student.subjects.length}/${MAX_SUBJECTS_PER_STUDENT}`;
        
        const actionsCell = document.createElement('td');
        
        const viewBtn = document.createElement('button');
        viewBtn.className = 'action-btn view-btn';
        viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
        viewBtn.title = 'View Details';
        viewBtn.onclick = () => openStudentDetailsModal(student.id);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete';
        deleteBtn.onclick = () => {
            if (confirm(`Are you sure you want to delete ${student.name}?`)) {
                delete data.students[student.id];
                addActivity(`Student ${student.name} deleted`);
                updateDashboard();
                renderTables();
            }
        };
        
        actionsCell.appendChild(viewBtn);
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(yearCell);
        row.appendChild(statusCell);
        row.appendChild(gpaCell);
        row.appendChild(subjectsCell);
        row.appendChild(actionsCell);
        
        tbody.appendChild(row);
    });
    
    filterStudents();
}

function renderProfessorsTable() {
    const tbody = professorsTableBody;
    
    // Clear previous rows
    tbody.innerHTML = '';
    
    const professors = Object.values(data.professors);
    
    if (professors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">No professors added yet</td></tr>';
        return;
    }
    
    // Add a row for each professor
    professors.forEach(professor => {
        const row = document.createElement('tr');
        
        const idCell = document.createElement('td');
        idCell.textContent = professor.id;
        
        const nameCell = document.createElement('td');
        nameCell.textContent = professor.name;
        
        const departmentCell = document.createElement('td');
        departmentCell.textContent = professor.department;
        
        const subjectsCell = document.createElement('td');
        subjectsCell.textContent = professor.subjects.length;
        
        const actionsCell = document.createElement('td');
        
        const viewBtn = document.createElement('button');
        viewBtn.className = 'action-btn view-btn';
        viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
        viewBtn.title = 'View Subjects';
        viewBtn.onclick = () => {
            let subjectsList = '';
            if (professor.subjects.length === 0) {
                subjectsList = 'No subjects assigned';
            } else {
                subjectsList = professor.subjects.map(s => s.name).join('\n');
            }
            alert(`Subjects taught by ${professor.name}:\n\n${subjectsList}`);
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete';
        deleteBtn.onclick = () => {
            if (confirm(`Are you sure you want to delete ${professor.name}?`)) {
                // Remove professor from subjects
                professor.subjects.forEach(subject => {
                    subject.professor = null;
                });
                
                delete data.professors[professor.id];
                addActivity(`Professor ${professor.name} deleted`);
                updateDashboard();
                renderTables();
            }
        };
        
        actionsCell.appendChild(viewBtn);
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(departmentCell);
        row.appendChild(subjectsCell);
        row.appendChild(actionsCell);
        
        tbody.appendChild(row);
    });
    
    filterProfessors();
}

function renderSubjectsTable() {
    const tbody = subjectsTableBody;
    
    // Clear previous rows
    tbody.innerHTML = '';
    
    const subjects = Object.values(data.subjects);
    
    if (subjects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-message">No subjects added yet</td></tr>';
        return;
    }
    
    // Add a row for each subject
    subjects.forEach(subject => {
        const row = document.createElement('tr');
        
        const codeCell = document.createElement('td');
        codeCell.textContent = subject.id;
        
        const nameCell = document.createElement('td');
        nameCell.textContent = subject.name;
        
        const unitsCell = document.createElement('td');
        unitsCell.textContent = subject.units;
        
        const yearCell = document.createElement('td');
        yearCell.textContent = `Year ${subject.yearLevel}`;
        
        const professorCell = document.createElement('td');
        professorCell.textContent = subject.professor ? subject.professor.name : 'Not assigned';
        
        const studentsCell = document.createElement('td');
        const enrolledStudents = subject.getEnrolledStudents().length;
        studentsCell.textContent = enrolledStudents;
        
        const actionsCell = document.createElement('td');
        
        const viewBtn = document.createElement('button');
        viewBtn.className = 'action-btn view-btn';
        viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
        viewBtn.title = 'View Students';
        viewBtn.onclick = () => {
            const students = subject.getEnrolledStudents();
            let studentsList = '';
            if (students.length === 0) {
                studentsList = 'No students enrolled';
            } else {
                studentsList = students.map(s => {
                    const grade = s.grades[subject.id];
                    const gradeDisplay = grade !== null ? grade : 'Not graded';
                    return `${s.name} (Year ${s.yearLevel}) - Grade: ${gradeDisplay}`;
                }).join('\n');
            }
            alert(`Students enrolled in ${subject.name}:\n\n${studentsList}`);
        };
        
        const assignBtn = document.createElement('button');
        assignBtn.className = 'action-btn edit-btn';
        assignBtn.innerHTML = '<i class="fas fa-user-tie"></i>';
        assignBtn.title = 'Assign Professor';
        assignBtn.onclick = () => {
            if (Object.keys(data.professors).length === 0) {
                alert('No professors available. Please add professors first.');
                return;
            }
            
            const professorSelect = document.createElement('select');
            professorSelect.className = 'form-control';
            
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '-- Select Professor --';
            professorSelect.appendChild(defaultOption);
            
            Object.values(data.professors).forEach(professor => {
                const option = document.createElement('option');
                option.value = professor.id;
                option.textContent = `${professor.name} (${professor.department})`;
                professorSelect.appendChild(option);
            });
            
            const currentProfessor = subject.professor;
            if (currentProfessor) {
                professorSelect.value = currentProfessor.id;
            }
            
            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'primary-btn';
            confirmBtn.textContent = 'Assign';
            confirmBtn.style.marginLeft = '10px';
            
            const container = document.createElement('div');
            container.style.padding = '10px';
            container.appendChild(document.createTextNode('Select Professor: '));
            container.appendChild(professorSelect);
            container.appendChild(confirmBtn);
            
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            modalContent.style.width = '400px';
            
            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            
            const modalTitle = document.createElement('h2');
            modalTitle.textContent = `Assign Professor to ${subject.name}`;
            
            const closeBtn = document.createElement('span');
            closeBtn.className = 'close';
            closeBtn.innerHTML = '&times;';
            closeBtn.onclick = () => {
                document.body.removeChild(modal);
            };
            
            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeBtn);
            
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            modalBody.appendChild(container);
            
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modal.appendChild(modalContent);
            
            confirmBtn.onclick = () => {
                const professorId = professorSelect.value;
                
                if (!professorId) {
                    if (currentProfessor) {
                        // Remove current professor
                        const index = currentProfessor.subjects.indexOf(subject);
                        if (index !== -1) {
                            currentProfessor.subjects.splice(index, 1);
                        }
                        subject.professor = null;
                        addActivity(`Professor removed from ${subject.name}`);
                    } else {
                        alert('Please select a professor');
                        return;
                    }
                } else {
                    const professor = data.professors[professorId];
                    
                    if (currentProfessor) {
                        // Remove from current professor
                        const index = currentProfessor.subjects.indexOf(subject);
                        if (index !== -1) {
                            currentProfessor.subjects.splice(index, 1);
                        }
                    }
                    
                    subject.assignProfessor(professor);
                    addActivity(`${professor.name} assigned to ${subject.name}`);
                }
                
                document.body.removeChild(modal);
                renderTables();
            };
            
            document.body.appendChild(modal);
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete';
        deleteBtn.onclick = () => {
            if (confirm(`Are you sure you want to delete ${subject.name}?`)) {
                // Remove subject from professor
                if (subject.professor) {
                    const index = subject.professor.subjects.indexOf(subject);
                    if (index !== -1) {
                        subject.professor.subjects.splice(index, 1);
                    }
                }
                
                // Remove subject from students
                Object.values(data.students).forEach(student => {
                    const index = student.subjects.findIndex(s => s.id === subject.id);
                    if (index !== -1) {
                        student.subjects.splice(index, 1);
                        delete student.grades[subject.id];
                    }
                });
                
                delete data.subjects[subject.id];
                addActivity(`Subject ${subject.name} deleted`);
                updateDashboard();
                renderTables();
            }
        };
        
        actionsCell.appendChild(viewBtn);
        actionsCell.appendChild(assignBtn);
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(codeCell);
        row.appendChild(nameCell);
        row.appendChild(unitsCell);
        row.appendChild(yearCell);
        row.appendChild(professorCell);
        row.appendChild(studentsCell);
        row.appendChild(actionsCell);
        
        tbody.appendChild(row);
    });
    
    filterSubjects();
}

function filterStudents() {
    const searchTerm = document.getElementById('student-search').value.toLowerCase();
    const yearFilter = document.getElementById('year-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    const rows = studentsTableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        if (row.querySelector('.empty-message')) return;
        
        const name = row.cells[1].textContent.toLowerCase();
        const year = row.cells[2].textContent;
        const status = row.querySelector('.status-badge')?.textContent || '';
        
        const matchesSearch = name.includes(searchTerm);
        const matchesYear = yearFilter === 'all' || year === `Year ${yearFilter}`;
        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        
        if (matchesSearch && matchesYear && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterProfessors() {
    const searchTerm = document.getElementById('professor-search').value.toLowerCase();
    const departmentFilter = document.getElementById('department-filter').value;
    
    const rows = professorsTableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        if (row.querySelector('.empty-message')) return;
        
        const name = row.cells[1].textContent.toLowerCase();
        const department = row.cells[2].textContent;
        
        const matchesSearch = name.includes(searchTerm);
        const matchesDepartment = departmentFilter === 'all' || department === departmentFilter;
        
        if (matchesSearch && matchesDepartment) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterSubjects() {
    const searchTerm = document.getElementById('subject-search').value.toLowerCase();
    const yearFilter = document.getElementById('subject-year-filter').value;
    
    const rows = subjectsTableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        if (row.querySelector('.empty-message')) return;
        
        const name = row.cells[1].textContent.toLowerCase();
        const year = row.cells[3].textContent;
        
        const matchesSearch = name.includes(searchTerm);
        const matchesYear = yearFilter === 'all' || year === `Year ${yearFilter}`;
        
        if (matchesSearch && matchesYear) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function updateDashboard() {
    studentCount.textContent = Object.keys(data.students).length;
    professorCount.textContent = Object.keys(data.professors).length;
    subjectCount.textContent = Object.keys(data.subjects).length;
}

function addActivity(message) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    
    const activity = {
        message,
        time: `${dateString} ${timeString}`
    };
    
    data.activityLog.unshift(activity);
    
    // Keep only the last 20 activities
    if (data.activityLog.length > 20) {
        data.activityLog.pop();
    }
    
    renderActivityLog();
}

function renderActivityLog() {
    const activityLogDiv = document.getElementById('activity-log');
    
    // Clear previous activities
    activityLogDiv.innerHTML = '';
    
    if (data.activityLog.length === 0) {
        activityLogDiv.innerHTML = '<p class="empty-message">No recent activity</p>';
        return;
    }
    
    // Add activities
    data.activityLog.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const message = document.createElement('p');
        message.textContent = activity.message;
        
        const time = document.createElement('span');
        time.className = 'activity-time';
        time.textContent = activity.time;
        
        activityItem.appendChild(message);
        activityItem.appendChild(time);
        activityLogDiv.appendChild(activityItem);
    });
}
