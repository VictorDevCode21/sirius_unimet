// Routes shared across portals and features.
export const ROUTES = {
  studentHome: '/student',
  studentPreEnrollment: '/student/pre-enrollment',
  studentPreEnrollmentSummary: '/student/pre-enrollment/summary',
  // Enrollment of the pre-enrolled sections at the student's turn; the summary's "Inscribir" button leads here.
  studentEnrollment: '/student/enrollment',
  // Account statement and payments of the enrolled terms.
  studentPayments: '/student/payments',
  studentReceipt: '/student/receipt',
} as const
