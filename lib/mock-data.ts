import type {
  AuditEvent,
  BumiStatus,
  CostCategory,
  CostItem,
  FinancialDoc,
  Participant,
  ParticipantStatus,
  Programme,
  ProgrammeCategory,
  ProgrammeDocument,
  ProgrammeStatus,
  TrainingMode,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Kumpulan peserta mock (nama lazim di Malaysia)                      */
/* ------------------------------------------------------------------ */

type Seed = Omit<Participant, "id" | "attendance" | "status" | "certificateIssued">;

const PARTICIPANT_POOL: Seed[] = [
  { name: "Ahmad Faizal bin Rahman", email: "ahmad.faizal@mot.gov.my", organisation: "Kementerian Pengangkutan", designation: "Penolong Pengarah IT", bumiStatus: "bumiputera" },
  { name: "Nurul Aina binti Mohd Yusof", email: "nurul.aina@mampu.gov.my", organisation: "MAMPU", designation: "Pegawai Teknologi Maklumat", bumiStatus: "bumiputera" },
  { name: "Siti Khadijah binti Ismail", email: "siti.khadijah@johor.gov.my", organisation: "Kerajaan Negeri Johor", designation: "Eksekutif Digital", bumiStatus: "bumiputera" },
  { name: "Mohd Hafiz bin Abdul Aziz", email: "hafiz.aziz@tm.com.my", organisation: "Telekom Malaysia", designation: "Network Engineer", bumiStatus: "bumiputera" },
  { name: "Tan Wei Ming", email: "weiming.tan@petronas.com", organisation: "PETRONAS", designation: "Senior Analyst", bumiStatus: "non_bumiputera" },
  { name: "Priya Lakshmi d/o Subramaniam", email: "priya.lakshmi@rhbgroup.com", organisation: "RHB Banking Group", designation: "Data Analyst", bumiStatus: "non_bumiputera" },
  { name: "Lim Chee Keong", email: "cheekeong.lim@maybank.com", organisation: "Maybank", designation: "IT Security Officer", bumiStatus: "non_bumiputera" },
  { name: "Rajesh A/L Kumaran", email: "rajesh.k@tenaganational.com.my", organisation: "TNB", designation: "System Administrator", bumiStatus: "non_bumiputera" },
  { name: "Amirah binti Zulkifli", email: "amirah.zul@kkm.gov.my", organisation: "Kementerian Kesihatan Malaysia", designation: "Pegawai Perubatan Kesihatan Digital", bumiStatus: "bumiputera" },
  { name: "Khairul Anwar bin Shaari", email: "khairul.anwar@jpnm.gov.my", organisation: "Jabatan Perdana Menteri", designation: "Timbalan Pengarah", bumiStatus: "bumiputera" },
  { name: "Nur Aisyah binti Hamid", email: "nur.aisyah@utm.my", organisation: "Universiti Teknologi Malaysia", designation: "Pensyarah Kanan", bumiStatus: "bumiputera" },
  { name: "Wong Mei Ling", email: "meiling.wong@cybersecurity.my", organisation: "CyberSecurity Malaysia", designation: "Security Researcher", bumiStatus: "non_bumiputera" },
  { name: "Arulmozhi A/P Rajandran", email: "arulmozhi.r@banknegara.gov.my", organisation: "Bank Negara Malaysia", designation: "Risk Executive", bumiStatus: "non_bumiputera" },
  { name: "Fadzli bin Othman", email: "fadzli.othman@felda.gov.my", organisation: "FELDA", designation: "Pegawai Latihan", bumiStatus: "bumiputera" },
  { name: "Zarina binti Abu Bakar", email: "zarina.abubakar@mida.gov.my", organisation: "MIDA", designation: "Pengurus Projek", bumiStatus: "bumiputera" },
  { name: "Chong Jia Wei", email: "jiawei.chong@pdn.gov.my", organisation: "Jabatan Perlindungan Data", designation: "Pegawai Pematuhan", bumiStatus: "non_bumiputera" },
  { name: "Hafizah binti Noordin", email: "hafizah.noordin@um.edu.my", organisation: "Universiti Malaya", designation: "Pegawai Penyelidik", bumiStatus: "bumiputera" },
  { name: "Devan A/L Suresh", email: "devan.suresh@customs.gov.my", organisation: "Jabatan Kastam Diraja Malaysia", designation: "Penolong Kanan Pengarah", bumiStatus: "non_bumiputera" },
  { name: "Shahrul Nizam bin Idris", email: "shahrul.nizam@maritim.gov.my", organisation: "Agensi Penguatkuasaan Maritim", designation: "Ketua Unit IT", bumiStatus: "bumiputera" },
  { name: "Goh Pei Shi", email: "peishi.goh@mpa.gov.my", organisation: "Lembaga Pelabuhan Klang", designation: "Eksekutif Operasi", bumiStatus: "non_bumiputera" },
];

function buildParticipants(count: number, pendingCount: number, seedOffset = 0): Participant[] {
  const statuses: ParticipantStatus[] = ["completed", "completed", "attended", "confirmed", "completed", "cancelled"];
  return Array.from({ length: count }, (_, i) => {
    const seed = PARTICIPANT_POOL[(i + seedOffset) % PARTICIPANT_POOL.length];
    const isPending = i < pendingCount;
    return {
      ...seed,
      id: `P-${1000 + i + 1}`,
      bumiStatus: (isPending ? "pending" : seed.bumiStatus) as BumiStatus,
      attendance: i === 5 ? 50 : 85 + ((i * 7) % 16),
      status: statuses[i % statuses.length],
      certificateIssued: statuses[i % statuses.length] === "completed" && !isPending,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Pembina data kewangan, kos, dokumen & audit                         */
/* ------------------------------------------------------------------ */

function buildFinancials(year: number, seq: number, contracted: number, variant: "full" | "partial" | "none"): FinancialDoc[] {
  if (variant === "none") return [];
  const docs: FinancialDoc[] = [
    {
      id: `QT-${year}-${seq}`,
      type: "quotation",
      reference: `MAC/QT/${year}/${String(seq).padStart(3, "0")}`,
      issuedDate: `${year}-02-10`,
      amount: contracted,
      status: "accepted",
      notes: "Sebutharga rasmi MIMOS Academy kepada pelanggan.",
    },
    {
      id: `PO-${year}-${seq}`,
      type: "po",
      reference: `PO/${year}/${String(4500 + seq)}`,
      issuedDate: `${year}-03-05`,
      amount: contracted,
      status: variant === "partial" ? "accepted" : "invoiced",
      notes: "Pesanan belian rasmi daripada pelanggan.",
    },
  ];
  if (variant === "full") {
    docs.push({
      id: `INV-${year}-${seq}`,
      type: "invoice",
      reference: `MAC/INV/${year}/${String(seq).padStart(3, "0")}`,
      issuedDate: `${year}-05-20`,
      amount: contracted,
      status: "paid",
      notes: "Invois akhir setelah latihan selesai. Telah dijelaskan.",
    });
  }
  return docs;
}

const COST_BREAKDOWN: { category: CostCategory; share: number; desc: string }[] = [
  { category: "Trainer Fees", share: 0.42, desc: "Yuran tenaga pengajar pakar industri" },
  { category: "Venue", share: 0.16, desc: "Sewa dewan / bilik latihan" },
  { category: "Catering", share: 0.12, desc: "Katering makan tengah hari & rehat" },
  { category: "Materials & Kit", share: 0.1, desc: "Bahan latihan, modul bercetak & kit peserta" },
  { category: "Platform / Software", share: 0.08, desc: "Lesen platform latihan / cloud sandbox" },
  { category: "Logistics", share: 0.07, desc: "Pengangkutan & penginapan jurulatih" },
  { category: "Administration", share: 0.05, desc: "Kos pengurusan & penyelarasan program" },
];

function buildCosts(budget: number, overspend = false): CostItem[] {
  return COST_BREAKDOWN.map((c, i) => {
    const budgeted = Math.round(budget * c.share);
    const variance = overspend ? 1.06 + (i % 3) * 0.02 : 0.9 - (i % 3) * 0.03;
    return {
      id: `C-${i + 1}`,
      category: c.category,
      description: c.desc,
      budgeted,
      actual: Math.round(budgeted * variance),
    };
  });
}

function buildDocuments(year: number, seq: number, paid: boolean): ProgrammeDocument[] {
  const base: ProgrammeDocument[] = [
    { id: "D-1", name: `Borang-Permohonan-MAC${seq}.pdf`, type: "Borang Permohonan", uploadedBy: "Zarina Abu Bakar", uploadedAt: `${year}-01-28`, sizeKb: 342 },
    { id: "D-2", name: `Quotation-MAC-QT-${year}-${String(seq).padStart(3, "0")}.pdf`, type: "Quotation", uploadedBy: "Faizal Rahman", uploadedAt: `${year}-02-10`, sizeKb: 198 },
    { id: "D-3", name: `PO-${4500 + seq}.pdf`, type: "Purchase Order", uploadedBy: "Pelanggan", uploadedAt: `${year}-03-05`, sizeKb: 256 },
    { id: "D-4", name: `Senarai-Kehadiran-Hari-1.pdf`, type: "Senarai Kehadiran", uploadedBy: "Amirah Hassan", uploadedAt: `${year}-06-16`, sizeKb: 410 },
    { id: "D-5", name: `Laporan-Penilaian-Peserta.xlsx`, type: "Laporan Penilaian", uploadedBy: "Hafiz Noor", uploadedAt: `${year}-06-20`, sizeKb: 88 },
  ];
  if (paid) {
    base.push(
      { id: "D-6", name: `Invoice-MAC-INV-${year}-${String(seq).padStart(3, "0")}.pdf`, type: "Invoice", uploadedBy: "Faizal Rahman", uploadedAt: `${year}-05-20`, sizeKb: 212 },
      { id: "D-7", name: `Resit-Pembayaran-${year}.pdf`, type: "Resit Pembayaran", uploadedBy: "Kewangan", uploadedAt: `${year}-07-02`, sizeKb: 154 },
      { id: "D-8", name: `Sijil-Kehadiran-Batch1.pdf`, type: "Sijil Kehadiran", uploadedBy: "Amirah Hassan", uploadedAt: `${year}-06-25`, sizeKb: 3200 },
    );
  }
  return base;
}

function buildAudit(
  year: number,
  manager: string,
  title: string,
  locked: boolean,
): AuditEvent[] {
  const events: AuditEvent[] = [
    { id: "A-1", timestamp: `${year}-01-20T09:15:00`, user: manager, action: "created", detail: `Program "${title}" dicipta sebagai draf.` },
    { id: "A-2", timestamp: `${year}-02-10T14:32:00`, user: "Faizal Rahman", action: "financial_added", detail: "Sebutharga (Quotation) dijana dan dihantar kepada pelanggan." },
    { id: "A-3", timestamp: `${year}-03-05T11:05:00`, user: manager, action: "financial_added", detail: "Purchase Order diterima dan dimuat naik." },
    { id: "A-4", timestamp: `${year}-04-02T16:20:00`, user: "Amirah Hassan", action: "imported", detail: "Senarai peserta awal diimport daripada fail Excel (24 baris, 2 ralat dibetulkan)." },
    { id: "A-5", timestamp: `${year}-05-20T10:00:00`, user: "Faizal Rahman", action: "financial_added", detail: "Invois akhir dikeluarkan." },
    { id: "A-6", timestamp: `${year}-06-18T13:45:00`, user: "Hafiz Noor", action: "participant_updated", detail: "Status kehadiran peserta dikemas kini selepas Hari 2." },
    { id: "A-7", timestamp: `${year}-07-02T09:30:00`, user: "Kewangan", action: "status_changed", detail: "Status program ditukar kepada 'Selesai' setelah pembayaran diterima." },
  ];
  if (locked) {
    events.push({
      id: "A-8",
      timestamp: `${year}-07-15T15:00:00`,
      user: manager,
      action: "locked",
      detail: "Program dikunci (locked) untuk audit kewangan suku tahunan. Tiada suntingan dibenarkan.",
    });
  }
  return events;
}

/* ------------------------------------------------------------------ */
/* Senarai program mock                                                */
/* ------------------------------------------------------------------ */

type ProgrammeSeed = {
  id: string;
  code: string;
  title: string;
  client: string;
  category: ProgrammeCategory;
  mode: TrainingMode;
  year: number;
  status: ProgrammeStatus;
  locked: boolean;
  startDate: string;
  endDate: string;
  venue: string;
  trainer: string;
  programmeManager: string;
  description: string;
  contractedAmount: number;
  budget: number;
  actualCost: number;
  participantCount: number;
  pendingBumi: number;
  financialVariant: "full" | "partial" | "none";
  overspend?: boolean;
};

const SEEDS: ProgrammeSeed[] = [
  {
    id: "prog-001",
    code: "MAC/2025/001",
    title: "Pensijilan Profesional AI & Machine Learning untuk Penjawat Awam",
    client: "Kementerian Pengangkutan Malaysia",
    category: "AI & Data Science",
    mode: "hybrid",
    year: 2025,
    status: "completed",
    locked: true,
    startDate: "2025-06-16",
    endDate: "2025-06-19",
    venue: "MIMOS Auditorium, TPM Kuala Lumpur",
    trainer: "Dr. Hafiz Noor",
    programmeManager: "Zarina Abu Bakar",
    description:
      "Program latihan intensif 4 hari merangkumi asas pembelajaran mesin, pembinaan model ramalan, dan aplikasi AI dalam perkhidmatan pengangkutan awam, termasuk hands-on menggunakan Python dan cloud notebook.",
    contractedAmount: 126000,
    budget: 98000,
    actualCost: 94500,
    participantCount: 24,
    pendingBumi: 3,
    financialVariant: "full",
  },
  {
    id: "prog-002",
    code: "MAC/2025/002",
    title: "Keselamatan Siber & Tindak Balas Insiden (CSIRT) Tahap Pertengahan",
    client: "CyberSecurity Malaysia",
    category: "Cybersecurity",
    mode: "in_person",
    year: 2025,
    status: "active",
    locked: false,
    startDate: "2025-09-08",
    endDate: "2025-09-12",
    venue: "CyberSecurity Malaysia Labs, Cyberjaya",
    trainer: "Ir. Khairul Anwar Shaari",
    programmeManager: "Faizal Rahman",
    description:
      "Latihan praktikal analisis forensik rangkaian, pengesanan ancaman, dan prosedur tindak balas insiden berdasarkan rangka kerja NIST, disertai latihan simulasi serangan (red team vs blue team).",
    contractedAmount: 98500,
    budget: 82000,
    actualCost: 41000,
    participantCount: 20,
    pendingBumi: 5,
    financialVariant: "partial",
  },
  {
    id: "prog-003",
    code: "MAC/2025/003",
    title: "Transformasi Digital & Awan untuk Sektor Awam",
    client: "MAMPU",
    category: "Digital Transformation",
    mode: "online",
    year: 2025,
    status: "active",
    locked: false,
    startDate: "2025-10-06",
    endDate: "2025-10-10",
    venue: "Platform Maya MIMOS Academy (Zoom + LMS)",
    trainer: "Pn. Amirah Hassan",
    programmeManager: "Zarina Abu Bakar",
    description:
      "Kursus maya 5 hari mengenai strategi migrasi awan, tadbir urus data, dan pendigitalan proses perkhidmatan awam mengikut MyDigital dan pelan pendigitalan sektor awam.",
    contractedAmount: 74000,
    budget: 52000,
    actualCost: 12800,
    participantCount: 30,
    pendingBumi: 8,
    financialVariant: "partial",
  },
  {
    id: "prog-004",
    code: "MAC/2025/004",
    title: "Pembinaan Penyelesaian IoT & Sistem Terbenam",
    client: "Lembaga Pelabuhan Klang",
    category: "IoT & Embedded Systems",
    mode: "in_person",
    year: 2025,
    status: "draft",
    locked: false,
    startDate: "2025-11-17",
    endDate: "2025-11-21",
    venue: "Makers Lab MIMOS, TPM Kuala Lumpur",
    trainer: "Ts. Shahrul Nizam Idris",
    programmeManager: "Hafiz Noor",
    description:
      "Bengkel hands-on pengaturcaraan mikropengawal ESP32, sensor, komunikasi LoRa/MQTT, dan pembinaan prototaip pemantauan aset pelabuhan secara masa nyata.",
    contractedAmount: 88000,
    budget: 71000,
    actualCost: 0,
    participantCount: 18,
    pendingBumi: 6,
    financialVariant: "none",
  },
  {
    id: "prog-005",
    code: "MAC/2024/014",
    title: "Kepimpinan Eksekutif & Pengurusan Perubahan Digital",
    client: "PETRONAS",
    category: "Leadership & Management",
    mode: "hybrid",
    year: 2024,
    status: "completed",
    locked: true,
    startDate: "2024-11-11",
    endDate: "2024-11-14",
    venue: "Hotel Royale Chulan, Kuala Lumpur",
    trainer: "Dr. Rozita Mansor",
    programmeManager: "Faizal Rahman",
    description:
      "Program kepimpinan eksekutif untuk pengurus pertengahan yang memfokuskan pengurusan perubahan, pemetaan strategi digital, dan pembentukan pasukan berprestasi tinggi dalam era industri 4.0.",
    contractedAmount: 142000,
    budget: 118000,
    actualCost: 121500,
    participantCount: 22,
    pendingBumi: 0,
    financialVariant: "full",
    overspend: true,
  },
  {
    id: "prog-006",
    code: "MAC/2024/009",
    title: "Analitik Data Raya & Visualisasi untuk Pembuat Dasar",
    client: "Bank Negara Malaysia",
    category: "AI & Data Science",
    mode: "in_person",
    year: 2024,
    status: "on_hold",
    locked: false,
    startDate: "2024-08-05",
    endDate: "2024-08-08",
    venue: "MIMOS Training Centre, Kuala Lumpur",
    trainer: "Dr. Hafiz Noor",
    programmeManager: "Zarina Abu Bakar",
    description:
      "Latihan penggunaan alat visualisasi (Power BI, Python) dan teknik analitik data raya untuk menyokong pembuatan keputusan berasaskan bukti di institusi kewangan.",
    contractedAmount: 65500,
    budget: 58000,
    actualCost: 57200,
    participantCount: 16,
    pendingBumi: 2,
    financialVariant: "partial",
  },
];

export const PROGRAMMES: Programme[] = SEEDS.map((s, idx) => {
  const participants = buildParticipants(s.participantCount, s.pendingBumi, idx * 3);
  return {
    id: s.id,
    code: s.code,
    title: s.title,
    client: s.client,
    category: s.category,
    mode: s.mode,
    year: s.year,
    status: s.status,
    locked: s.locked,
    startDate: s.startDate,
    endDate: s.endDate,
    venue: s.venue,
    trainer: s.trainer,
    programmeManager: s.programmeManager,
    description: s.description,
    budget: s.budget,
    actualCost: s.actualCost,
    contractedAmount: s.contractedAmount,
    participants,
    financials: buildFinancials(s.year, idx + 1, s.contractedAmount, s.financialVariant),
    costs: buildCosts(s.budget, s.overspend),
    documents: buildDocuments(s.year, idx + 1, s.financialVariant === "full"),
    auditTrail: buildAudit(s.year, s.programmeManager, s.title, s.locked),
  };
});

export function getProgrammeById(id: string): Programme | undefined {
  return PROGRAMMES.find((p) => p.id === id);
}
