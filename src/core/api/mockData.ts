/**
 * SmartSchool Mock Data — shapes match backend Response records exactly.
 * All FeeType items now use explicit fields (not MetadataJson).
 * AdminDashboard has new fields: ActiveStudents, CollectedAmount, etc.
 * PredictionResult.factors is now string[] not Record<string,number>.
 */
import type {
  AdminDashboard, StudentDashboard, TeacherDashboard, ParentDashboard,
  DriverDashboard, StudentItem, EmployeeItem, SchoolItem, CampusItem,
  DepartmentItem, FeeTypeItem, AcademicYearItem, GradeLevelItem,
  ClassSectionItem, SubjectItem, TenantItem, InvoiceItem, InquiryItem,
  VehicleItem, RouteItem, BookItem, ExamItem, NotificationItem,
  ChatConversation, ChatMessage, ModelConfigItem, KnowledgeCollectionItem,
  AiExecutionLogItem, LookupValue, PredictionResult, BranchGenderType, EducationLevel,
  PagedResult,
} from "./backendContracts";

const T1 = "11111111-1111-1111-1111-111111111111";
const S1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const B1 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const B2 = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const AY = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const CS = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

export function page<T>(items: T[], total?: number): PagedResult<T> {
  return { items, page: 1, pageSize: 50, totalCount: total ?? items.length };
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const MOCK_ADMIN_DASHBOARD: AdminDashboard = {
  Students: 2840, Guardians: 1620, Employees: 128,
  Exams: 14, Invoices: 2840, OutstandingInvoices: 312,
  UnreadNotifications: 7, Vehicles: 8, Drivers: 6,
  ActiveStudents: 2798, CollectedAmount: 12780000,
  OutstandingAmount: 1404000, PassedResults: 2145, FailedResults: 87,
};

export const MOCK_STUDENT_DASHBOARD: StudentDashboard = {
  StudentId: "22222222-2222-2222-2222-222222222222",
  StudentNumber: "STU-2024-0921", FirstName: "Ahmed", LastName: "Hassan",
  Status: "ACTIVE", Enrollments: 6, Results: 18, OutstandingInvoices: 1,
};

export const MOCK_TEACHER_DASHBOARD: TeacherDashboard = {
  EmployeeId: "33333333-3333-3333-3333-333333333333",
  EmployeeNumber: "TCH-041", FirstName: "Aisha", LastName: "Siddiqui",
  Status: "ACTIVE", CourseAssignments: 4, PendingLeaves: 0,
};

export const MOCK_PARENT_DASHBOARD: ParentDashboard = {
  GuardianId: "44444444-4444-4444-4444-444444444444",
  FullName: "Ali Hassan", Email: "ali.hassan@email.com",
  Phone: "+92 300 1234567", Children: 2, OutstandingInvoices: 1,
};

export const MOCK_DRIVER_DASHBOARD: DriverDashboard = {
  DriverId: "55555555-5555-5555-5555-555555555555",
  DriverNumber: "DRV-001", FullName: "Arif Khan",
  Phone: "+92 321 9876543", Status: "ACTIVE",
  LicenseExpiresOn: "2027-06-15", ActiveVehicleAssignments: 1,
};

// ─── Students ────────────────────────────────────────────────────────────────
export const MOCK_STUDENTS: StudentItem[] = [
  { tenantId:T1, id:"22222222-2222-2222-2222-222222222222", studentNumber:"STU-2024-0921", firstName:"Ahmed",  lastName:"Hassan",   dateOfBirth:"2009-03-15", gender:"Male",   admissionDate:"2024-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"22222222-2222-2222-2222-222222222223", studentNumber:"STU-2024-0845", firstName:"Sara",   lastName:"Malik",    dateOfBirth:"2008-07-22", gender:"Female", admissionDate:"2024-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"22222222-2222-2222-2222-222222222224", studentNumber:"STU-2024-1102", firstName:"Omar",   lastName:"Raza",     dateOfBirth:"2010-11-08", gender:"Male",   admissionDate:"2024-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"22222222-2222-2222-2222-222222222225", studentNumber:"STU-2024-0311", firstName:"Fatima", lastName:"Khan",     dateOfBirth:"2007-01-30", gender:"Female", admissionDate:"2023-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"22222222-2222-2222-2222-222222222226", studentNumber:"STU-2024-1234", firstName:"Zain",   lastName:"Ali",      dateOfBirth:"2011-05-12", gender:"Male",   admissionDate:"2024-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"22222222-2222-2222-2222-222222222227", studentNumber:"STU-2023-0098", firstName:"Noor",   lastName:"Siddiqui", dateOfBirth:"2006-09-03", gender:"Female", admissionDate:"2022-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"22222222-2222-2222-2222-222222222228", studentNumber:"STU-2024-0567", firstName:"Hamza",  lastName:"Sheikh",   dateOfBirth:"2009-08-20", gender:"Male",   admissionDate:"2024-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"22222222-2222-2222-2222-222222222229", studentNumber:"STU-2024-0789", firstName:"Ayesha", lastName:"Tariq",    dateOfBirth:"2010-02-14", gender:"Female", admissionDate:"2024-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"22222222-2222-2222-2222-22222222222a", studentNumber:"STU-2024-0432", firstName:"Bilal",  lastName:"Khan",     dateOfBirth:"2011-06-25", gender:"Male",   admissionDate:"2024-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"22222222-2222-2222-2222-22222222222b", studentNumber:"STU-2024-0654", firstName:"Hina",   lastName:"Raza",     dateOfBirth:"2009-12-05", gender:"Female", admissionDate:"2024-04-01", status:"PENDING" },
];
export const MOCK_STUDENTS_PAGE = page(MOCK_STUDENTS, 2840);

// ─── Employees ───────────────────────────────────────────────────────────────
export const MOCK_EMPLOYEES: EmployeeItem[] = [
  { tenantId:T1, id:"33333333-3333-3333-3333-333333333333", employeeNumber:"TCH-041", firstName:"Aisha",  lastName:"Siddiqui", cnicNumber:"35202-1234567-8", dateOfBirth:"1985-06-12", gender:"Female", jobTitle:"Senior Maths Teacher", department:"Mathematics", qualification:"MSc Mathematics", email:"aisha@alnoor.edu", phone:"+92 300 1111111", alternatePhone:null, address:"Model Town, Lahore", emergencyContactName:"Hassan Siddiqui", emergencyContactPhone:"+92 300 9999999", hireDate:"2021-09-01", employmentTypeCode:"PERMANENT", staffType:"TEACHER",       status:"ACTIVE"   },
  { tenantId:T1, id:"33333333-3333-3333-3333-333333333334", employeeNumber:"TCH-022", firstName:"Tariq",  lastName:"Jameel",   cnicNumber:"35202-2345678-9", dateOfBirth:"1980-03-22", gender:"Male",   jobTitle:"Physics Teacher",       department:"Sciences",     qualification:"MSc Physics",    email:"tariq@alnoor.edu", phone:"+92 300 2222222", alternatePhone:null, address:"Gulberg, Lahore",    emergencyContactName:"Jameel Ahmed",    emergencyContactPhone:"+92 300 8888888", hireDate:"2019-08-15", employmentTypeCode:"PERMANENT", staffType:"TEACHER",       status:"ACTIVE"   },
  { tenantId:T1, id:"33333333-3333-3333-3333-333333333335", employeeNumber:"ADM-010", firstName:"Farah",  lastName:"Khan",     cnicNumber:"35202-3456789-0", dateOfBirth:"1988-11-05", gender:"Female", jobTitle:"Admin Officer",          department:"Admin",        qualification:"MBA",            email:"farah@alnoor.edu", phone:"+92 300 3333333", alternatePhone:null, address:"DHA, Lahore",        emergencyContactName:"Arif Khan",       emergencyContactPhone:"+92 300 7777777", hireDate:"2020-03-01", employmentTypeCode:"PERMANENT", staffType:"ADMIN_OFFICER", status:"ON_LEAVE" },
  { tenantId:T1, id:"33333333-3333-3333-3333-333333333336", employeeNumber:"TCH-055", firstName:"Noman",  lastName:"Arif",     cnicNumber:"35202-4567890-1", dateOfBirth:"1982-09-18", gender:"Male",   jobTitle:"CS Teacher",             department:"Computer Sci.", qualification:"MCS",            email:"noman@alnoor.edu", phone:"+92 300 4444444", alternatePhone:null, address:"Johar Town, Lahore", emergencyContactName:"Arif Noman",      emergencyContactPhone:"+92 300 6666666", hireDate:"2020-03-15", employmentTypeCode:"PERMANENT", staffType:"TEACHER",       status:"ACTIVE"   },
  { tenantId:T1, id:"33333333-3333-3333-3333-333333333337", employeeNumber:"HOD-003", firstName:"Rehana", lastName:"Pervez",   cnicNumber:"35202-5678901-2", dateOfBirth:"1975-04-30", gender:"Female", jobTitle:"Head of Languages",      department:"Languages",    qualification:"MA English",     email:"rehana@alnoor.edu",phone:"+92 300 5555555", alternatePhone:null, address:"Bahria Town, Lahore",emergencyContactName:"Pervez Ahmad",    emergencyContactPhone:"+92 300 5555000", hireDate:"2018-01-10", employmentTypeCode:"PERMANENT", staffType:"TEACHER",       status:"ACTIVE"   },
  { tenantId:T1, id:"33333333-3333-3333-3333-333333333338", employeeNumber:"DRV-001", firstName:"Arif",   lastName:"Khan",     cnicNumber:"35202-6789012-3", dateOfBirth:"1975-07-15", gender:"Male",   jobTitle:"Bus Driver",             department:"Transport",    qualification:null,             email:null,              phone:"+92 321 9876543", alternatePhone:null, address:"Shahdara, Lahore",   emergencyContactName:"Bilal Khan",      emergencyContactPhone:"+92 321 1234567", hireDate:"2019-06-01", employmentTypeCode:"CONTRACT",  staffType:"DRIVER",        status:"ACTIVE"   },
];
export const MOCK_EMPLOYEES_PAGE = page(MOCK_EMPLOYEES, 128);

// ─── Organization ────────────────────────────────────────────────────────────
export const MOCK_SCHOOLS: SchoolItem[] = [
  { tenantId:T1, id:S1, code:"SCH-001", name:"Al-Noor Academy", registrationNumber:"REG-2015-001", email:"info@alnoor.edu.pk", phone:"+92 42 1234567", fax:null, website:"www.alnoor.edu.pk", address:"123 Model Town", city:"Lahore", province:"Punjab", country:"Pakistan", logoUrl:null },
];

export const MOCK_CAMPUSES: CampusItem[] = [
  { tenantId:T1, id:B1, schoolId:S1, code:"BR-001", name:"Main Campus",  branchType:"MIXED",  branchGenderTypeId:"g1", academicSystemId:null, address:"123 Model Town", city:"Lahore", province:"Punjab", country:"Pakistan", phone:"+92 42 1234567", fax:null, mobile:null, email:"main@alnoor.edu.pk",  logoUrl:null },
  { tenantId:T1, id:B2, schoolId:S1, code:"BR-002", name:"Girls Branch", branchType:"FEMALE", branchGenderTypeId:"g2", academicSystemId:null, address:"456 Garden Town", city:"Lahore", province:"Punjab", country:"Pakistan", phone:"+92 42 7654321", fax:null, mobile:null, email:"girls@alnoor.edu.pk", logoUrl:null },
];

export const MOCK_DEPARTMENTS: DepartmentItem[] = [
  { tenantId:T1, id:"d1", code:"DEPT-MATH", name:"Mathematics",     telephone:null, email:null, campusId:B1, headOfDepartmentEmployeeId:null, metadataJson:null },
  { tenantId:T1, id:"d2", code:"DEPT-SCI",  name:"Sciences",         telephone:null, email:null, campusId:B1, headOfDepartmentEmployeeId:null, metadataJson:null },
  { tenantId:T1, id:"d3", code:"DEPT-LANG", name:"Languages",        telephone:null, email:null, campusId:B1, headOfDepartmentEmployeeId:"33333333-3333-3333-3333-333333333337", metadataJson:null },
  { tenantId:T1, id:"d4", code:"DEPT-CS",   name:"Computer Science", telephone:null, email:null, campusId:B1, headOfDepartmentEmployeeId:null, metadataJson:null },
  { tenantId:T1, id:"d5", code:"DEPT-ADM",  name:"Administration",   telephone:null, email:null, campusId:B1, headOfDepartmentEmployeeId:null, metadataJson:null },
];

export const MOCK_BRANCH_GENDER_TYPES: BranchGenderType[] = [
  { id:"g1", code:"MIXED",  name:"Mixed (Boys & Girls)" },
  { id:"g2", code:"FEMALE", name:"Girls Only"            },
  { id:"g3", code:"MALE",   name:"Boys Only"             },
];

export const MOCK_EDUCATION_LEVELS: EducationLevel[] = [
  { id:"el1", code:"PRIMARY",    name:"Primary (Grades 1–5)"    },
  { id:"el2", code:"MIDDLE",     name:"Middle (Grades 6–8)"     },
  { id:"el3", code:"SECONDARY",  name:"Secondary (Grades 9–10)" },
  { id:"el4", code:"HIGHER_SEC", name:"Higher Secondary (11–12)"},
];

// ─── Academics ───────────────────────────────────────────────────────────────
export const MOCK_ACADEMIC_YEARS: AcademicYearItem[] = [
  { tenantId:T1, id:AY,    code:"AY-2026", name:"Academic Year 2025-26", metadataJson: JSON.stringify({ campusId:B1, startDate:"2025-04-01", endDate:"2026-03-31", isCurrent:true  }) },
  { tenantId:T1, id:"ay2", code:"AY-2025", name:"Academic Year 2024-25", metadataJson: JSON.stringify({ campusId:B1, startDate:"2024-04-01", endDate:"2025-03-31", isCurrent:false }) },
];
export const MOCK_GRADE_LEVELS: GradeLevelItem[] = [
  { tenantId:T1, id:"gl1", code:"GR-07", name:"Grade 7",  metadataJson:null },
  { tenantId:T1, id:"gl2", code:"GR-08", name:"Grade 8",  metadataJson:null },
  { tenantId:T1, id:"gl3", code:"GR-09", name:"Grade 9",  metadataJson:null },
  { tenantId:T1, id:"gl4", code:"GR-10", name:"Grade 10", metadataJson:null },
  { tenantId:T1, id:"gl5", code:"GR-11", name:"Grade 11", metadataJson:null },
  { tenantId:T1, id:"gl6", code:"GR-12", name:"Grade 12", metadataJson:null },
];
export const MOCK_CLASS_SECTIONS: ClassSectionItem[] = [
  { tenantId:T1, id:CS,    code:"CS-9A",  name:"Grade 9-A",  metadataJson: JSON.stringify({ gradeLevelId:"gl3", campusId:B1 }) },
  { tenantId:T1, id:"cs2", code:"CS-9B",  name:"Grade 9-B",  metadataJson: JSON.stringify({ gradeLevelId:"gl3", campusId:B1 }) },
  { tenantId:T1, id:"cs3", code:"CS-10A", name:"Grade 10-A", metadataJson: JSON.stringify({ gradeLevelId:"gl4", campusId:B1 }) },
  { tenantId:T1, id:"cs4", code:"CS-10B", name:"Grade 10-B", metadataJson: JSON.stringify({ gradeLevelId:"gl4", campusId:B1 }) },
  { tenantId:T1, id:"cs5", code:"CS-11A", name:"Grade 11-A", metadataJson: JSON.stringify({ gradeLevelId:"gl5", campusId:B1 }) },
];
export const MOCK_SUBJECTS: SubjectItem[] = [
  { tenantId:T1, id:"sub1", code:"SUBJ-MATH", name:"Mathematics",   metadataJson:null },
  { tenantId:T1, id:"sub2", code:"SUBJ-PHY",  name:"Physics",       metadataJson:null },
  { tenantId:T1, id:"sub3", code:"SUBJ-CHEM", name:"Chemistry",     metadataJson:null },
  { tenantId:T1, id:"sub4", code:"SUBJ-ENG",  name:"English",       metadataJson:null },
  { tenantId:T1, id:"sub5", code:"SUBJ-CS",   name:"Computer Sci.", metadataJson:null },
  { tenantId:T1, id:"sub6", code:"SUBJ-BIO",  name:"Biology",       metadataJson:null },
  { tenantId:T1, id:"sub7", code:"SUBJ-HIST", name:"History",       metadataJson:null },
  { tenantId:T1, id:"sub8", code:"SUBJ-ISL",  name:"Islamiyat",     metadataJson:null },
];

// ─── Finance ─────────────────────────────────────────────────────────────────
// FeeType now has explicit fields (no MetadataJson)
export const MOCK_FEE_TYPES: FeeTypeItem[] = [
  { tenantId:T1, id:"ft1", code:"FEE-TUI", name:"Tuition Fee",   frequency:"Monthly", isActive:true, description:"Monthly tuition"     },
  { tenantId:T1, id:"ft2", code:"FEE-TRN", name:"Transport Fee", frequency:"Monthly", isActive:true, description:"Bus route fee"        },
  { tenantId:T1, id:"ft3", code:"FEE-LIB", name:"Library Fee",   frequency:"Annual",  isActive:true, description:"Annual library charge" },
  { tenantId:T1, id:"ft4", code:"FEE-LAB", name:"Lab Fee",       frequency:"Term",    isActive:true, description:"Per-term lab usage"   },
  { tenantId:T1, id:"ft5", code:"FEE-SPT", name:"Sports Fee",    frequency:"Annual",  isActive:true, description:"Annual sports charge"  },
  { tenantId:T1, id:"ft6", code:"FEE-ADM", name:"Admission Fee", frequency:"OneTime", isActive:true, description:"One-time admission"   },
];

export const MOCK_INVOICES: InvoiceItem[] = [
  { tenantId:T1, id:"inv1", code:"INV-2026-0892", name:"September Tuition — Ahmed Hassan",   metadataJson: JSON.stringify({ studentId:"22222222-2222-2222-2222-222222222222", amount:4500, status:"PAID",    dueDate:"2026-09-20", feeType:"TUITION"   }) },
  { tenantId:T1, id:"inv2", code:"INV-2026-0891", name:"September Tuition — Sara Malik",     metadataJson: JSON.stringify({ studentId:"22222222-2222-2222-2222-222222222223", amount:4500, status:"PENDING", dueDate:"2026-09-20", feeType:"TUITION"   }) },
  { tenantId:T1, id:"inv3", code:"INV-2026-0890", name:"August Tuition — Omar Raza",         metadataJson: JSON.stringify({ studentId:"22222222-2222-2222-2222-222222222224", amount:4200, status:"OVERDUE", dueDate:"2026-08-05", feeType:"TUITION"   }) },
  { tenantId:T1, id:"inv4", code:"INV-2026-0889", name:"Transport Fee — Fatima Khan",        metadataJson: JSON.stringify({ studentId:"22222222-2222-2222-2222-222222222225", amount:1500, status:"PAID",    dueDate:"2026-09-01", feeType:"TRANSPORT" }) },
  { tenantId:T1, id:"inv5", code:"INV-2026-0888", name:"Lab Fee — Zain Ali",                 metadataJson: JSON.stringify({ studentId:"22222222-2222-2222-2222-222222222226", amount:800,  status:"PENDING", dueDate:"2026-09-20", feeType:"LAB"       }) },
];

// ─── Admissions ──────────────────────────────────────────────────────────────
export const MOCK_INQUIRIES: InquiryItem[] = [
  { tenantId:T1, id:"inq1", code:"INQ-2026-001", name:"Mariam Shah — Grade 9",  metadataJson: JSON.stringify({ applicantFirstName:"Mariam", applicantLastName:"Shah",   guardianName:"Irfan Shah",   guardianPhone:"+92 300 0000001", gradeApplied:"Grade 9",  status:"NEW",          sourceOfInquiry:"Walk-In"    }) },
  { tenantId:T1, id:"inq2", code:"INQ-2026-002", name:"Danish Ali — Grade 7",   metadataJson: JSON.stringify({ applicantFirstName:"Danish", applicantLastName:"Ali",    guardianName:"Shahid Ali",   guardianPhone:"+92 300 0000002", gradeApplied:"Grade 7",  status:"APPROVED",     sourceOfInquiry:"Website"    }) },
  { tenantId:T1, id:"inq3", code:"INQ-2026-003", name:"Sana Butt — Grade 11",   metadataJson: JSON.stringify({ applicantFirstName:"Sana",   applicantLastName:"Butt",   guardianName:"Kamran Butt",  guardianPhone:"+92 300 0000003", gradeApplied:"Grade 11", status:"UNDER_REVIEW",  sourceOfInquiry:"Referral"   }) },
  { tenantId:T1, id:"inq4", code:"INQ-2026-004", name:"Hassan Noor — Grade 8",  metadataJson: JSON.stringify({ applicantFirstName:"Hassan", applicantLastName:"Noor",   guardianName:"Noor Ahmed",   guardianPhone:"+92 300 0000004", gradeApplied:"Grade 8",  status:"ENROLLED",     sourceOfInquiry:"AI Chatbot" }) },
];

// ─── Tenancy ─────────────────────────────────────────────────────────────────
export const MOCK_TENANTS: TenantItem[] = [
  { tenantId:T1,   id:T1,   code:"TNT-001", name:"Al-Noor Academy",      metadataJson: JSON.stringify({ adminEmail:"admin@alnoor.edu.pk",    contactPhone:"+92 42 1234567", city:"Lahore",    subscriptionPlan:"Pro",        studentCount:2840, status:"ACTIVE" }) },
  { tenantId:"t2", id:"t2", code:"TNT-002", name:"Bright Future School",  metadataJson: JSON.stringify({ adminEmail:"admin@brightfuture.edu", contactPhone:"+92 51 9876543", city:"Islamabad", subscriptionPlan:"Enterprise", studentCount:4200, status:"ACTIVE" }) },
  { tenantId:"t3", id:"t3", code:"TNT-003", name:"City Grammar School",   metadataJson: JSON.stringify({ adminEmail:"admin@citygrammar.edu",  contactPhone:"+92 21 5555555", city:"Karachi",   subscriptionPlan:"Trial",      studentCount:890,  status:"TRIAL"  }) },
  { tenantId:"t4", id:"t4", code:"TNT-004", name:"The Knowledge Hub",     metadataJson: JSON.stringify({ adminEmail:"admin@knowledge.edu",    contactPhone:"+92 42 3333333", city:"Lahore",    subscriptionPlan:"Starter",    studentCount:320,  status:"ACTIVE" }) },
];

// ─── Transport ───────────────────────────────────────────────────────────────
export const MOCK_VEHICLES: VehicleItem[] = [
  { tenantId:T1, id:"v1", code:"VEH-BUS01", name:"Bus 01", metadataJson: JSON.stringify({ registrationNumber:"LSQ-441", make:"Hino",   model:"2022",  capacity:45, vehicleType:"BUS", status:"ACTIVE"      }) },
  { tenantId:T1, id:"v2", code:"VEH-BUS02", name:"Bus 02", metadataJson: JSON.stringify({ registrationNumber:"LSQ-882", make:"Hino",   model:"2020",  capacity:42, vehicleType:"BUS", status:"ACTIVE"      }) },
  { tenantId:T1, id:"v3", code:"VEH-VAN01", name:"Van 01", metadataJson: JSON.stringify({ registrationNumber:"LSQ-775", make:"Toyota", model:"Hiace", capacity:14, vehicleType:"VAN", status:"ACTIVE"      }) },
  { tenantId:T1, id:"v4", code:"VEH-BUS03", name:"Bus 03", metadataJson: JSON.stringify({ registrationNumber:"LSQ-334", make:"Hino",   model:"2021",  capacity:45, vehicleType:"BUS", status:"MAINTENANCE" }) },
];
export const MOCK_ROUTES: RouteItem[] = [
  { tenantId:T1, id:"r1", code:"RT-A01", name:"Route A — North City", metadataJson: JSON.stringify({ startPoint:"Gulshan Chowk", endPoint:"School Gate", stops:5, studentCount:36, isActive:true }) },
  { tenantId:T1, id:"r2", code:"RT-B01", name:"Route B — South City", metadataJson: JSON.stringify({ startPoint:"DHA Phase 5",   endPoint:"School Gate", stops:4, studentCount:28, isActive:true }) },
  { tenantId:T1, id:"r3", code:"RT-C01", name:"Route C — East Zone",  metadataJson: JSON.stringify({ startPoint:"Johar Town",    endPoint:"School Gate", stops:6, studentCount:42, isActive:true }) },
];

// ─── Library ─────────────────────────────────────────────────────────────────
export const MOCK_BOOKS: BookItem[] = [
  { tenantId:T1, id:"b1", code:"BK-001", name:"Mathematics Grade 9",    metadataJson: JSON.stringify({ author:"R.D. Sharma",  isbn:"978-81-7009-150-0", category:"Textbook",   totalCopies:8,  availableCopies:6  }) },
  { tenantId:T1, id:"b2", code:"BK-002", name:"Physics Fundamentals",   metadataJson: JSON.stringify({ author:"H.C. Verma",   isbn:"978-81-239-1811-2", category:"Textbook",   totalCopies:5,  availableCopies:2  }) },
  { tenantId:T1, id:"b3", code:"BK-003", name:"English Literature",     metadataJson: JSON.stringify({ author:"Oxford Press", isbn:"978-01-9564-199-4", category:"Literature", totalCopies:10, availableCopies:10 }) },
  { tenantId:T1, id:"b4", code:"BK-004", name:"World History Vol 2",    metadataJson: JSON.stringify({ author:"John Green",   isbn:"978-00-7110-762-4", category:"History",    totalCopies:4,  availableCopies:0  }) },
  { tenantId:T1, id:"b5", code:"BK-005", name:"Computer Science Basics",metadataJson: JSON.stringify({ author:"Peter Norton", isbn:"978-00-7112-452-3", category:"Technology", totalCopies:6,  availableCopies:3  }) },
];

// ─── Examinations ────────────────────────────────────────────────────────────
export const MOCK_EXAMS: ExamItem[] = [
  { tenantId:T1, id:"ex1", code:"EXAM-MID-2026",   name:"Mid-Term Examination 2026",  metadataJson: JSON.stringify({ examType:"MID_TERM",  startDate:"2026-10-01", endDate:"2026-10-10", status:"SCHEDULED",   totalMarks:500 }) },
  { tenantId:T1, id:"ex2", code:"EXAM-UNIT2-2026", name:"Unit Test 2 — Mathematics",  metadataJson: JSON.stringify({ examType:"UNIT_TEST", startDate:"2026-09-05", endDate:"2026-09-05", status:"IN_PROGRESS", totalMarks:100 }) },
  { tenantId:T1, id:"ex3", code:"EXAM-ANN-2025",   name:"Annual Examination 2025",    metadataJson: JSON.stringify({ examType:"ANNUAL",     startDate:"2026-03-01", endDate:"2026-03-15", status:"PUBLISHED",   totalMarks:600 }) },
];

// ─── Communication ───────────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { tenantId:T1, id:"n1", recipientUserId:"usr1", type:1, title:"AI Prediction Alert",    message:"47 students flagged as high dropout risk this term.",        relatedEntityId:null,  relatedEntityType:"Prediction", actionUrl:"/ai",          priority:"HIGH",   isRead:false, readAt:null, occurredAt:"2026-08-30T14:32:00Z" },
  { tenantId:T1, id:"n2", recipientUserId:"usr1", type:2, title:"Payment Received",       message:"PKR 4,500 recorded for Ahmed Hassan (INV-0892).",            relatedEntityId:"inv1",relatedEntityType:"Invoice",    actionUrl:"/finance",     priority:"NORMAL", isRead:false, readAt:null, occurredAt:"2026-08-30T14:15:00Z" },
  { tenantId:T1, id:"n3", recipientUserId:"usr1", type:3, title:"New Admission Request",  message:"Mariam Shah — Grade 9 application submitted.",               relatedEntityId:"inq1",relatedEntityType:"Inquiry",    actionUrl:"/admissions",  priority:"NORMAL", isRead:false, readAt:null, occurredAt:"2026-08-30T13:00:00Z" },
  { tenantId:T1, id:"n4", recipientUserId:"usr1", type:4, title:"Exam Results Published", message:"Grade 10-A Mathematics mid-term results are live.",           relatedEntityId:"ex3", relatedEntityType:"Exam",       actionUrl:"/examinations",priority:"NORMAL", isRead:true,  readAt:"2026-08-30T12:00:00Z", occurredAt:"2026-08-30T11:45:00Z" },
  { tenantId:T1, id:"n5", recipientUserId:"usr1", type:5, title:"Transport Alert",        message:"Bus 03 delayed 12 minutes on Route C.",                      relatedEntityId:"v4",  relatedEntityType:"Vehicle",    actionUrl:"/transport",   priority:"HIGH",   isRead:true,  readAt:"2026-08-30T08:30:00Z", occurredAt:"2026-08-30T07:50:00Z" },
];
export const MOCK_CONVERSATIONS: ChatConversation[] = [
  { tenantId:T1, chatConversationId:"conv1", title:"Grade 9-A Teachers", conversationType:"GROUP",  createdByUserId:"usr1", isClosed:false },
  { tenantId:T1, chatConversationId:"conv2", title:"Parent: Ali Hassan", conversationType:"DIRECT", createdByUserId:"usr1", isClosed:false },
  { tenantId:T1, chatConversationId:"conv3", title:"HR Department",      conversationType:"GROUP",  createdByUserId:"usr2", isClosed:false },
];
export const MOCK_MESSAGES: ChatMessage[] = [
  { tenantId:T1, chatMessageId:"msg1", conversationId:"conv1", senderUserId:"usr1", message:"Good morning! Attendance for today has been submitted.",          sentAt:"2026-08-30T08:15:00Z", editedAt:null },
  { tenantId:T1, chatMessageId:"msg2", conversationId:"conv1", senderUserId:"usr2", message:"Thanks. Please remind students about tomorrow's unit test.",       sentAt:"2026-08-30T08:32:00Z", editedAt:null },
  { tenantId:T1, chatMessageId:"msg3", conversationId:"conv1", senderUserId:"usr1", message:"Done. I've uploaded the revision material to the portal.",         sentAt:"2026-08-30T09:01:00Z", editedAt:null },
];

// ─── AI Core ─────────────────────────────────────────────────────────────────
export const MOCK_MODEL_CONFIGS: ModelConfigItem[] = [
  { tenantId:T1, id:"mc1", code:"MODEL-LLAMA", name:"Llama 3.2 (Ollama)",  metadataJson: JSON.stringify({ provider:"Ollama", modelIdentifier:"llama3.2",  temperature:0.2, maxTokens:4096, isActive:true  }) },
  { tenantId:T1, id:"mc2", code:"MODEL-GPT",   name:"GPT-5 Mini (OpenAI)", metadataJson: JSON.stringify({ provider:"OpenAI", modelIdentifier:"gpt-5-mini", temperature:0.3, maxTokens:2048, isActive:false }) },
];
export const MOCK_COLLECTIONS: KnowledgeCollectionItem[] = [
  { tenantId:T1, id:"kc1", code:"KC-ACADEMIC", name:"Academic Handbook",    metadataJson: JSON.stringify({ slug:"academic", documentCount:12, chunkCount:340, isActive:true }) },
  { tenantId:T1, id:"kc2", code:"KC-POLICY",   name:"School Policy Manual", metadataJson: JSON.stringify({ slug:"policy",   documentCount:8,  chunkCount:210, isActive:true }) },
  { tenantId:T1, id:"kc3", code:"KC-PARENT",   name:"Parent Guidelines",    metadataJson: JSON.stringify({ slug:"parent",   documentCount:5,  chunkCount:140, isActive:true }) },
  { tenantId:T1, id:"kc4", code:"KC-TEACHER",  name:"Teacher Resources",    metadataJson: JSON.stringify({ slug:"teacher",  documentCount:18, chunkCount:520, isActive:true }) },
  { tenantId:T1, id:"kc5", code:"KC-FEES",     name:"Fee Structure 2026",   metadataJson: JSON.stringify({ slug:"fees",     documentCount:3,  chunkCount:85,  isActive:true }) },
];
export const MOCK_EXEC_LOGS: AiExecutionLogItem[] = [
  { tenantId:T1, id:"el1", code:"LOG-001", name:"student-tutor/ask",       metadataJson: JSON.stringify({ actor:"Student", operation:"tutor/ask",       provider:"Ollama", tokenCount:342, durationMs:1823, status:"Success" }) },
  { tenantId:T1, id:"el2", code:"LOG-002", name:"admin/chatbot-ask",       metadataJson: JSON.stringify({ actor:"Admin",   operation:"chatbot/admin",   provider:"Ollama", tokenCount:218, durationMs:1241, status:"Success" }) },
  { tenantId:T1, id:"el3", code:"LOG-003", name:"prediction/dropout",      metadataJson: JSON.stringify({ actor:"System", operation:"prediction/student",provider:"ML",    tokenCount:0,   durationMs:340,  status:"Success" }) },
  { tenantId:T1, id:"el4", code:"LOG-004", name:"parent/chatbot-ask",      metadataJson: JSON.stringify({ actor:"Parent", operation:"chatbot/parent",   provider:"Ollama", tokenCount:185, durationMs:2101, status:"Failure" }) },
];

// ─── Reference / Lookups ─────────────────────────────────────────────────────
export const MOCK_LOOKUP_TYPES = ["GENDER","BLOOD_GROUP","EMPLOYMENT_TYPE","LEAVE_TYPE","NATIONALITY","RELIGION","MARITAL_STATUS"];
export const MOCK_LOOKUP_VALUES: LookupValue[] = [
  { id:"lv1",  typeCode:"GENDER",          code:"MALE",      name:"Male",         sortOrder:1,  isActive:true },
  { id:"lv2",  typeCode:"GENDER",          code:"FEMALE",    name:"Female",       sortOrder:2,  isActive:true },
  { id:"lv3",  typeCode:"BLOOD_GROUP",     code:"A_POS",     name:"A+",           sortOrder:1,  isActive:true },
  { id:"lv4",  typeCode:"BLOOD_GROUP",     code:"B_POS",     name:"B+",           sortOrder:2,  isActive:true },
  { id:"lv5",  typeCode:"BLOOD_GROUP",     code:"O_POS",     name:"O+",           sortOrder:3,  isActive:true },
  { id:"lv6",  typeCode:"BLOOD_GROUP",     code:"AB_POS",    name:"AB+",          sortOrder:4,  isActive:true },
  { id:"lv7",  typeCode:"EMPLOYMENT_TYPE", code:"PERMANENT", name:"Permanent",    sortOrder:1,  isActive:true },
  { id:"lv8",  typeCode:"EMPLOYMENT_TYPE", code:"CONTRACT",  name:"Contract",     sortOrder:2,  isActive:true },
  { id:"lv9",  typeCode:"EMPLOYMENT_TYPE", code:"PART_TIME", name:"Part-time",    sortOrder:3,  isActive:true },
  { id:"lv10", typeCode:"LEAVE_TYPE",      code:"SICK",      name:"Sick Leave",   sortOrder:1,  isActive:true },
  { id:"lv11", typeCode:"LEAVE_TYPE",      code:"CASUAL",    name:"Casual Leave", sortOrder:2,  isActive:true },
  { id:"lv12", typeCode:"LEAVE_TYPE",      code:"ANNUAL",    name:"Annual Leave", sortOrder:3,  isActive:true },
  { id:"lv13", typeCode:"NATIONALITY",     code:"PK",        name:"Pakistani",    sortOrder:1,  isActive:true },
  { id:"lv14", typeCode:"NATIONALITY",     code:"OTHER",     name:"Other",        sortOrder:99, isActive:true },
];

// ─── AI mocks ────────────────────────────────────────────────────────────────
export const MOCK_AI_RESPONSE = {
  answer: "Based on the school knowledge base: students must maintain 75% attendance. Fee is due by 20th of each month. This information is sourced from verified school documents.",
  contextStrategy: "CAG",
  citations: [
    { chunkId:"c1", documentTitle:"Academic Handbook 2026",  relevanceScore:0.94, excerpt:"Students must maintain a minimum of 75% attendance..." },
    { chunkId:"c2", documentTitle:"School Policy Manual",     relevanceScore:0.87, excerpt:"Fee payment is due by the 20th of each month..."      },
  ],
};

// PredictionResult.factors is now string[] per latest backend
export const MOCK_PREDICTION: PredictionResult = {
  kind:"DropoutRisk", score:0.73, probability:0.73,
  riskLevel:"High", outcome:"High dropout risk — immediate intervention recommended",
  confidence:0.89, modelVersion:"v2.1.0", usedMachineLearning:true,
  factors:["Low attendance (72%)","Below-average grades","4 missing assignments","Fee default risk"],
};
export const MOCK_EARLY_WARNINGS: PredictionResult[] = [
  { kind:"DropoutRisk",  score:0.73, probability:0.73, riskLevel:"High",   outcome:"High dropout risk",     confidence:0.89, modelVersion:"v2.1.0", usedMachineLearning:true, factors:["Low attendance","Declining grades"] },
  { kind:"GradeDecline", score:0.55, probability:0.55, riskLevel:"Medium", outcome:"Grade declining trend", confidence:0.81, modelVersion:"v2.1.0", usedMachineLearning:true, factors:["Missed 2 labs","B→C trend"] },
];
