export interface ModuleMetric {
    label: string;
    value: string;
    note: string;
    trend?: "up" | "down" | "neutral";
}
export interface ModuleRecord {
    id: string;
    title: string;
    subtitle: string;
    meta: string;
    status: string;
    value: string;
}
export interface ModuleData {
    title: string;
    subtitle: string;
    action: string;
    metrics: ModuleMetric[];
    columns: [
        string,
        string,
        string,
        string,
        string
    ];
    records: ModuleRecord[];
    insights: string[];
}
const people = [
    ["Amina Yusuf", "Grade 10 • A", "ADM-1048", "Active", "94%"],
    ["Hamza Siddiqui", "Grade 9 • B", "ADM-1029", "Active", "89%"],
    ["Mariam Farooq", "Grade 8 • A", "ADM-1093", "Active", "92%"],
    ["Zayan Ahmed", "Grade 7 • C", "ADM-1112", "Review", "86%"],
    ["Noor Fatima", "Grade 10 • B", "ADM-1007", "Active", "96%"],
];
function records(rows = people): ModuleRecord[] {
    return rows.map((row, index) => ({
        id: String(index + 1),
        title: row[0],
        subtitle: row[1],
        meta: row[2],
        status: row[3],
        value: row[4],
    }));
}
export const modules: Record<string, ModuleData> = {
    academics: {
        title: "Academics",
        subtitle: "Programs, classes, subjects, sections and timetable planning.",
        action: "Create timetable",
        metrics: [
            { label: "Programs", value: "6", note: "Cambridge & Matric", trend: "neutral" },
            { label: "Active Classes", value: "38", note: "Across 12 grades", trend: "up" },
            { label: "Subjects", value: "64", note: "18 optional", trend: "neutral" },
            { label: "Teacher Load", value: "87%", note: "Balanced this term", trend: "up" },
        ],
        columns: ["Class / Program", "Section", "Class Teacher", "Status", "Students"],
        records: records([
            ["Grade 10 - Matric", "Section A", "Sadia Iqbal", "Active", "34"],
            ["O Level - Year 2", "Section Blue", "Usman Tariq", "Active", "28"],
            ["Grade 9 - Matric", "Section B", "Farah Noor", "Active", "31"],
            ["Cambridge Primary 6", "Section A", "Maha Khan", "Active", "26"],
            ["Grade 8 - Matric", "Section C", "Bilal Ahmed", "Planning", "29"],
        ]),
        insights: ["2 timetable conflicts need review", "Physics lab utilization is 81%", "Grade 10 has full subject allocation"],
    },
    teachers: {
        title: "Teachers",
        subtitle: "Faculty profiles, subject allocation, workload and performance.",
        action: "Add teacher",
        metrics: [
            { label: "Teaching Staff", value: "98", note: "92 active today", trend: "up" },
            { label: "Avg. Experience", value: "7.8 yrs", note: "Across faculty", trend: "neutral" },
            { label: "Open Positions", value: "4", note: "2 interviews this week", trend: "neutral" },
            { label: "Attendance", value: "96.8%", note: "+1.4% this month", trend: "up" },
        ],
        columns: ["Teacher", "Department", "Employee No.", "Status", "Workload"],
        records: records([
            ["Sadia Iqbal", "Mathematics", "EMP-021", "Active", "82%"],
            ["Usman Tariq", "Sciences", "EMP-018", "Active", "91%"],
            ["Farah Noor", "English", "EMP-044", "Active", "76%"],
            ["Maha Khan", "Primary", "EMP-063", "Active", "88%"],
            ["Bilal Ahmed", "Computer Science", "EMP-037", "Leave", "70%"],
        ]),
        insights: ["Computer Science needs one additional teacher", "12 teachers eligible for increment review", "Faculty satisfaction pulse: 4.5/5"],
    },
    examinations: {
        title: "Examinations",
        subtitle: "Class tests, monthly tests, midterms, pre-boards and annual exams.",
        action: "Schedule exam",
        metrics: [
            { label: "Upcoming Exams", value: "12", note: "Next 30 days", trend: "neutral" },
            { label: "Results Published", value: "86%", note: "Current term", trend: "up" },
            { label: "Average Score", value: "78.4%", note: "+3.2% vs last term", trend: "up" },
            { label: "At-Risk Students", value: "34", note: "AI identified", trend: "down" },
        ],
        columns: ["Assessment", "Class", "Date", "Status", "Completion"],
        records: records([
            ["Mathematics Monthly Test", "Grade 10 A", "22 Aug 2026", "Scheduled", "100%"],
            ["Physics Pre-Board", "O Level Y2", "25 Aug 2026", "Scheduled", "92%"],
            ["English Class Test", "Grade 9 B", "19 Aug 2026", "Ready", "100%"],
            ["Science Midterm", "Grade 8 A", "02 Sep 2026", "Draft", "64%"],
            ["Supplementary Mathematics", "Grade 10", "28 Aug 2026", "Ready", "100%"],
        ]),
        insights: ["AI predicts 7 students may improve a grade band", "3 papers await moderation", "Result publishing SLA is on target"],
    },
    attendance: {
        title: "Attendance",
        subtitle: "Daily student and staff attendance with exceptions and trends.",
        action: "Mark attendance",
        metrics: [
            { label: "Present Today", value: "1,156", note: "92.6% of students", trend: "up" },
            { label: "Absent", value: "67", note: "18 notified", trend: "down" },
            { label: "Late Arrivals", value: "25", note: "7 recurring", trend: "neutral" },
            { label: "Staff Present", value: "96.8%", note: "95 of 98", trend: "up" },
        ],
        columns: ["Student", "Class", "Admission No.", "Status", "Month"],
        records: records([
            ["Amina Yusuf", "Grade 10 A", "ADM-1048", "Present", "97%"],
            ["Hamza Siddiqui", "Grade 9 B", "ADM-1029", "Late", "91%"],
            ["Mariam Farooq", "Grade 8 A", "ADM-1093", "Present", "95%"],
            ["Zayan Ahmed", "Grade 7 C", "ADM-1112", "Absent", "84%"],
            ["Noor Fatima", "Grade 10 B", "ADM-1007", "Present", "98%"],
        ]),
        insights: ["Grade 7 C has the lowest weekly attendance", "11 parents received absence alerts", "Friday attendance improved by 2.8%"],
    },
    finance: {
        title: "Finance",
        subtitle: "Fees, invoices, collections, concessions and school finance.",
        action: "Create invoice",
        metrics: [
            { label: "Collected", value: "PKR 12.8M", note: "This month", trend: "up" },
            { label: "Outstanding", value: "PKR 3.1M", note: "184 invoices", trend: "down" },
            { label: "Collection Rate", value: "80.5%", note: "+4.8% month-on-month", trend: "up" },
            { label: "Concessions", value: "PKR 640K", note: "73 students", trend: "neutral" },
        ],
        columns: ["Account", "Reference", "Due Date", "Status", "Amount"],
        records: records([
            ["Amina Yusuf", "INV-2608-1048", "25 Aug 2026", "Paid", "PKR 28,500"],
            ["Hamza Siddiqui", "INV-2608-1029", "25 Aug 2026", "Pending", "PKR 31,000"],
            ["Mariam Farooq", "INV-2608-1093", "25 Aug 2026", "Paid", "PKR 26,500"],
            ["Zayan Ahmed", "INV-2608-1112", "20 Aug 2026", "Overdue", "PKR 29,000"],
            ["Noor Fatima", "INV-2608-1007", "25 Aug 2026", "Paid", "PKR 31,000"],
        ]),
        insights: ["PKR 820K expected in the next 7 days", "12 overdue accounts need follow-up", "Online payments represent 71% of collections"],
    },
    hr: {
        title: "HR & Payroll",
        subtitle: "Hiring, employee records, grades, payroll and increment workflows.",
        action: "Run payroll",
        metrics: [
            { label: "Employees", value: "132", note: "98 teaching staff", trend: "up" },
            { label: "Payroll", value: "PKR 9.4M", note: "August cycle", trend: "neutral" },
            { label: "Candidates", value: "18", note: "6 shortlisted", trend: "up" },
            { label: "Increment Reviews", value: "12", note: "Due this month", trend: "neutral" },
        ],
        columns: ["Employee", "Job / Grade", "Employee No.", "Status", "Salary Band"],
        records: records([
            ["Sadia Iqbal", "Senior Teacher • G7", "EMP-021", "Active", "G7"],
            ["Usman Tariq", "HOD Science • G9", "EMP-018", "Active", "G9"],
            ["Farah Noor", "Teacher • G6", "EMP-044", "Active", "G6"],
            ["Maha Khan", "Coordinator • G8", "EMP-063", "Active", "G8"],
            ["Bilal Ahmed", "Teacher • G6", "EMP-037", "Leave", "G6"],
        ]),
        insights: ["August payroll is 94% validated", "3 candidate interviews tomorrow", "Increment workflow has 4 manager approvals pending"],
    },
    library: {
        title: "Library",
        subtitle: "Catalog, circulation, reservations, fines and reading engagement.",
        action: "Issue book",
        metrics: [
            { label: "Titles", value: "8,420", note: "12,740 copies", trend: "up" },
            { label: "Issued", value: "1,286", note: "Currently on loan", trend: "neutral" },
            { label: "Overdue", value: "73", note: "Notices queued", trend: "down" },
            { label: "Reservations", value: "46", note: "18 ready to collect", trend: "up" },
        ],
        columns: ["Book / Member", "Category", "Reference", "Status", "Due"],
        records: records([
            ["The Alchemist", "Fiction", "BK-10482", "Issued", "24 Aug"],
            ["Cambridge Mathematics 10", "Academic", "BK-08831", "Reserved", "Ready"],
            ["A Brief History of Time", "Science", "BK-06112", "Issued", "29 Aug"],
            ["Oxford English Grammar", "Reference", "BK-07309", "Overdue", "3 days"],
            ["Pakistan: A Modern History", "History", "BK-05220", "Available", "Shelf B4"],
        ]),
        insights: ["Grade 8 has highest reading engagement", "18 reserved books are ready for collection", "Digital resource usage increased 16%"],
    },
    transport: {
        title: "Transport",
        subtitle: "Routes, vehicles, drivers, stops and student transport allocation.",
        action: "Plan route",
        metrics: [
            { label: "Active Routes", value: "18", note: "Across city zones", trend: "neutral" },
            { label: "Students", value: "624", note: "Using transport", trend: "up" },
            { label: "Vehicles", value: "22", note: "20 operational", trend: "neutral" },
            { label: "On-Time Rate", value: "94.2%", note: "+2.1% this month", trend: "up" },
        ],
        columns: ["Route", "Driver / Vehicle", "Area", "Status", "Occupancy"],
        records: records([
            ["Route 01", "Nadeem • BUS-01", "Gulshan", "On Route", "82%"],
            ["Route 04", "Rashid • BUS-04", "North Nazimabad", "On Route", "91%"],
            ["Route 07", "Imran • VAN-02", "PECHS", "Completed", "76%"],
            ["Route 11", "Aslam • BUS-09", "Clifton", "Delayed", "88%"],
            ["Route 14", "Tariq • VAN-05", "Johar", "On Route", "79%"],
        ]),
        insights: ["Route 11 is 14 minutes behind schedule", "2 vehicles have maintenance due this week", "Route consolidation could save 7% fuel"],
    },
    communication: {
        title: "Communication",
        subtitle: "Parent-teacher chat, announcements, notices and school conversations.",
        action: "New announcement",
        metrics: [
            { label: "Unread Messages", value: "38", note: "Across 16 conversations", trend: "down" },
            { label: "Parent Reach", value: "96%", note: "Last announcement", trend: "up" },
            { label: "Open Chats", value: "124", note: "This week", trend: "neutral" },
            { label: "Avg. Response", value: "18 min", note: "Teacher response time", trend: "up" },
        ],
        columns: ["Conversation", "Context", "Last Message", "Status", "Time"],
        records: records([
            ["Mrs. Yusuf ↔ Sadia Iqbal", "Amina • Grade 10 A", "Assignment clarification", "Unread", "2m"],
            ["Mr. Siddiqui ↔ Farah Noor", "Hamza • Grade 9 B", "Thank you, noted.", "Read", "18m"],
            ["Admin ↔ Grade 8 Parents", "Announcement", "Science exhibition reminder", "Delivered", "1h"],
            ["Maha Khan ↔ Mrs. Ahmed", "Zayan • Grade 7 C", "Attendance follow-up", "Unread", "2h"],
            ["Sports Office ↔ Parents", "Sports Day", "Consent form shared", "Delivered", "3h"],
        ]),
        insights: ["8 conversations need teacher response", "Parent engagement is highest between 6–8 PM", "Sports Day notice reached 98% of recipients"],
    },
    ai: {
        title: "AI Intelligence",
        subtitle: "Tutor, inquiry chatbot, predictions, RAG knowledge and workflow agents.",
        action: "Open AI workspace",
        metrics: [
            { label: "Tutor Sessions", value: "428", note: "This week", trend: "up" },
            { label: "Inquiry Resolved", value: "91%", note: "Without staff handoff", trend: "up" },
            { label: "Predictions", value: "1,248", note: "Student grade forecasts", trend: "neutral" },
            { label: "Agent Workflows", value: "36", note: "31 completed", trend: "up" },
        ],
        columns: ["AI Capability", "Audience", "Last Run", "Status", "Quality"],
        records: records([
            ["Student Tutor", "Students", "2 minutes ago", "Online", "94%"],
            ["Admission Inquiry Bot", "Public", "6 minutes ago", "Online", "91%"],
            ["Grade Prediction", "Parents & Teachers", "Today 11:40", "Ready", "89%"],
            ["Parent Progress Assistant", "Parents", "Today 10:18", "Online", "93%"],
            ["Fee Reminder Agent", "Finance", "Today 09:30", "Completed", "98%"],
        ]),
        insights: ["34 students have a predicted grade drop risk", "RAG knowledge base has 1,842 indexed chunks", "Ollama model health is normal"],
    },
    reports: {
        title: "Reports & Analytics",
        subtitle: "Operational, academic and management reporting in one place.",
        action: "Create report",
        metrics: [
            { label: "Saved Reports", value: "42", note: "12 shared", trend: "up" },
            { label: "Scheduled", value: "14", note: "Next run: 3 PM", trend: "neutral" },
            { label: "Exports", value: "286", note: "This month", trend: "up" },
            { label: "Dashboards", value: "9", note: "Role-based", trend: "neutral" },
        ],
        columns: ["Report", "Category", "Owner", "Status", "Last Run"],
        records: records([
            ["Student Performance", "Academic", "Principal", "Ready", "Today"],
            ["Fee Aging", "Finance", "Finance Manager", "Ready", "Today"],
            ["Staff Attendance", "HR", "HR Manager", "Scheduled", "Yesterday"],
            ["Exam Analytics", "Examinations", "Academic Head", "Ready", "18 Aug"],
            ["Transport Utilization", "Transport", "Operations", "Draft", "17 Aug"],
        ]),
        insights: ["Performance report is viewed most often", "3 scheduled reports are due today", "Export volume increased 21% this term"],
    },
    settings: {
        title: "School Settings",
        subtitle: "School identity, programs, templates, permissions and platform configuration.",
        action: "Save changes",
        metrics: [
            { label: "School Profile", value: "100%", note: "Logo & identity configured", trend: "up" },
            { label: "Templates", value: "18", note: "Certificates & letters", trend: "neutral" },
            { label: "Roles", value: "12", note: "Identity policies", trend: "neutral" },
            { label: "Integrations", value: "7", note: "6 healthy", trend: "up" },
        ],
        columns: ["Configuration", "Category", "Scope", "Status", "Updated"],
        records: records([
            ["School Logo & Branding", "Identity", "Tenant", "Configured", "Today"],
            ["School Leaving Certificate", "Template", "Tenant", "Active", "Yesterday"],
            ["Migration Certificate", "Template", "Tenant", "Active", "16 Aug"],
            ["Student of the Month", "Template", "Tenant", "Active", "15 Aug"],
            ["Ollama AI Provider", "Integration", "Tenant", "Connected", "Today"],
        ]),
        insights: ["All required certificate templates are configured", "One integration needs credential renewal", "Identity role mapping is synchronized"],
    },
};

