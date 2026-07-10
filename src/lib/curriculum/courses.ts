import type { CourseInfo } from './types'

/**
 * Master list ของรายวิชาในหลักสูตร วท.บ. สถิติ 2564 (วิชาเฉพาะทั้งหมด)
 * รายวิชา GE อยู่ใน ge-catalog.ts แยกต่างหาก
 */
export const COURSES: Record<string, CourseInfo> = {
  // ── 2.1 วิทย์พื้นฐาน 24 ──
  '322-101': { code: '322-101', name: 'แคลคูลัส 1', nameEn: 'Calculus I', credits: 3 },
  '322-102': { code: '322-102', name: 'แคลคูลัส 2', nameEn: 'Calculus II', credits: 3 },
  '324-101': { code: '324-101', name: 'เคมีทั่วไป 1', nameEn: 'General Chemistry I', credits: 3 },
  '325-101': { code: '325-101', name: 'ปฏิบัติการเคมีทั่วไป 1', nameEn: 'General Chemistry Laboratory I', credits: 1 },
  '330-101': { code: '330-101', name: 'หลักชีววิทยา 1', nameEn: 'Principles of Biology I', credits: 3 },
  '331-101': { code: '331-101', name: 'ปฏิบัติการหลักชีววิทยา 1', nameEn: 'Principles of Biology Laboratory I', credits: 1 },
  '332-101': { code: '332-101', name: 'ฟิสิกส์พื้นฐาน', nameEn: 'Fundamental Physics', credits: 3 },
  '333-101': { code: '333-101', name: 'ปฏิบัติการฟิสิกส์พื้นฐาน', nameEn: 'Fundamental Physics Laboratory', credits: 1 },
  '346-111': { code: '346-111', name: 'หลักสถิติ', nameEn: 'Principles of Statistics', credits: 3 },
  '346-361': { code: '346-361', name: 'ฐานข้อมูลและภาษา SQL สำหรับการวิเคราะห์ข้อมูล', nameEn: 'Database and SQL for Data Analytics', credits: 3 },

  // ── 2.2 บังคับ 57(ปกติ)/61(สหกิจ) ──
  '346-161': { code: '346-161', name: 'ซอฟต์แวร์มาตรฐานทางสถิติ', nameEn: 'Standard Statistical Software', credits: 3 },
  '346-221': { code: '346-221', name: 'ความน่าจะเป็นสำหรับสถิติศาสตร์', nameEn: 'Probability for Statistics', credits: 3 },
  '346-222': { code: '346-222', name: 'สถิติศาสตร์ไม่อิงพารามิเตอร์', nameEn: 'Nonparametric Statistics', credits: 3 },
  '346-223': { code: '346-223', name: 'คณิตสถิติศาสตร์ 1', nameEn: 'Mathematical Statistics I', credits: 3 },
  '346-231': { code: '346-231', name: 'การประกันภัยเบื้องต้น', nameEn: 'Introduction to Insurance', credits: 3 },
  '346-232': { code: '346-232', name: 'การวิเคราะห์การถดถอย', nameEn: 'Regression Analysis', credits: 4 },
  '346-241': { code: '346-241', name: 'ชุดวิชาพีชคณิตและการวิจัยดำเนินการ', nameEn: 'Module: Linear Algebra and Operations Research', credits: 5 },
  '346-261': { code: '346-261', name: 'การเขียนโปรแกรมคอมพิวเตอร์เบื้องต้น', nameEn: 'Basic Computer Programming', credits: 2 },
  '346-321': { code: '346-321', name: 'คณิตสถิติศาสตร์ 2', nameEn: 'Mathematical Statistics II', credits: 3 },
  '346-322': { code: '346-322', name: 'เทคนิคการเลือกตัวอย่าง', nameEn: 'Sampling Techniques', credits: 3 },
  '346-331': { code: '346-331', name: 'การวิเคราะห์หลายตัวแปรเชิงประยุกต์', nameEn: 'Applied Multivariate Analysis', credits: 3 },
  '346-332': { code: '346-332', name: 'การวิเคราะห์เชิงทำนาย', nameEn: 'Predictive Analytic', credits: 3 },
  '346-333': { code: '346-333', name: 'แผนแบบการทดลองเบื้องต้น', nameEn: 'Introduction to Experimental Designs', credits: 3 },
  '346-334': { code: '346-334', name: 'ระเบียบวิธีวิจัยเบื้องต้น', nameEn: 'Introduction to Research Methodology', credits: 3 },
  '346-351': { code: '346-351', name: 'การวิเคราะห์ข้อมูลขนาดใหญ่และการประยุกต์', nameEn: 'Big Data Analytics and Applications', credits: 3 },
  '346-441': { code: '346-441', name: 'การควบคุมคุณภาพเชิงสถิติ', nameEn: 'Statistical Quality Control', credits: 3 },
  '346-451': { code: '346-451', name: 'สถิติสำหรับวิทยาการข้อมูลและการวิเคราะห์เชิงธุรกิจ', nameEn: 'Statistics for Data Science and Business Analytics', credits: 3 },
  '346-471': { code: '346-471', name: 'สัมมนาทางสถิติ', nameEn: 'Seminar in Statistics', credits: 1 },
  '346-472': { code: '346-472', name: 'สหกิจศึกษา', nameEn: 'Cooperative Education', credits: 6 },
  '346-491': { code: '346-491', name: 'โครงงานทางสถิติ 1', nameEn: 'Project in Statistics I', credits: 1 },
  '346-492': { code: '346-492', name: 'โครงงานทางสถิติ 2', nameEn: 'Project in Statistics II', credits: 2 },

  // ── 2.3 วิชาเลือกสาขา กลุ่ม1 (คณิต-สถิติ) ──
  '346-335': { code: '346-335', name: 'การวิเคราะห์ข้อมูลระยะยาว', nameEn: 'Longitudinal Data Analysis', credits: 3 },
  '346-336': { code: '346-336', name: 'การวิเคราะห์ข้อมูลจำแนกประเภท', nameEn: 'Categorical Data Analysis', credits: 3 },
  '346-341': { code: '346-341', name: 'การประยุกต์ใช้สถิติสำหรับวิทยาศาสตร์สุขภาพ', nameEn: 'Application of Statistics to Health Sciences', credits: 3 },
  '346-342': { code: '346-342', name: 'ตัวแบบระบบแถวคอยเบื้องต้น', nameEn: 'Introduction to Queuing Models', credits: 3 },
  '346-343': { code: '346-343', name: 'การจัดการสินค้าคงคลัง', nameEn: 'Inventory Management', credits: 3 },
  '346-344': { code: '346-344', name: 'ชุดวิชาวิทยาการประกันภัย', nameEn: 'Module: Actuarial Science', credits: 7 },
  '346-371': { code: '346-371', name: 'การฝึกงานทางสถิติ', nameEn: 'Job Training in Statistics', credits: 1 },
  '346-431': { code: '346-431', name: 'การวิเคราะห์การรอดชีพเบื้องต้น', nameEn: 'Introduction to Survival Analysis', credits: 3 },
  '346-432': { code: '346-432', name: 'สถิติประชากรเบื้องต้น', nameEn: 'Introduction to Population Statistics', credits: 3 },
  '346-442': { code: '346-442', name: 'กระบวนการสโตแคสติก', nameEn: 'Stochastic Process', credits: 3 },
  '346-443': { code: '346-443', name: 'ทฤษฎีการตัดสินใจ', nameEn: 'Decision Theory', credits: 3 },
  '346-444': { code: '346-444', name: 'การจำลองสถานการณ์สำหรับการจัดการโลจิสติกส์', nameEn: 'Simulation for Logistics Management', credits: 3 },
  '346-445': { code: '346-445', name: 'การจัดการคลังสินค้าสำหรับโลจิสติกส์ 4.0', nameEn: 'Warehouse Management for Logistics 4.0', credits: 3 },
  '346-481': { code: '346-481', name: 'หัวข้อพิเศษทางสถิติ 1', nameEn: 'Special Topics in Statistics I', credits: 2 },
  '346-482': { code: '346-482', name: 'หัวข้อพิเศษทางสถิติ 2', nameEn: 'Special Topics in Statistics II', credits: 3 },
  '322-201': { code: '322-201', name: 'แคลคูลัสขั้นสูง', nameEn: 'Advanced Calculus', credits: 3 },
  '322-211': { code: '322-211', name: 'หลักการคณิตศาสตร์', nameEn: 'Principles of Mathematics', credits: 3 },
  '322-252': { code: '322-252', name: 'ชุดวิชาคณิตศาสตร์เชิงคำนวณ', nameEn: 'Module: Computational Mathematics', credits: 5 },
  '322-322': { code: '322-322', name: 'ทฤษฎีกราฟเบื้องต้น', nameEn: 'Introduction to Graph Theory', credits: 3 },
  '322-324': { code: '322-324', name: 'คณิตศาสตร์เชิงการจัด', nameEn: 'Combinatorics', credits: 3 },
  '322-355': { code: '322-355', name: 'กระบวนการสุ่มเบื้องต้น', nameEn: 'Introduction to Random Processes', credits: 3 },

  // ── 2.3 วิชาเลือกสาขา กลุ่ม2 (คณะ/ภาควิชาอื่น) ──
  '225-355': { code: '225-355', name: 'การจัดการผลิตและการดำเนินงาน', nameEn: 'Production and Operations Management', credits: 3 },
  '308-231': { code: '308-231', name: 'การโปรแกรมเชิงโครงสร้างและการประยุกต์', nameEn: 'Structured Programming and Applications', credits: 3 },
  '308-232': { code: '308-232', name: 'การออกแบบและพัฒนาเว็บ', nameEn: 'Web Development and Design', credits: 3 },
  '308-233': { code: '308-233', name: 'ขั้นตอนวิธีและโครงสร้างข้อมูล', nameEn: 'Algorithms and Data Structures', credits: 3 },
  '308-311': { code: '308-311', name: 'การวิเคราะห์และออกแบบระบบสารสนเทศ', nameEn: 'Information Systems Analysis and Design', credits: 3 },
  '308-352': { code: '308-352', name: 'การทำเหมืองข้อมูลและทัศนภาพ', nameEn: 'Data Mining and Visualizations', credits: 3 },
  '344-212': { code: '344-212', name: 'การพัฒนาโปรแกรมประยุกต์บนเว็บ', nameEn: 'Web Application Programming', credits: 3 },
  '344-312': { code: '344-312', name: 'การพัฒนาโปรแกรมประยุกต์บนอุปกรณ์เคลื่อนที่', nameEn: 'Mobile Application Development', credits: 3 },
  '344-334': { code: '344-334', name: 'ระบบธุรกิจอัจฉริยะ', nameEn: 'Business Intelligent System', credits: 3 },
  '345-211': { code: '345-211', name: 'หลักการโปรแกรม', nameEn: 'Principles of Programming', credits: 3 },
  '460-101': { code: '460-101', name: 'หลักการตลาด', nameEn: 'Principles of Marketing', credits: 3 },
  '460-202': { code: '460-202', name: 'ชุดวิชาดิจิทัล นวัตกรรม และการเป็นผู้ประกอบการ', nameEn: 'Module: Digital, Innovation and Entrepreneurship in Practice', credits: 7 },
  '476-201': { code: '476-201', name: 'ความรู้เบื้องต้นเกี่ยวกับการจัดการโลจิสติกส์', nameEn: 'Introduction to Logistics Management', credits: 3 },
  '542-261': { code: '542-261', name: 'การสำรวจการใช้แผนที่และภาพถ่ายทางอากาศ', nameEn: 'Surveying, Maps and Aerial Photography', credits: 3 },
  '876-102': { code: '876-102', name: 'หลักเศรษฐศาสตร์พื้นฐานและการประยุกต์ใช้', nameEn: 'Principles of Economics and Application', credits: 3 },
  '875-309': { code: '875-309', name: 'เศรษฐมิติเบื้องต้น', nameEn: 'Introduction to Econometrics', credits: 4 },
}

export function courseCredits(code: string): number {
  return COURSES[code]?.credits ?? 0
}

export function courseName(code: string): string {
  return COURSES[code]?.name ?? code
}
