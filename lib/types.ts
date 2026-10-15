export type UserRole = 'student' | 'professor' | 'admin'

export type SubjectStatus =
  | 'completed'
  | 'available'
  | 'blocked'
  | 'enrolled'
  | 'current'

export interface Subject {
  code: string
  name: string
  semester: number
  branch: number // 1-5
  credits: number
  hours: {
    A: number // Aula
    PS: number // Prácticas Supervisadas
    L: number // Laboratorio
    AA: number // Aprendizaje Autónomo
  }
  prerequisites: string[]
  offerings: string // e.g., "1-2", "2-3"
  status: SubjectStatus
  profesors?: string[]
}

export interface Curriculum {
  code: string
  name: string
  school: string
  faculty: string
  subjects: Subject[]
  semesters: number // 12
  branches: number // 5
}

export interface Student {
  id: string
  name: string
  cedula: string
  email: string
  curriculums: string[]
  completedSubjects: string[]
  completedCredits: number
  totalCredits: number
  gpa: number
  currentSemester: number
  status: 'active' | 'inactive' | 'graduated'
}

export interface PreEnrollment {
  studentId: string
  subjectCodes: string[]
  semester: string
  status: 'pending' | 'confirmed' | 'rejected'
  createdAt: Date
}
