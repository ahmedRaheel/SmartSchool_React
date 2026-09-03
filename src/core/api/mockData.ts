/**
 * SmartSchool Mock Data v3 — all shapes 100% match backend Response records.
 * BranchType: MIXED | MALE | FEMALE
 * AcademicSystem: MATRIC | CAMBRIDGE | OXFORD | FSC | OLEVEL | ALEVEL
 * GradeLevel: Pre-Primary, Primary, Middle, Secondary, Higher Secondary
 */
import type {
  AdminDashboard, StudentDashboard, TeacherDashboard, ParentDashboard, DriverDashboard,
  StudentItem, EmployeeItem, SchoolItem, CampusItem, DepartmentItem,
  FeeTypeItem, AcademicYearItem, GradeLevelItem, ClassSectionItem, SubjectItem,
  TenantItem, InvoiceItem, InquiryItem, VehicleItem, RouteItem, BookItem, ExamItem,
  NotificationItem, ConversationItem, MessageItem,
  ModelConfigItem, KnowledgeCollectionItem, AiExecutionLogItem, LookupValue,
  PredictionResult, BranchGenderType, EducationLevel, PagedResult,
  ActivityItem, AwardItem, WorkflowDefinitionItem, ApprovalItem,
  AssignmentItem, LessonItem, InventoryItem,
} from "./backendContracts";

const T1 = "11111111-1111-1111-1111-111111111111";
const S1 = "22222222-2222-2222-2222-222222222222"; // schoolId matches seed data
const B1 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const B2 = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const B3 = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const AY = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
const CS = "ffffffff-ffff-ffff-ffff-ffffffffffff";

export function page<T>(items: T[], total?: number): PagedResult<T> {
  return { items, page: 1, pageSize: 50, totalCount: total ?? items.length };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const MOCK_ADMIN_DASHBOARD: AdminDashboard = {
  Students: 3240, Guardians: 1890, Employees: 148, Exams: 18,
  Invoices: 3240, OutstandingInvoices: 387, UnreadNotifications: 9,
  Vehicles: 12, Drivers: 8,
  ActiveStudents: 3198, CollectedAmount: 14580000,
  OutstandingAmount: 1742400, PassedResults: 2487, FailedResults: 93,
};
export const MOCK_STUDENT_DASHBOARD: StudentDashboard = {
  StudentId: "s-00001", StudentNumber: "STU-2025-0001",
  FirstName: "Ahmed", LastName: "Hassan",
  Status: "ACTIVE", Enrollments: 6, Results: 22, OutstandingInvoices: 1,
};
export const MOCK_TEACHER_DASHBOARD: TeacherDashboard = {
  EmployeeId: "e-00001", EmployeeNumber: "TCH-041",
  FirstName: "Aisha", LastName: "Siddiqui",
  Status: "ACTIVE", CourseAssignments: 4, PendingLeaves: 0,
};
export const MOCK_PARENT_DASHBOARD: ParentDashboard = {
  GuardianId: "g-00001", FullName: "Ali Hassan",
  Email: "ali.hassan@email.com", Phone: "+92 300 1234567",
  Children: 2, OutstandingInvoices: 1,
};
export const MOCK_DRIVER_DASHBOARD: DriverDashboard = {
  DriverId: "d-00001", DriverNumber: "DRV-001", FullName: "Arif Khan",
  Phone: "+92 321 9876543", Status: "ACTIVE",
  LicenseExpiresOn: "2027-06-15", ActiveVehicleAssignments: 1,
};

// ─── Organization ─────────────────────────────────────────────────────────────
export const MOCK_SCHOOLS: SchoolItem[] = [
  {
    tenantId: T1, id: S1, code: "SCH-001", name: "Al-Noor Academy",
    registrationNumber: "REG-2015-001", email: "info@alnoor.edu.pk",
    phone: "+92 42 1234567", fax: null, website: "www.alnoor.edu.pk",
    address: "123 Model Town", city: "Lahore", province: "Punjab",
    country: "Pakistan", logoUrl: null,
  },
];

// Multi-branch school — Boys, Girls, Mixed; different academic systems
export const MOCK_CAMPUSES: CampusItem[] = [
  {
    tenantId: T1, id: B1, schoolId: S1, code: "BR-001", name: "Main Campus (Boys)",
    branchType: "MALE", branchGenderTypeId: "g3",
    academicSystemId: "as1",
    address: "123 Model Town", city: "Lahore", province: "Punjab",
    country: "Pakistan", phone: "+92 42 1234567", fax: null, mobile: null,
    email: "main@alnoor.edu.pk", logoUrl: null,
  },
  {
    tenantId: T1, id: B2, schoolId: S1, code: "BR-002", name: "Girls Branch",
    branchType: "FEMALE", branchGenderTypeId: "g2",
    academicSystemId: "as2",
    address: "456 Garden Town", city: "Lahore", province: "Punjab",
    country: "Pakistan", phone: "+92 42 7654321", fax: null, mobile: null,
    email: "girls@alnoor.edu.pk", logoUrl: null,
  },
  {
    tenantId: T1, id: B3, schoolId: S1, code: "BR-003", name: "Cambridge Centre (Co-Ed)",
    branchType: "MIXED", branchGenderTypeId: "g1",
    academicSystemId: "as3",
    address: "789 DHA Phase 4", city: "Lahore", province: "Punjab",
    country: "Pakistan", phone: "+92 42 5555555", fax: null, mobile: null,
    email: "cambridge@alnoor.edu.pk", logoUrl: null,
  },
];

export const MOCK_DEPARTMENTS: DepartmentItem[] = [
  { tenantId: T1, id: "dept1", code: "DEPT-MATH", name: "Mathematics",       telephone: null, email: null, campusId: B1, headOfDepartmentEmployeeId: null, metadataJson: null },
  { tenantId: T1, id: "dept2", code: "DEPT-SCI",  name: "Sciences",           telephone: null, email: null, campusId: B1, headOfDepartmentEmployeeId: "e-00001", metadataJson: null },
  { tenantId: T1, id: "dept3", code: "DEPT-ENG",  name: "English & Languages", telephone: null, email: null, campusId: B2, headOfDepartmentEmployeeId: null, metadataJson: null },
  { tenantId: T1, id: "dept4", code: "DEPT-CS",   name: "Computer Science",    telephone: null, email: null, campusId: B3, headOfDepartmentEmployeeId: null, metadataJson: null },
  { tenantId: T1, id: "dept5", code: "DEPT-ADM",  name: "Administration",      telephone: "+92 42 1234560", email: "admin@alnoor.edu.pk", campusId: B1, headOfDepartmentEmployeeId: null, metadataJson: null },
];

export const MOCK_BRANCH_GENDER_TYPES: BranchGenderType[] = [
  { id: "g1", code: "MIXED",  name: "Co-Educational (Boys & Girls)" },
  { id: "g2", code: "FEMALE", name: "Girls Only" },
  { id: "g3", code: "MALE",   name: "Boys Only" },
];

export const MOCK_EDUCATION_LEVELS: EducationLevel[] = [
  { id: "el1", code: "PRE_PRIMARY", name: "Pre-Primary / Kindergarten" },
  { id: "el2", code: "PRIMARY",     name: "Primary (Grades 1–5)" },
  { id: "el3", code: "MIDDLE",      name: "Middle (Grades 6–8)" },
  { id: "el4", code: "SECONDARY",   name: "Secondary / Matric (Grades 9–10)" },
  { id: "el5", code: "HIGHER_SEC",  name: "Higher Secondary / FSc (Grades 11–12)" },
  { id: "el6", code: "OLEVEL",      name: "O-Level (Cambridge)" },
  { id: "el7", code: "ALEVEL",      name: "A-Level (Cambridge)" },
];

// Academic systems — Matric, Cambridge, Oxford, FSc
export const MOCK_ACADEMIC_SYSTEMS = [
  { id: "as1", code: "MATRIC",    name: "Matric System (BISE Punjab)",    metadataJson: null },
  { id: "as2", code: "FSC",       name: "FSc / HSSC",                     metadataJson: null },
  { id: "as3", code: "CAMBRIDGE", name: "Cambridge O/A Level",             metadataJson: null },
  { id: "as4", code: "OXFORD",    name: "Oxford International",            metadataJson: null },
];

// ─── Academics ────────────────────────────────────────────────────────────────
export const MOCK_ACADEMIC_YEARS: AcademicYearItem[] = [
  { tenantId: T1, id: AY,    code: "AY-2026", name: "2025–26", metadataJson: JSON.stringify({ campusId: B1, startDate: "2025-04-01", endDate: "2026-03-31", isCurrent: true  }) },
  { tenantId: T1, id: "ay2", code: "AY-2025", name: "2024–25", metadataJson: JSON.stringify({ campusId: B1, startDate: "2024-04-01", endDate: "2025-03-31", isCurrent: false }) },
  { tenantId: T1, id: "ay3", code: "AY-2026-G", name: "2025–26 (Girls)", metadataJson: JSON.stringify({ campusId: B2, startDate: "2025-04-01", endDate: "2026-03-31", isCurrent: true }) },
  { tenantId: T1, id: "ay4", code: "AY-2026-C", name: "2025–26 (Cambridge)", metadataJson: JSON.stringify({ campusId: B3, startDate: "2025-09-01", endDate: "2026-07-31", isCurrent: true }) },
];

export const MOCK_GRADE_LEVELS: GradeLevelItem[] = [
  { tenantId: T1, id: "gl0",  code: "GR-KG",  name: "Kindergarten",     metadataJson: null },
  { tenantId: T1, id: "gl1",  code: "GR-01",  name: "Grade 1",           metadataJson: null },
  { tenantId: T1, id: "gl2",  code: "GR-05",  name: "Grade 5",           metadataJson: null },
  { tenantId: T1, id: "gl3",  code: "GR-06",  name: "Grade 6",           metadataJson: null },
  { tenantId: T1, id: "gl4",  code: "GR-08",  name: "Grade 8",           metadataJson: null },
  { tenantId: T1, id: "gl5",  code: "GR-09",  name: "Grade 9 (Matric)",  metadataJson: null },
  { tenantId: T1, id: "gl6",  code: "GR-10",  name: "Grade 10 (Matric)", metadataJson: null },
  { tenantId: T1, id: "gl7",  code: "GR-11",  name: "Grade 11 (FSc)",    metadataJson: null },
  { tenantId: T1, id: "gl8",  code: "GR-12",  name: "Grade 12 (FSc)",    metadataJson: null },
  { tenantId: T1, id: "gl9",  code: "OL",     name: "O-Level",            metadataJson: null },
  { tenantId: T1, id: "gl10", code: "AL",     name: "A-Level",            metadataJson: null },
];

export const MOCK_CLASS_SECTIONS: ClassSectionItem[] = [
  { tenantId: T1, id: CS,    code: "9A-B", name: "Grade 9-A (Boys)",        metadataJson: JSON.stringify({ gradeLevelId: "gl5", campusId: B1, branchType: "MALE" }) },
  { tenantId: T1, id: "cs2", code: "9B-B", name: "Grade 9-B (Boys)",        metadataJson: JSON.stringify({ gradeLevelId: "gl5", campusId: B1, branchType: "MALE" }) },
  { tenantId: T1, id: "cs3", code: "9A-G", name: "Grade 9-A (Girls)",       metadataJson: JSON.stringify({ gradeLevelId: "gl5", campusId: B2, branchType: "FEMALE" }) },
  { tenantId: T1, id: "cs4", code: "10A",  name: "Grade 10-A (Boys)",       metadataJson: JSON.stringify({ gradeLevelId: "gl6", campusId: B1, branchType: "MALE" }) },
  { tenantId: T1, id: "cs5", code: "OL-1", name: "O-Level Section 1",       metadataJson: JSON.stringify({ gradeLevelId: "gl9", campusId: B3, branchType: "MIXED" }) },
  { tenantId: T1, id: "cs6", code: "AL-1", name: "A-Level Section 1",       metadataJson: JSON.stringify({ gradeLevelId: "gl10", campusId: B3, branchType: "MIXED" }) },
  { tenantId: T1, id: "cs7", code: "KG-A", name: "Kindergarten A",          metadataJson: JSON.stringify({ gradeLevelId: "gl0", campusId: B1, branchType: "MALE" }) },
];

export const MOCK_SUBJECTS: SubjectItem[] = [
  { tenantId: T1, id: "sub1",  code: "MATH",    name: "Mathematics",         metadataJson: null },
  { tenantId: T1, id: "sub2",  code: "PHY",     name: "Physics",             metadataJson: null },
  { tenantId: T1, id: "sub3",  code: "CHEM",    name: "Chemistry",           metadataJson: null },
  { tenantId: T1, id: "sub4",  code: "ENG",     name: "English",             metadataJson: null },
  { tenantId: T1, id: "sub5",  code: "CS",      name: "Computer Science",    metadataJson: null },
  { tenantId: T1, id: "sub6",  code: "BIO",     name: "Biology",             metadataJson: null },
  { tenantId: T1, id: "sub7",  code: "HIST",    name: "Pakistan Studies",    metadataJson: null },
  { tenantId: T1, id: "sub8",  code: "ISL",     name: "Islamiyat",           metadataJson: null },
  { tenantId: T1, id: "sub9",  code: "URDU",    name: "Urdu",                metadataJson: null },
  { tenantId: T1, id: "sub10", code: "ARABIC",  name: "Arabic",              metadataJson: null },
  { tenantId: T1, id: "sub11", code: "BUS",     name: "Business Studies",    metadataJson: null },
  { tenantId: T1, id: "sub12", code: "ECON",    name: "Economics",           metadataJson: null },
];

// ─── Students ─────────────────────────────────────────────────────────────────
export const MOCK_STUDENTS: StudentItem[] = [
  { tenantId:T1, id:"s-00001", studentNumber:"STU-2025-0001", firstName:"Ahmed",   lastName:"Hassan",    dateOfBirth:"2009-03-15", gender:"Male",   admissionDate:"2024-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"s-00002", studentNumber:"STU-2025-0002", firstName:"Sara",    lastName:"Malik",     dateOfBirth:"2008-07-22", gender:"Female", admissionDate:"2024-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"s-00003", studentNumber:"STU-2025-0003", firstName:"Omar",    lastName:"Raza",      dateOfBirth:"2010-11-08", gender:"Male",   admissionDate:"2024-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"s-00004", studentNumber:"STU-2025-0004", firstName:"Fatima",  lastName:"Khan",      dateOfBirth:"2007-01-30", gender:"Female", admissionDate:"2023-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"s-00005", studentNumber:"STU-2025-0005", firstName:"Zain",    lastName:"Ali",       dateOfBirth:"2011-05-12", gender:"Male",   admissionDate:"2024-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"s-00006", studentNumber:"STU-2025-0006", firstName:"Noor",    lastName:"Siddiqui",  dateOfBirth:"2006-09-03", gender:"Female", admissionDate:"2022-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"s-00007", studentNumber:"STU-2025-0007", firstName:"Hamza",   lastName:"Sheikh",    dateOfBirth:"2009-08-20", gender:"Male",   admissionDate:"2024-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"s-00008", studentNumber:"STU-2025-0008", firstName:"Ayesha",  lastName:"Tariq",     dateOfBirth:"2010-02-14", gender:"Female", admissionDate:"2024-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"s-00009", studentNumber:"STU-2025-0009", firstName:"Bilal",   lastName:"Khan",      dateOfBirth:"2011-06-25", gender:"Male",   admissionDate:"2024-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"s-00010", studentNumber:"STU-2025-0010", firstName:"Hina",    lastName:"Raza",      dateOfBirth:"2009-12-05", gender:"Female", admissionDate:"2024-04-01", status:"PENDING" },
  { tenantId:T1, id:"s-00011", studentNumber:"STU-2025-0011", firstName:"Usman",   lastName:"Mahmood",   dateOfBirth:"2008-04-18", gender:"Male",   admissionDate:"2023-04-01", status:"ACTIVE"  },
  { tenantId:T1, id:"s-00012", studentNumber:"STU-2025-0012", firstName:"Mariam",  lastName:"Shah",      dateOfBirth:"2007-11-29", gender:"Female", admissionDate:"2023-04-01", status:"ACTIVE"  },
];
export const MOCK_STUDENTS_PAGE = page(MOCK_STUDENTS, 3240);

// ─── Employees ────────────────────────────────────────────────────────────────
export const MOCK_EMPLOYEES: EmployeeItem[] = [
  { tenantId:T1, id:"e-00001", employeeNumber:"TCH-041", firstName:"Aisha",   lastName:"Siddiqui", cnicNumber:"35202-1234567-8", dateOfBirth:"1985-06-12", gender:"Female", jobTitle:"Senior Maths Teacher",    department:"Mathematics",     qualification:"MSc Mathematics", email:"aisha@alnoor.edu", phone:"+92 300 1111111", alternatePhone:null, address:"Model Town, Lahore",    emergencyContactName:"Hassan Siddiqui", emergencyContactPhone:"+92 300 9999999", hireDate:"2021-09-01", employmentTypeCode:"PERMANENT", staffType:"TEACHER",       status:"ACTIVE"   },
  { tenantId:T1, id:"e-00002", employeeNumber:"TCH-022", firstName:"Tariq",   lastName:"Jameel",   cnicNumber:"35202-2345678-9", dateOfBirth:"1980-03-22", gender:"Male",   jobTitle:"Physics Teacher",          department:"Sciences",         qualification:"MSc Physics",    email:"tariq@alnoor.edu", phone:"+92 300 2222222", alternatePhone:null, address:"Gulberg, Lahore",       emergencyContactName:"Jameel Ahmed",    emergencyContactPhone:"+92 300 8888888", hireDate:"2019-08-15", employmentTypeCode:"PERMANENT", staffType:"TEACHER",       status:"ACTIVE"   },
  { tenantId:T1, id:"e-00003", employeeNumber:"ADM-010", firstName:"Farah",   lastName:"Khan",     cnicNumber:"35202-3456789-0", dateOfBirth:"1988-11-05", gender:"Female", jobTitle:"Admin Officer",            department:"Administration",   qualification:"MBA",            email:"farah@alnoor.edu", phone:"+92 300 3333333", alternatePhone:null, address:"DHA, Lahore",          emergencyContactName:"Arif Khan",       emergencyContactPhone:"+92 300 7777777", hireDate:"2020-03-01", employmentTypeCode:"PERMANENT", staffType:"ADMIN_OFFICER", status:"ON_LEAVE" },
  { tenantId:T1, id:"e-00004", employeeNumber:"TCH-055", firstName:"Noman",   lastName:"Arif",     cnicNumber:"35202-4567890-1", dateOfBirth:"1982-09-18", gender:"Male",   jobTitle:"CS & ICT Teacher",         department:"Computer Science", qualification:"MCS",            email:"noman@alnoor.edu", phone:"+92 300 4444444", alternatePhone:null, address:"Johar Town, Lahore",   emergencyContactName:"Arif Noman",      emergencyContactPhone:"+92 300 6666666", hireDate:"2020-03-15", employmentTypeCode:"PERMANENT", staffType:"TEACHER",       status:"ACTIVE"   },
  { tenantId:T1, id:"e-00005", employeeNumber:"HOD-003", firstName:"Rehana",  lastName:"Pervez",   cnicNumber:"35202-5678901-2", dateOfBirth:"1975-04-30", gender:"Female", jobTitle:"Head of Languages Dept",   department:"English",          qualification:"MA English",     email:"rehana@alnoor.edu",phone:"+92 300 5555555", alternatePhone:null, address:"Bahria Town, Lahore",  emergencyContactName:"Pervez Ahmad",    emergencyContactPhone:"+92 300 5555000", hireDate:"2018-01-10", employmentTypeCode:"PERMANENT", staffType:"TEACHER",       status:"ACTIVE"   },
  { tenantId:T1, id:"e-00006", employeeNumber:"DRV-001", firstName:"Arif",    lastName:"Khan",     cnicNumber:"35202-6789012-3", dateOfBirth:"1975-07-15", gender:"Male",   jobTitle:"Senior Bus Driver",        department:"Transport",        qualification:null,             email:null,               phone:"+92 321 9876543", alternatePhone:null, address:"Shahdara, Lahore",     emergencyContactName:"Bilal Khan",      emergencyContactPhone:"+92 321 1234567", hireDate:"2019-06-01", employmentTypeCode:"CONTRACT",  staffType:"DRIVER",        status:"ACTIVE"   },
  { tenantId:T1, id:"e-00007", employeeNumber:"ACC-002", firstName:"Sana",    lastName:"Baig",     cnicNumber:"35202-7890123-4", dateOfBirth:"1990-02-14", gender:"Female", jobTitle:"Accounts Officer",         department:"Finance",          qualification:"ACCA",           email:"sana@alnoor.edu",  phone:"+92 300 6666666", alternatePhone:null, address:"Model Town, Lahore",   emergencyContactName:"Baig Sahab",      emergencyContactPhone:"+92 300 4444000", hireDate:"2022-01-01", employmentTypeCode:"PERMANENT", staffType:"ACCOUNTANT",    status:"ACTIVE"   },
];
export const MOCK_EMPLOYEES_PAGE = page(MOCK_EMPLOYEES, 148);

// ─── Finance ──────────────────────────────────────────────────────────────────
export const MOCK_FEE_TYPES: FeeTypeItem[] = [
  { tenantId:T1, id:"ft1", code:"FEE-TUI",  name:"Tuition Fee",         frequency:"Monthly", isActive:true,  description:"Monthly tuition charge"     },
  { tenantId:T1, id:"ft2", code:"FEE-TRN",  name:"Transport Fee",       frequency:"Monthly", isActive:true,  description:"School bus monthly fee"      },
  { tenantId:T1, id:"ft3", code:"FEE-LIB",  name:"Library Fee",         frequency:"Annual",  isActive:true,  description:"Annual library membership"   },
  { tenantId:T1, id:"ft4", code:"FEE-LAB",  name:"Lab Fee",             frequency:"Term",    isActive:true,  description:"Science/CS lab per term"    },
  { tenantId:T1, id:"ft5", code:"FEE-SPT",  name:"Sports Fee",          frequency:"Annual",  isActive:true,  description:"Annual sports activities"    },
  { tenantId:T1, id:"ft6", code:"FEE-ADM",  name:"Admission Fee",       frequency:"OneTime", isActive:true,  description:"One-time admission charge"   },
  { tenantId:T1, id:"ft7", code:"FEE-EXAM", name:"Examination Fee",     frequency:"Term",    isActive:true,  description:"Per-term exam fee"          },
  { tenantId:T1, id:"ft8", code:"FEE-ACT",  name:"Activity Fee",        frequency:"Annual",  isActive:false, description:"Co-curricular activities"   },
];

export const MOCK_INVOICES: InvoiceItem[] = [
  { tenantId:T1, id:"inv1", code:"INV-2026-0892", name:"Sep Tuition — Ahmed Hassan",   metadataJson: JSON.stringify({ studentId:"s-00001", amount:4500,  status:"PAID",    dueDate:"2026-09-20", feeTypeCode:"FEE-TUI" }) },
  { tenantId:T1, id:"inv2", code:"INV-2026-0891", name:"Sep Tuition — Sara Malik",     metadataJson: JSON.stringify({ studentId:"s-00002", amount:4500,  status:"PENDING", dueDate:"2026-09-20", feeTypeCode:"FEE-TUI" }) },
  { tenantId:T1, id:"inv3", code:"INV-2026-0890", name:"Aug Tuition — Omar Raza",      metadataJson: JSON.stringify({ studentId:"s-00003", amount:4200,  status:"OVERDUE", dueDate:"2026-08-05", feeTypeCode:"FEE-TUI" }) },
  { tenantId:T1, id:"inv4", code:"INV-2026-0889", name:"Transport — Fatima Khan",      metadataJson: JSON.stringify({ studentId:"s-00004", amount:1500,  status:"PAID",    dueDate:"2026-09-01", feeTypeCode:"FEE-TRN" }) },
  { tenantId:T1, id:"inv5", code:"INV-2026-0888", name:"Lab Fee — Zain Ali",           metadataJson: JSON.stringify({ studentId:"s-00005", amount:800,   status:"PENDING", dueDate:"2026-09-20", feeTypeCode:"FEE-LAB" }) },
  { tenantId:T1, id:"inv6", code:"INV-2026-0887", name:"Admission — Noor Siddiqui",   metadataJson: JSON.stringify({ studentId:"s-00006", amount:5000,  status:"PAID",    dueDate:"2026-04-01", feeTypeCode:"FEE-ADM" }) },
];

// ─── Admissions ───────────────────────────────────────────────────────────────
export const MOCK_INQUIRIES: InquiryItem[] = [
  { tenantId:T1, id:"inq1", code:"INQ-2026-001", name:"Mariam Shah — Grade 9",   metadataJson: JSON.stringify({ applicantFirstName:"Mariam",  lastName:"Shah",   guardianName:"Irfan Shah",  guardianPhone:"+92 300 0000001", gradeApplied:"Grade 9",  branch:"Main Campus", status:"NEW",          source:"Walk-In"   }) },
  { tenantId:T1, id:"inq2", code:"INQ-2026-002", name:"Danish Ali — Grade 7",    metadataJson: JSON.stringify({ applicantFirstName:"Danish",   lastName:"Ali",    guardianName:"Shahid Ali",  guardianPhone:"+92 300 0000002", gradeApplied:"Grade 7",  branch:"Main Campus", status:"APPROVED",     source:"Website"   }) },
  { tenantId:T1, id:"inq3", code:"INQ-2026-003", name:"Sana Butt — O-Level",     metadataJson: JSON.stringify({ applicantFirstName:"Sana",     lastName:"Butt",   guardianName:"Kamran Butt", guardianPhone:"+92 300 0000003", gradeApplied:"O-Level",  branch:"Cambridge",   status:"UNDER_REVIEW", source:"Referral"  }) },
  { tenantId:T1, id:"inq4", code:"INQ-2026-004", name:"Hassan Noor — Grade 8",   metadataJson: JSON.stringify({ applicantFirstName:"Hassan",   lastName:"Noor",   guardianName:"Noor Ahmed",  guardianPhone:"+92 300 0000004", gradeApplied:"Grade 8",  branch:"Girls Branch", status:"ENROLLED",    source:"AI Chatbot"}) },
  { tenantId:T1, id:"inq5", code:"INQ-2026-005", name:"Zara Ali — A-Level",      metadataJson: JSON.stringify({ applicantFirstName:"Zara",     lastName:"Ali",    guardianName:"Ali Raza",    guardianPhone:"+92 300 0000005", gradeApplied:"A-Level",  branch:"Cambridge",   status:"NEW",          source:"Phone"     }) },
];

// ─── Tenancy ──────────────────────────────────────────────────────────────────
export const MOCK_TENANTS: TenantItem[] = [
  { tenantId:T1,   id:T1,   code:"TNT-001", name:"Al-Noor Academy",      metadataJson: JSON.stringify({ adminEmail:"admin@alnoor.edu.pk",    city:"Lahore",    plan:"Pro",        students:3240, status:"ACTIVE", branches:3 }) },
  { tenantId:"t2", id:"t2", code:"TNT-002", name:"Bright Future School",  metadataJson: JSON.stringify({ adminEmail:"admin@brightfuture.edu", city:"Islamabad", plan:"Enterprise", students:4800, status:"ACTIVE", branches:5 }) },
  { tenantId:"t3", id:"t3", code:"TNT-003", name:"City Grammar School",   metadataJson: JSON.stringify({ adminEmail:"admin@cgs.edu",          city:"Karachi",   plan:"Trial",      students:920,  status:"TRIAL",  branches:1 }) },
  { tenantId:"t4", id:"t4", code:"TNT-004", name:"The Knowledge Hub",     metadataJson: JSON.stringify({ adminEmail:"admin@knowledge.edu",   city:"Lahore",    plan:"Starter",    students:340,  status:"ACTIVE", branches:2 }) },
];

// ─── Transport ────────────────────────────────────────────────────────────────
export const MOCK_VEHICLES: VehicleItem[] = [
  { tenantId:T1, id:"v1", code:"VEH-BUS01", name:"Bus 01 — Main Route A",  metadataJson: JSON.stringify({ regNo:"LSQ-441", make:"Hino",  model:"2022", capacity:45, type:"BUS",     status:"ACTIVE",      driver:"Arif Khan",    route:"Route A"   }) },
  { tenantId:T1, id:"v2", code:"VEH-BUS02", name:"Bus 02 — DHA Route",    metadataJson: JSON.stringify({ regNo:"LSQ-882", make:"Hino",  model:"2020", capacity:42, type:"BUS",     status:"ACTIVE",      driver:"Kamran Shah",  route:"Route B"   }) },
  { tenantId:T1, id:"v3", code:"VEH-VAN01", name:"Van 01 — Gulberg",      metadataJson: JSON.stringify({ regNo:"LSQ-775", make:"Toyota",model:"Hiace",capacity:14, type:"VAN",     status:"ACTIVE",      driver:"Usman Ali",    route:"Route C"   }) },
  { tenantId:T1, id:"v4", code:"VEH-BUS03", name:"Bus 03 — Under Service",metadataJson: JSON.stringify({ regNo:"LSQ-334", make:"Hino",  model:"2021", capacity:45, type:"BUS",     status:"MAINTENANCE", driver:"",             route:""          }) },
  { tenantId:T1, id:"v5", code:"VEH-BUS04", name:"Bus 04 — Garden Town",  metadataJson: JSON.stringify({ regNo:"LSQ-991", make:"Hino",  model:"2023", capacity:45, type:"BUS",     status:"ACTIVE",      driver:"Rafiq Ahmed",  route:"Route D"   }) },
];
export const MOCK_ROUTES: VehicleItem[] = [
  { tenantId:T1, id:"r1", code:"RT-A", name:"Route A — North City",   metadataJson: JSON.stringify({ from:"Gulshan Chowk", to:"School Gate", stops:5, students:36, isActive:true }) },
  { tenantId:T1, id:"r2", code:"RT-B", name:"Route B — DHA",          metadataJson: JSON.stringify({ from:"DHA Phase 5",   to:"School Gate", stops:4, students:28, isActive:true }) },
  { tenantId:T1, id:"r3", code:"RT-C", name:"Route C — Gulberg",      metadataJson: JSON.stringify({ from:"Gulberg III",   to:"School Gate", stops:6, students:42, isActive:true }) },
  { tenantId:T1, id:"r4", code:"RT-D", name:"Route D — Garden Town",  metadataJson: JSON.stringify({ from:"Garden Town",   to:"School Gate", stops:5, students:33, isActive:true }) },
];

// ─── Library ──────────────────────────────────────────────────────────────────
export const MOCK_BOOKS: BookItem[] = [
  { tenantId:T1, id:"b1", code:"BK-001", name:"Mathematics Grade 9",     metadataJson: JSON.stringify({ author:"R.D. Sharma",   isbn:"978-81-7009-150-0", category:"Textbook",   total:8,  available:6  }) },
  { tenantId:T1, id:"b2", code:"BK-002", name:"Physics Fundamentals",    metadataJson: JSON.stringify({ author:"H.C. Verma",    isbn:"978-81-239-1811-2", category:"Textbook",   total:5,  available:2  }) },
  { tenantId:T1, id:"b3", code:"BK-003", name:"English Literature",      metadataJson: JSON.stringify({ author:"Oxford Press",  isbn:"978-01-9564-199-4", category:"Literature", total:10, available:10 }) },
  { tenantId:T1, id:"b4", code:"BK-004", name:"Pakistan Studies",        metadataJson: JSON.stringify({ author:"Punjab TB",     isbn:"978-99-0001-000-1", category:"Textbook",   total:12, available:0  }) },
  { tenantId:T1, id:"b5", code:"BK-005", name:"Computer Science (IGCSE)",metadataJson: JSON.stringify({ author:"Cambridge Int", isbn:"978-11-0780-298-4", category:"Cambridge",  total:6,  available:3  }) },
];

// ─── Examinations ─────────────────────────────────────────────────────────────
export const MOCK_EXAMS: ExamItem[] = [
  { tenantId:T1, id:"ex1", code:"EXAM-MID-2026",   name:"Mid-Term 2026 (Boys Campus)",  metadataJson: JSON.stringify({ type:"MID_TERM", start:"2026-10-01", end:"2026-10-10", campusId:B1, status:"SCHEDULED",   marks:500 }) },
  { tenantId:T1, id:"ex2", code:"EXAM-UNIT2-2026", name:"Unit Test 2 — Mathematics",   metadataJson: JSON.stringify({ type:"UNIT_TEST",start:"2026-09-05", end:"2026-09-05", campusId:B1, status:"IN_PROGRESS", marks:100 }) },
  { tenantId:T1, id:"ex3", code:"EXAM-ANN-2025",   name:"Annual Exam 2025",            metadataJson: JSON.stringify({ type:"ANNUAL",   start:"2026-03-01", end:"2026-03-15", campusId:B1, status:"PUBLISHED",   marks:600 }) },
  { tenantId:T1, id:"ex4", code:"EXAM-OL-MAY26",   name:"O-Level May/June 2026",       metadataJson: JSON.stringify({ type:"OLEVEL",   start:"2026-05-01", end:"2026-06-15", campusId:B3, status:"SCHEDULED",   marks:700 }) },
];

// ─── Communication ────────────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { tenantId:T1, id:"n1", recipientUserId:"u1", type:1, title:"AI Alert: Dropout Risk",   message:"47 students flagged as high dropout risk — immediate intervention needed.", relatedEntityId:null, relatedEntityType:"Prediction", actionUrl:"/ai", priority:"HIGH",   isRead:false, readAt:null, occurredAt:"2026-08-31T10:32:00Z" },
  { tenantId:T1, id:"n2", recipientUserId:"u1", type:2, title:"Payment Collected",         message:"PKR 4,500 received — Ahmed Hassan (INV-2026-0892).",                        relatedEntityId:"inv1",relatedEntityType:"Invoice",    actionUrl:"/finance", priority:"NORMAL", isRead:false, readAt:null, occurredAt:"2026-08-31T09:15:00Z" },
  { tenantId:T1, id:"n3", recipientUserId:"u1", type:3, title:"New Admission Inquiry",     message:"5 new inquiries submitted today — 2 O-Level, 3 Matric.",                   relatedEntityId:"inq1",relatedEntityType:"Inquiry",    actionUrl:"/admissions", priority:"NORMAL", isRead:false, readAt:null, occurredAt:"2026-08-31T08:00:00Z" },
  { tenantId:T1, id:"n4", recipientUserId:"u1", type:4, title:"Result Published",          message:"Grade 10-A Mathematics mid-term results are live.",                        relatedEntityId:"ex3", relatedEntityType:"Exam",       actionUrl:"/examinations", priority:"NORMAL", isRead:true,  readAt:"2026-08-31T07:00:00Z", occurredAt:"2026-08-31T06:45:00Z" },
  { tenantId:T1, id:"n5", recipientUserId:"u1", type:5, title:"Bus 03 Maintenance Alert",  message:"Bus 03 is under maintenance. Route A reassigned to Bus 05.",               relatedEntityId:"v4",  relatedEntityType:"Vehicle",    actionUrl:"/transport", priority:"HIGH",   isRead:true,  readAt:"2026-08-30T08:30:00Z", occurredAt:"2026-08-30T07:50:00Z" },
];

export const MOCK_CONVERSATIONS: ConversationItem[] = [
  { tenantId:T1, id:"conv1", code:"CV-001", name:"Grade 9-A Teachers Group",   metadataJson: JSON.stringify({ type:"GROUP",  memberCount:6 }) },
  { tenantId:T1, id:"conv2", code:"CV-002", name:"Parent: Ali Hassan",          metadataJson: JSON.stringify({ type:"DIRECT", memberCount:2 }) },
  { tenantId:T1, id:"conv3", code:"CV-003", name:"Cambridge Section Teachers",  metadataJson: JSON.stringify({ type:"GROUP",  memberCount:8 }) },
  { tenantId:T1, id:"conv4", code:"CV-004", name:"HR Announcements",            metadataJson: JSON.stringify({ type:"BROADCAST", memberCount:148 }) },
];

export const MOCK_MESSAGES: MessageItem[] = [
  { tenantId:T1, id:"msg1", code:"MSG-001", name:"Attendance submitted",      metadataJson: JSON.stringify({ convId:"conv1", sender:"Aisha Siddiqui", text:"Morning! Attendance submitted for Grade 9-A.", sentAt:"2026-08-31T08:15:00Z" }) },
  { tenantId:T1, id:"msg2", code:"MSG-002", name:"Unit test reminder",         metadataJson: JSON.stringify({ convId:"conv1", sender:"Principal",      text:"Please remind students about tomorrow's unit test.", sentAt:"2026-08-31T08:32:00Z" }) },
  { tenantId:T1, id:"msg3", code:"MSG-003", name:"Revision material shared",   metadataJson: JSON.stringify({ convId:"conv1", sender:"Aisha Siddiqui", text:"Revision material uploaded to portal.", sentAt:"2026-08-31T09:01:00Z" }) },
];

// ─── AI ───────────────────────────────────────────────────────────────────────
export const MOCK_MODEL_CONFIGS: ModelConfigItem[] = [
  { tenantId:T1, id:"mc1", code:"MODEL-LLAMA",  name:"Llama 3.2 (Ollama — Primary)", metadataJson: JSON.stringify({ provider:"Ollama",     model:"llama3.2",   temp:0.2, maxTokens:4096, active:true  }) },
  { tenantId:T1, id:"mc2", code:"MODEL-MISTRAL",name:"Mistral 7B (Ollama)",          metadataJson: JSON.stringify({ provider:"Ollama",     model:"mistral",    temp:0.3, maxTokens:2048, active:false }) },
  { tenantId:T1, id:"mc3", code:"MODEL-GPT5",   name:"GPT-5 Mini (OpenAI)",          metadataJson: JSON.stringify({ provider:"OpenAI",    model:"gpt-5-mini",  temp:0.2, maxTokens:4096, active:false }) },
];
export const MOCK_COLLECTIONS: KnowledgeCollectionItem[] = [
  { tenantId:T1, id:"kc1", code:"KC-ACADEMIC", name:"Academic Handbook",    metadataJson: JSON.stringify({ slug:"academic",    docs:12, chunks:340, active:true }) },
  { tenantId:T1, id:"kc2", code:"KC-POLICY",   name:"School Policy Manual", metadataJson: JSON.stringify({ slug:"policy",      docs:8,  chunks:210, active:true }) },
  { tenantId:T1, id:"kc3", code:"KC-PARENT",   name:"Parent Guidelines",    metadataJson: JSON.stringify({ slug:"parent",      docs:5,  chunks:140, active:true }) },
  { tenantId:T1, id:"kc4", code:"KC-TEACHER",  name:"Teacher Resources",    metadataJson: JSON.stringify({ slug:"teacher",     docs:18, chunks:520, active:true }) },
  { tenantId:T1, id:"kc5", code:"KC-FEES",     name:"Fee Structure 2026",   metadataJson: JSON.stringify({ slug:"fees",        docs:3,  chunks:85,  active:true }) },
  { tenantId:T1, id:"kc6", code:"KC-CAMB",     name:"Cambridge Syllabus",   metadataJson: JSON.stringify({ slug:"cambridge",   docs:24, chunks:780, active:true }) },
];
export const MOCK_EXEC_LOGS: AiExecutionLogItem[] = [
  { tenantId:T1, id:"el1", code:"LOG-001", name:"tutor/ask",           metadataJson: JSON.stringify({ actor:"Student", op:"aitutor/ask",     provider:"Ollama", tokens:342, ms:1823, status:"Success", at:"2026-08-31T10:30:00Z" }) },
  { tenantId:T1, id:"el2", code:"LOG-002", name:"admin-chatbot/ask",   metadataJson: JSON.stringify({ actor:"Admin",   op:"chatbot/admin",   provider:"Ollama", tokens:218, ms:1241, status:"Success", at:"2026-08-31T10:22:00Z" }) },
  { tenantId:T1, id:"el3", code:"LOG-003", name:"prediction/dropout",  metadataJson: JSON.stringify({ actor:"System", op:"prediction",       provider:"ML",     tokens:0,   ms:340,  status:"Success", at:"2026-08-31T10:00:00Z" }) },
  { tenantId:T1, id:"el4", code:"LOG-004", name:"parent-chatbot/ask",  metadataJson: JSON.stringify({ actor:"Parent", op:"chatbot/parent",   provider:"Ollama", tokens:185, ms:2101, status:"Failure", at:"2026-08-31T09:45:00Z" }) },
  { tenantId:T1, id:"el5", code:"LOG-005", name:"rag-assistant/ask",   metadataJson: JSON.stringify({ actor:"Teacher",op:"assistant/ask",    provider:"Ollama", tokens:410, ms:2450, status:"Success", at:"2026-08-31T09:30:00Z" }) },
];

// ─── Reference / Lookups ──────────────────────────────────────────────────────
export const MOCK_LOOKUP_TYPES = [
  "GENDER","BLOOD_GROUP","EMPLOYMENT_TYPE","LEAVE_TYPE",
  "NATIONALITY","RELIGION","MARITAL_STATUS","BRANCH_TYPE","ACADEMIC_SYSTEM",
  "CITY","PROVINCE","COUNTRY",
];
export const MOCK_LOOKUP_VALUES: LookupValue[] = [
  { id:"lv1",  typeCode:"GENDER",          code:"MALE",       name:"Male",              sortOrder:1,  isActive:true },
  { id:"lv2",  typeCode:"GENDER",          code:"FEMALE",     name:"Female",            sortOrder:2,  isActive:true },
  { id:"lv3",  typeCode:"BLOOD_GROUP",     code:"A_POS",      name:"A+",                sortOrder:1,  isActive:true },
  { id:"lv4",  typeCode:"BLOOD_GROUP",     code:"B_POS",      name:"B+",                sortOrder:2,  isActive:true },
  { id:"lv5",  typeCode:"BLOOD_GROUP",     code:"O_POS",      name:"O+",                sortOrder:3,  isActive:true },
  { id:"lv6",  typeCode:"BLOOD_GROUP",     code:"AB_POS",     name:"AB+",               sortOrder:4,  isActive:true },
  { id:"lv7",  typeCode:"EMPLOYMENT_TYPE", code:"PERMANENT",  name:"Permanent",         sortOrder:1,  isActive:true },
  { id:"lv8",  typeCode:"EMPLOYMENT_TYPE", code:"CONTRACT",   name:"Contract",          sortOrder:2,  isActive:true },
  { id:"lv9",  typeCode:"EMPLOYMENT_TYPE", code:"PART_TIME",  name:"Part-time",         sortOrder:3,  isActive:true },
  { id:"lv10", typeCode:"LEAVE_TYPE",      code:"SICK",       name:"Sick Leave",        sortOrder:1,  isActive:true },
  { id:"lv11", typeCode:"LEAVE_TYPE",      code:"CASUAL",     name:"Casual Leave",      sortOrder:2,  isActive:true },
  { id:"lv12", typeCode:"LEAVE_TYPE",      code:"ANNUAL",     name:"Annual Leave",      sortOrder:3,  isActive:true },
  { id:"lv13", typeCode:"NATIONALITY",     code:"PK",         name:"Pakistani",         sortOrder:1,  isActive:true },
  { id:"lv14", typeCode:"NATIONALITY",     code:"OTHER",      name:"Other",             sortOrder:99, isActive:true },
  { id:"lv15", typeCode:"ACADEMIC_SYSTEM", code:"MATRIC",     name:"Matric (BISE)",     sortOrder:1,  isActive:true },
  { id:"lv16", typeCode:"ACADEMIC_SYSTEM", code:"CAMBRIDGE",  name:"Cambridge O/A",     sortOrder:2,  isActive:true },
  { id:"lv17", typeCode:"ACADEMIC_SYSTEM", code:"FSC",        name:"FSc / HSSC",        sortOrder:3,  isActive:true },
  { id:"lv18", typeCode:"ACADEMIC_SYSTEM", code:"OXFORD",     name:"Oxford Intl",       sortOrder:4,  isActive:true },
  { id:"lv19", typeCode:"BRANCH_TYPE",     code:"MIXED",      name:"Co-Educational",    sortOrder:1,  isActive:true },
  { id:"lv20", typeCode:"BRANCH_TYPE",     code:"MALE",       name:"Boys Only",         sortOrder:2,  isActive:true },
  { id:"lv21", typeCode:"BRANCH_TYPE",     code:"FEMALE",     name:"Girls Only",        sortOrder:3,  isActive:true },
  // ── Provinces ────────────────────────────────────────────────────────────
  { id:"lv30", typeCode:"PROVINCE", code:"PB",  name:"Punjab",                       sortOrder:1,  isActive:true },
  { id:"lv31", typeCode:"PROVINCE", code:"SD",  name:"Sindh",                        sortOrder:2,  isActive:true },
  { id:"lv32", typeCode:"PROVINCE", code:"KP",  name:"Khyber Pakhtunkhwa (KPK)",     sortOrder:3,  isActive:true },
  { id:"lv33", typeCode:"PROVINCE", code:"BL",  name:"Balochistan",                  sortOrder:4,  isActive:true },
  { id:"lv34", typeCode:"PROVINCE", code:"ICT", name:"Islamabad Capital Territory",  sortOrder:5,  isActive:true },
  { id:"lv35", typeCode:"PROVINCE", code:"AJK", name:"Azad Jammu & Kashmir",         sortOrder:6,  isActive:true },
  { id:"lv36", typeCode:"PROVINCE", code:"GB",  name:"Gilgit-Baltistan",             sortOrder:7,  isActive:true },
  // ── Cities ───────────────────────────────────────────────────────────────
  { id:"lv50", typeCode:"CITY", code:"LHR", name:"Lahore",       sortOrder:1,  isActive:true },
  { id:"lv51", typeCode:"CITY", code:"FSD", name:"Faisalabad",   sortOrder:2,  isActive:true },
  { id:"lv52", typeCode:"CITY", code:"RWP", name:"Rawalpindi",   sortOrder:3,  isActive:true },
  { id:"lv53", typeCode:"CITY", code:"GUJ", name:"Gujranwala",   sortOrder:4,  isActive:true },
  { id:"lv54", typeCode:"CITY", code:"MUL", name:"Multan",       sortOrder:5,  isActive:true },
  { id:"lv55", typeCode:"CITY", code:"SIA", name:"Sialkot",      sortOrder:6,  isActive:true },
  { id:"lv56", typeCode:"CITY", code:"BWP", name:"Bahawalpur",   sortOrder:7,  isActive:true },
  { id:"lv57", typeCode:"CITY", code:"SGH", name:"Sargodha",     sortOrder:8,  isActive:true },
  { id:"lv58", typeCode:"CITY", code:"SKP", name:"Sheikhupura",  sortOrder:9,  isActive:true },
  { id:"lv59", typeCode:"CITY", code:"JHG", name:"Jhang",        sortOrder:10, isActive:true },
  { id:"lv60", typeCode:"CITY", code:"KHI", name:"Karachi",      sortOrder:11, isActive:true },
  { id:"lv61", typeCode:"CITY", code:"HYD", name:"Hyderabad",    sortOrder:12, isActive:true },
  { id:"lv62", typeCode:"CITY", code:"SUK", name:"Sukkur",       sortOrder:13, isActive:true },
  { id:"lv63", typeCode:"CITY", code:"LRK", name:"Larkana",      sortOrder:14, isActive:true },
  { id:"lv64", typeCode:"CITY", code:"NWS", name:"Nawabshah",    sortOrder:15, isActive:true },
  { id:"lv65", typeCode:"CITY", code:"PEW", name:"Peshawar",     sortOrder:16, isActive:true },
  { id:"lv66", typeCode:"CITY", code:"MRD", name:"Mardan",       sortOrder:17, isActive:true },
  { id:"lv67", typeCode:"CITY", code:"ABT", name:"Abbottabad",   sortOrder:18, isActive:true },
  { id:"lv68", typeCode:"CITY", code:"MNG", name:"Mingora",      sortOrder:19, isActive:true },
  { id:"lv69", typeCode:"CITY", code:"QTA", name:"Quetta",       sortOrder:20, isActive:true },
  { id:"lv70", typeCode:"CITY", code:"GWD", name:"Gwadar",       sortOrder:21, isActive:true },
  { id:"lv71", typeCode:"CITY", code:"ISB", name:"Islamabad",    sortOrder:22, isActive:true },
  { id:"lv72", typeCode:"CITY", code:"MZD", name:"Muzaffarabad", sortOrder:23, isActive:true },
  { id:"lv73", typeCode:"CITY", code:"MPR", name:"Mirpur",       sortOrder:24, isActive:true },
  { id:"lv74", typeCode:"CITY", code:"GIL", name:"Gilgit",       sortOrder:25, isActive:true },
  { id:"lv75", typeCode:"CITY", code:"SKD", name:"Skardu",       sortOrder:26, isActive:true },
  // ── Countries ─────────────────────────────────────────────────────────────
  { id:"lv80", typeCode:"COUNTRY", code:"PK",  name:"Pakistan",       sortOrder:1,  isActive:true },
  { id:"lv81", typeCode:"COUNTRY", code:"US",  name:"United States",  sortOrder:2,  isActive:true },
  { id:"lv82", typeCode:"COUNTRY", code:"GB",  name:"United Kingdom", sortOrder:3,  isActive:true },
  { id:"lv83", typeCode:"COUNTRY", code:"CA",  name:"Canada",         sortOrder:4,  isActive:true },
  { id:"lv84", typeCode:"COUNTRY", code:"AU",  name:"Australia",      sortOrder:5,  isActive:true },
  { id:"lv85", typeCode:"COUNTRY", code:"SA",  name:"Saudi Arabia",   sortOrder:6,  isActive:true },
  { id:"lv86", typeCode:"COUNTRY", code:"AE",  name:"UAE",            sortOrder:7,  isActive:true },
  { id:"lv87", typeCode:"COUNTRY", code:"IN",  name:"India",          sortOrder:8,  isActive:true },
  { id:"lv88", typeCode:"COUNTRY", code:"CN",  name:"China",          sortOrder:9,  isActive:true },
  { id:"lv89", typeCode:"COUNTRY", code:"TR",  name:"Turkey",         sortOrder:10, isActive:true },
  { id:"lv90", typeCode:"COUNTRY", code:"DE",  name:"Germany",        sortOrder:11, isActive:true },
  { id:"lv91", typeCode:"COUNTRY", code:"FR",  name:"France",         sortOrder:12, isActive:true },
  { id:"lv92", typeCode:"COUNTRY", code:"AF",  name:"Afghanistan",    sortOrder:13, isActive:true },
  { id:"lv93", typeCode:"COUNTRY", code:"BD",  name:"Bangladesh",     sortOrder:14, isActive:true },
  { id:"lv94", typeCode:"COUNTRY", code:"MY",  name:"Malaysia",       sortOrder:15, isActive:true },
  { id:"lv95", typeCode:"COUNTRY", code:"QA",  name:"Qatar",          sortOrder:16, isActive:true },
  { id:"lv96", typeCode:"COUNTRY", code:"KW",  name:"Kuwait",         sortOrder:17, isActive:true },
  { id:"lv97", typeCode:"COUNTRY", code:"OM",  name:"Oman",           sortOrder:18, isActive:true },
  { id:"lv98", typeCode:"COUNTRY", code:"BH",  name:"Bahrain",        sortOrder:19, isActive:true },
  { id:"lv99", typeCode:"COUNTRY", code:"OTHER",name:"Other",         sortOrder:99, isActive:true },
];

// ─── Workflow ─────────────────────────────────────────────────────────────────
export const MOCK_WORKFLOW_DEFS: WorkflowDefinitionItem[] = [
  { tenantId:T1, id:"wf1", code:"WF-LEAVE",   name:"Leave Approval",         metadataJson: JSON.stringify({ steps:["Submit","HOD Approval","HR Review","Principal Approval"], status:"ACTIVE" }) },
  { tenantId:T1, id:"wf2", code:"WF-PURCHASE",name:"Purchase Order",         metadataJson: JSON.stringify({ steps:["Request","Budget Check","Accounts","Principal"],          status:"ACTIVE" }) },
  { tenantId:T1, id:"wf3", code:"WF-ENROLL",  name:"Student Enrollment",    metadataJson: JSON.stringify({ steps:["Application","Document Check","Fee Verify","Enroll"],     status:"ACTIVE" }) },
  { tenantId:T1, id:"wf4", code:"WF-ADMIT",   name:"Staff Recruitment",     metadataJson: JSON.stringify({ steps:["Apply","Interview","HR Approval","Appointment"],          status:"ACTIVE" }) },
];

export const MOCK_APPROVALS: ApprovalItem[] = [
  { tenantId:T1, id:"ap1", code:"APR-001", name:"Leave: Farah Khan (ADM-010)", metadataJson: JSON.stringify({ workflowCode:"WF-LEAVE",    requester:"Farah Khan",  step:"HOD Approval", status:"PENDING", createdAt:"2026-08-30" }) },
  { tenantId:T1, id:"ap2", code:"APR-002", name:"Purchase: Lab Equipment",     metadataJson: JSON.stringify({ workflowCode:"WF-PURCHASE",  requester:"Noman Arif",  step:"Budget Check",  status:"PENDING", createdAt:"2026-08-29" }) },
  { tenantId:T1, id:"ap3", code:"APR-003", name:"Enroll: Mariam Shah",         metadataJson: JSON.stringify({ workflowCode:"WF-ENROLL",    requester:"Admissions",  step:"Fee Verify",    status:"APPROVED",createdAt:"2026-08-28" }) },
];

// ─── Activities ───────────────────────────────────────────────────────────────
export const MOCK_ACTIVITIES: ActivityItem[] = [
  { tenantId:T1, id:"act1", code:"ACT-SPT",  name:"Annual Sports Day 2026",   metadataJson: JSON.stringify({ date:"2026-11-15", venue:"School Ground",  type:"Sports",      status:"UPCOMING" }) },
  { tenantId:T1, id:"act2", code:"ACT-SCI",  name:"Science Fair",              metadataJson: JSON.stringify({ date:"2026-10-20", venue:"Main Hall",      type:"Academic",    status:"UPCOMING" }) },
  { tenantId:T1, id:"act3", code:"ACT-DEB",  name:"Inter-School Debate",       metadataJson: JSON.stringify({ date:"2026-09-25", venue:"Auditorium",     type:"Co-curricular",status:"UPCOMING"}) },
  { tenantId:T1, id:"act4", code:"ACT-TRIP", name:"Study Trip — Lahore Fort",  metadataJson: JSON.stringify({ date:"2026-09-10", venue:"Lahore Fort",    type:"Trip",        status:"COMPLETED"}) },
];

// ─── Learning ─────────────────────────────────────────────────────────────────
export const MOCK_ASSIGNMENTS: AssignmentItem[] = [
  { tenantId:T1, id:"asn1", code:"ASN-001", name:"Algebra Practice Set 5",     metadataJson: JSON.stringify({ subject:"Mathematics", class:"Grade 9-A", dueAt:"2026-09-10T17:00:00Z", maxMarks:50, status:"OPEN"   }) },
  { tenantId:T1, id:"asn2", code:"ASN-002", name:"Essay: Climate Change",      metadataJson: JSON.stringify({ subject:"English",     class:"Grade 10-A", dueAt:"2026-09-08T17:00:00Z", maxMarks:30, status:"CLOSED" }) },
  { tenantId:T1, id:"asn3", code:"ASN-003", name:"Lab Report: Titration",      metadataJson: JSON.stringify({ subject:"Chemistry",   class:"O-Level 1",  dueAt:"2026-09-12T17:00:00Z", maxMarks:25, status:"OPEN"   }) },
];

// ─── Inventory ────────────────────────────────────────────────────────────────
export const MOCK_INVENTORY: InventoryItem[] = [
  { tenantId:T1, id:"inv-i1", code:"ITM-001", name:"A4 Printer Paper (Ream)",  metadataJson: JSON.stringify({ qty:250, unit:"Ream",  reorderLevel:50, lastOrderDate:"2026-08-01" }) },
  { tenantId:T1, id:"inv-i2", code:"ITM-002", name:"Whiteboard Markers (Box)", metadataJson: JSON.stringify({ qty:45,  unit:"Box",  reorderLevel:20, lastOrderDate:"2026-07-15" }) },
  { tenantId:T1, id:"inv-i3", code:"ITM-003", name:"Projector Bulbs",          metadataJson: JSON.stringify({ qty:12,  unit:"Piece",reorderLevel:5,  lastOrderDate:"2026-06-01" }) },
  { tenantId:T1, id:"inv-i4", code:"ITM-004", name:"Lab Chemicals (Set)",      metadataJson: JSON.stringify({ qty:8,   unit:"Set",  reorderLevel:3,  lastOrderDate:"2026-08-10" }) },
];

// ─── AI mock responses ────────────────────────────────────────────────────────
export const MOCK_AI_RESPONSE = {
  answer: "Based on verified school documents: Students must maintain 75% minimum attendance. Fees are due by the 20th of each month. Late payments incur a 2% surcharge after 7 days. O-Level and A-Level students follow Cambridge International calendar (Sept–July).",
  contextStrategy: "CAG",
  citations: [
    { chunkId:"c1", documentTitle:"Academic Handbook 2026",  relevanceScore:0.94, excerpt:"Students must maintain a minimum of 75% attendance…" },
    { chunkId:"c2", documentTitle:"School Policy Manual",     relevanceScore:0.87, excerpt:"Fee payment is due by the 20th of each month…" },
    { chunkId:"c3", documentTitle:"Cambridge Syllabus Guide", relevanceScore:0.82, excerpt:"The academic year for Cambridge programmes runs September to July…" },
  ],
};

export const MOCK_PREDICTION: PredictionResult = {
  kind: "DropoutRisk", score: 0.73, probability: 0.73,
  riskLevel: "High", outcome: "High dropout risk — immediate intervention recommended",
  confidence: 0.89, modelVersion: "v2.1.0", usedMachineLearning: true,
  factors: [
    "Low attendance (72% — below 75% threshold)",
    "Declining grades (avg dropped from 68% to 55%)",
    "4 missed assignments in last 3 weeks",
    "Outstanding fee balance (2 months)",
  ],
};

// ── Mock leave requests ───────────────────────────────────────────────────────
export const MOCK_LEAVE_REQUESTS = [
  { id:"lr1", employeeId:"33333333-3333-3333-3333-333333333333", employeeName:"Aisha Siddiqui",   staffType:"TEACHER",      leaveType:"SICK",     startDate:"2026-09-03", endDate:"2026-09-04", days:2, reason:"Fever and flu, doctor's certificate attached.",  status:"PENDING",  appliedAt:"2026-09-02T08:00:00Z", approverNotes:"" },
  { id:"lr2", employeeId:"55555555-5555-5555-5555-555555555555", employeeName:"Arif Khan",         staffType:"DRIVER",       leaveType:"ANNUAL",   startDate:"2026-09-10", endDate:"2026-09-12", days:3, reason:"Family function out of city.",                    status:"PENDING",  appliedAt:"2026-09-01T14:30:00Z", approverNotes:"" },
  { id:"lr3", employeeId:"66666666-6666-6666-6666-666666666666", employeeName:"Zulfiqar Ahmed",    staffType:"ACCOUNTANT",   leaveType:"CASUAL",   startDate:"2026-09-05", endDate:"2026-09-05", days:1, reason:"Personal errand at government office.",            status:"PENDING",  appliedAt:"2026-09-02T09:15:00Z", approverNotes:"" },
  { id:"lr4", employeeId:"77777777-7777-7777-7777-777777777777", employeeName:"Nadia Pervez",      staffType:"HR",           leaveType:"SICK",     startDate:"2026-08-28", endDate:"2026-08-28", days:1, reason:"Medical check-up.",                                status:"APPROVED", appliedAt:"2026-08-27T10:00:00Z", approverNotes:"Approved. Get well soon.", approvedAt:"2026-08-27T11:00:00Z" },
  { id:"lr5", employeeId:"88888888-8888-8888-8888-888888888888", employeeName:"Dr. Tariq Malik",   staffType:"EXAMINER",     leaveType:"ANNUAL",   startDate:"2026-08-20", endDate:"2026-08-22", days:3, reason:"Planned vacation.",                                status:"APPROVED", appliedAt:"2026-08-15T08:00:00Z", approverNotes:"Approved.",                approvedAt:"2026-08-16T09:00:00Z" },
  { id:"lr6", employeeId:"33333333-3333-3333-3333-333333333334", employeeName:"Tariq Jameel",      staffType:"TEACHER",      leaveType:"EMERGENCY",startDate:"2026-09-01", endDate:"2026-09-02", days:2, reason:"Family emergency.",                                status:"APPROVED", appliedAt:"2026-09-01T07:00:00Z", approverNotes:"Approved — emergency grant.", approvedAt:"2026-09-01T07:30:00Z" },
  { id:"lr7", employeeId:"33333333-3333-3333-3333-333333333335", employeeName:"Rehana Pervez",     staffType:"TEACHER",      leaveType:"CASUAL",   startDate:"2026-09-08", endDate:"2026-09-08", days:1, reason:"Personal work.",                                   status:"REJECTED", appliedAt:"2026-09-01T12:00:00Z", approverNotes:"Exam week — leave not possible.",  rejectedAt:"2026-09-01T13:00:00Z" },
];

export const MOCK_EARLY_WARNINGS: PredictionResult[] = [
  { kind:"DropoutRisk",     score:0.73, probability:0.73, riskLevel:"High",     outcome:"High dropout risk",          confidence:0.89, modelVersion:"v2.1.0", usedMachineLearning:true, factors:["Low attendance","Declining grades","Missing assignments"] },
  { kind:"GradeDecline",    score:0.55, probability:0.55, riskLevel:"Medium",   outcome:"Grade decline detected",     confidence:0.81, modelVersion:"v2.1.0", usedMachineLearning:true, factors:["Avg grade dropped 13 points","Missed 2 labs"] },
  { kind:"FeeDefault",      score:0.40, probability:0.40, riskLevel:"Low",      outcome:"Fee default low risk",       confidence:0.76, modelVersion:"v2.1.0", usedMachineLearning:true, factors:["Partial payment history","1 month outstanding"] },
];
