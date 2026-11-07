// Routes shared across portals and features.
export const ROUTES = {
  studentHome: '/student',
  studentPreEnrollment: '/student/pre-enrollment',
  studentPreEnrollmentSummary: '/student/pre-enrollment/summary',
  // Simulated payment page (HU-18A); the summary's "Pagar" button navigates here after validating seats.
  studentPayment: '/student/payment',
} as const
