// ─── SmartSchool Aside — Comprehensive Mock Data ─────────────────────────────

export const dashboard = {
  stats: [
    { label: "Total Students", value: "2,840", change: "+4.2%" },
    { label: "Teaching Staff", value: "128",   change: "+2.1%" },
    { label: "Fee Collection", value: "91%",   change: "+4%" },
    { label: "Attendance Today", value: "88.4%", change: "+1.8%" },
  ],
  attendance: [
    { day: "Mon", value: 91 }, { day: "Tue", value: 94 }, { day: "Wed", value: 88 },
    { day: "Thu", value: 90 }, { day: "Fri", value: 85 },
  ],
  events: [
    ["Sep 2",  "Parent-Teacher Meeting"],
    ["Sep 5",  "Unit Test 2 — Mathematics"],
    ["Sep 15", "Annual Sports Day"],
    ["Oct 10", "Mid-Term Examinations"],
  ],
  performers: [
    ["Ahmed Hassan",  "96.4%"],
    ["Sara Malik",    "94.1%"],
    ["Fatima Khan",   "93.7%"],
    ["Noor Siddiqui", "92.8%"],
    ["Ali Raza",      "91.3%"],
  ],
};

export const students = [
  { id: "1", name: "Ahmed Hassan",  studentNumber: "2024-0921", className: "Grade 9",  section: "A", status: "Active",   attendance: "92%", avgGrade: "B+", feeStatus: "Paid"    },
  { id: "2", name: "Sara Malik",    studentNumber: "2024-0845", className: "Grade 10", section: "B", status: "Active",   attendance: "87%", avgGrade: "B",  feeStatus: "Pending" },
  { id: "3", name: "Omar Raza",     studentNumber: "2024-1102", className: "Grade 8",  section: "C", status: "Active",   attendance: "76%", avgGrade: "C+", feeStatus: "Overdue" },
  { id: "4", name: "Fatima Khan",   studentNumber: "2024-0311", className: "Grade 11", section: "A", status: "Active",   attendance: "95%", avgGrade: "A",  feeStatus: "Paid"    },
  { id: "5", name: "Zain Ali",      studentNumber: "2024-1234", className: "Grade 7",  section: "B", status: "Active",   attendance: "81%", avgGrade: "B+", feeStatus: "Paid"    },
  { id: "6", name: "Noor Siddiqui", studentNumber: "2024-0098", className: "Grade 12", section: "A", status: "Active",   attendance: "97%", avgGrade: "A+", feeStatus: "Paid"    },
];

export const employees = [
  { id: "1", name: "Ms. Aisha Siddiqui", employeeNumber: "TCH-041", role: "Teacher",      department: "Mathematics", joinDate: "Sep 2021", leaveBalance: "12 days", status: "Active" },
  { id: "2", name: "Mr. Tariq Jameel",   employeeNumber: "TCH-022", role: "Teacher",      department: "Physics",     joinDate: "Aug 2019", leaveBalance: "8 days",  status: "Active" },
  { id: "3", name: "Ms. Farah Khan",     employeeNumber: "ADM-010", role: "Admin Officer", department: "Admin",      joinDate: "Mar 2020", leaveBalance: "3 days",  status: "On Leave" },
  { id: "4", name: "Dr. Noman Arif",     employeeNumber: "TCH-055", role: "Teacher",      department: "CS",          joinDate: "Mar 2020", leaveBalance: "14 days", status: "Active" },
  { id: "5", name: "Mrs. Rehana Pervez", employeeNumber: "HOD-003", role: "HOD",          department: "Languages",   joinDate: "Jan 2018", leaveBalance: "20 days", status: "Active" },
];

export const invoices = [
  { id: "INV-2026-0892", student: "Ahmed Hassan",  grade: "9-A",  amount: 450, due: "Aug 20", status: "Paid"    },
  { id: "INV-2026-0891", student: "Sara Malik",    grade: "10-B", amount: 420, due: "Aug 20", status: "Pending" },
  { id: "INV-2026-0890", student: "Omar Raza",     grade: "8-C",  amount: 380, due: "Aug 5",  status: "Overdue" },
  { id: "INV-2026-0889", student: "Fatima Khan",   grade: "11-A", amount: 520, due: "Aug 20", status: "Paid"    },
];

export const vehicles = [
  { id: "1", name: "Bus 01", reg: "LSQ-441", route: "Route A — North",   driver: "Arif Khan",    students: 42, status: "On Route" },
  { id: "2", name: "Bus 02", reg: "LSQ-882", route: "Route B — South",   driver: "Saleem Ahmed", students: 38, status: "On Route" },
  { id: "3", name: "Bus 03", reg: "LSQ-334", route: "Route C — East",    driver: "Bilal Hassan", students: 45, status: "Delayed 12m" },
  { id: "4", name: "Van 01", reg: "LSQ-775", route: "Route D — West",    driver: "Kamran Ali",   students: 12, status: "On Route" },
  { id: "5", name: "Bus 04", reg: "LSQ-991", route: "Route E — Central", driver: "Irfan Raza",   students: 40, status: "Breakdown" },
];

export const books = [
  { id: "1", title: "Mathematics Grade 9", author: "R.D. Sharma",   category: "Textbook",   total: 8,  available: 6, status: "Available" },
  { id: "2", title: "Physics Fundamentals", author: "H.C. Verma",   category: "Textbook",   total: 5,  available: 2, status: "Limited"   },
  { id: "3", title: "English Literature",   author: "Oxford Press", category: "Literature", total: 10, available: 10, status: "Available" },
  { id: "4", title: "World History Vol 2",  author: "John Green",   category: "History",    total: 4,  available: 0, status: "All Issued" },
];

export const notifications = [
  { id: "1", title: "AI Prediction Alert",   message: "47 students flagged as high dropout risk this term.", time: "2 min ago", read: false, type: "danger"  },
  { id: "2", title: "Payment Received",      message: "Fee payment of $450 received for Ahmed Hassan.",      time: "15 min ago", read: false, type: "success" },
  { id: "3", title: "New Admission Request", message: "Mariam Shah — Grade 9 application submitted.",        time: "1 hour ago", read: false, type: "info"    },
  { id: "4", title: "Exam Results Published", message: "Grade 10-A Mathematics results are live.",           time: "2 hours ago", read: true, type: "info"    },
  { id: "5", title: "Transport Alert",       message: "Bus 03 delayed 12 min on Route C.",                   time: "3 hours ago", read: true, type: "warning" },
  { id: "6", title: "Staff Leave Request",   message: "Ms. Farah Khan: sick leave Sep 2–4.",                 time: "Yesterday",  read: true, type: "info"    },
];

export const predictions = [
  { student: "Omar Raza",     class: "Grade 9-A",  riskType: "Dropout",      score: 87, level: "high",   detail: "Attendance 72% · 4 missing assignments · Grades dropping" },
  { student: "Sara Khan",     class: "Grade 10-B", riskType: "Grade Decline", score: 64, level: "medium", detail: "Grade declined from B to C · Missing 2 labs" },
  { student: "Zain Ali",      class: "Grade 8-C",  riskType: "Fee Default",  score: 58, level: "medium", detail: "Fee overdue 3 months · Attendance dropping" },
  { student: "Fatima Khan",   class: "Grade 11-A", riskType: "Performing",   score: 12, level: "low",    detail: "All metrics on track · A grade predicted" },
];

export const moduleData = {
  feeStructure: [
    { grade: "Grade 7",  tuition: 200, transport: 50, library: 10, lab: 15, sports: 20, total: 295 },
    { grade: "Grade 8",  tuition: 220, transport: 50, library: 10, lab: 15, sports: 20, total: 315 },
    { grade: "Grade 9",  tuition: 260, transport: 50, library: 10, lab: 20, sports: 20, total: 360 },
    { grade: "Grade 10", tuition: 280, transport: 50, library: 10, lab: 20, sports: 20, total: 380 },
    { grade: "Grade 11", tuition: 320, transport: 50, library: 15, lab: 25, sports: 20, total: 430 },
    { grade: "Grade 12", tuition: 350, transport: 50, library: 15, lab: 25, sports: 20, total: 460 },
  ],
  exams: [
    { name: "Unit Test 2",  grades: "9-10",  date: "Sep 5, 2026",  status: "Upcoming",   passRate: null },
    { name: "Mid-Term",     grades: "All",   date: "Oct 10, 2026", status: "Scheduled",  passRate: null },
    { name: "Unit Test 1",  grades: "All",   date: "Jul 20, 2026", status: "Completed",  passRate: "94.2%" },
  ],
  departments: [
    { name: "Mathematics",   head: "Ms. Aisha",  teachers: 8, avgScore: "82%", passRate: "97%", trend: "▲ 3%", status: "Good"      },
    { name: "Sciences",      head: "Mr. Tariq",  teachers: 7, avgScore: "79%", passRate: "95%", trend: "▼ 1%", status: "Average"   },
    { name: "Languages",     head: "Ms. Zara",   teachers: 6, avgScore: "88%", passRate: "99%", trend: "▲ 5%", status: "Excellent" },
    { name: "Social Studies",head: "Mr. Fahad",  teachers: 5, avgScore: "74%", passRate: "93%", trend: "▼ 4%", status: "Attention" },
    { name: "CS",            head: "Dr. Noman",  teachers: 3, avgScore: "91%", passRate: "99%", trend: "▲ 2%", status: "Excellent" },
  ],
};
