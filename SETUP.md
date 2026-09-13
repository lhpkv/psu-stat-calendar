# คู่มือติดตั้ง — PSU Stat Curriculum Checker

เว็บเช็คหน่วยกิตหลักสูตร วท.บ. สถิติ (ม.อ. หาดใหญ่ ปรับปรุง 2564) — Next.js + shadcn/ui + Supabase

---

## ✅ สถานะปัจจุบัน: ตั้งค่าแล้วด้วย Supabase รันในเครื่อง (Local)
ระบบถูกตั้งค่าให้ใช้ **Supabase แบบ local (ผ่าน Docker)** เรียบร้อย — `.env.local` ชี้ไปที่ `http://127.0.0.1:54321` แล้ว

**เริ่มใช้งาน (ทุกครั้งที่เปิดเครื่องใหม่):**
```bash
npx supabase start     # เปิด Supabase local (ต้องเปิด Docker/Rancher Desktop ก่อน)
npm run dev            # เปิดเว็บที่ http://localhost:3000
```
หยุด: `npx supabase stop` · ดูฐานข้อมูล (Studio): http://127.0.0.1:54323

> ⚠️ Local = ใช้ได้เฉพาะเครื่องนี้ (ยังไม่ sync ข้ามเครื่อง) — ข้อมูลเก็บใน Docker volume ของเครื่อง

### อยากได้ sync ข้ามเครื่องจริง → สลับเป็นคลาวด์ (แก้ 2 บรรทัด)
1. ทำตามขั้น "ตั้งค่าคลาวด์" ด้านล่าง (สร้างโปรเจกต์ + รัน SQL)
2. แก้ `.env.local` เป็น URL + anon/publishable key ของโปรเจกต์คลาวด์ → รีสตาร์ท `npm run dev`
   (โค้ดชุดเดียวกัน ไม่ต้องแก้อะไรอีก)

---

## ตั้งค่าคลาวด์ (ทางเลือก — สำหรับ sync ข้ามเครื่อง)

## 1) ติดตั้ง dependencies
```bash
npm install
```

## 2) สร้างโปรเจกต์ Supabase (ฟรี)
1. ไปที่ https://supabase.com → New project
2. เมนู **SQL Editor** → วางเนื้อหาไฟล์ [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → Run
   (สร้างตาราง `profiles`, `taken_courses`, `requirement_overrides` + RLS + trigger สร้างโปรไฟล์อัตโนมัติ)
3. เมนู **Project Settings → API** → คัด **Project URL** และ **anon public key**

## 3) ตั้งค่า environment
คัดไฟล์ตัวอย่างแล้วเติมค่า:
```bash
cp .env.example .env.local
```
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## 4) ล็อกอิน
ใช้สมัคร/เข้าสู่ระบบด้วย**อีเมล+รหัสผ่าน** ในแอปโดยตรง (ไม่ต้องตั้งค่าเพิ่ม)
(ถ้าอยากเปิดล็อกอินผ่าน Google ในอนาคต: Supabase → Authentication → Providers → Google — ตอนนี้แอปยังไม่มีปุ่ม Google)

## 5) รัน
```bash
npm run dev
```
เปิด http://localhost:3000 → สมัคร/เข้าสู่ระบบ → หน้า **รายวิชา** กดปุ่ม
"โหลดข้อมูลตัวอย่าง" หรือ "วางจาก SIS" เพื่อนำเข้า transcript
หรือกด "ตรวจกับ scmis" ที่หน้าแดชบอร์ดเพื่อดูผลตรวจหลักสูตรตรงจากมหาลัย (ใส่รหัส scmis ครั้งเดียว ไม่เก็บรหัสไว้)

## 6) Deploy (Vercel)
1. push ขึ้น GitHub → import ใน https://vercel.com
2. ใส่ env `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   ⚠️ ต้องใส่**ก่อนกด Deploy ครั้งแรก** และต้องเป็นค่าของ Supabase **คลาวด์** (ไม่ใช่ 127.0.0.1) —
   ถ้าไม่ใส่ build ผ่านปกติ แต่หน้าเว็บจะขึ้น UI "ยังไม่ได้ตั้งค่า Supabase" และระบบล็อกอินหายไปเงียบ ๆ (proxy ปล่อยผ่านทุกหน้า)
   (แก้ทีหลังได้: ใส่ env แล้ว Redeploy)
3. Deploy — ใช้ Supabase ตัวเดียวกัน ข้อมูลซิงค์ข้ามเครื่องอัตโนมัติ

## ทดสอบเอนจิน
```bash
npm test
```
(unit test ตรวจความถูกต้องด้วย transcript ตัวอย่างจริง: วิทย์พื้นฐาน 21/24, บังคับ 26/57, เลือกสาขา 0/21 ฯลฯ)

## หมายเหตุเรื่อง GE (สำคัญ)
ม.อ. อยู่ช่วงเปลี่ยนระบบ GE — แอปยึด **GE กลาง 2565 (GE1–8, รวม 132 นก)** เป็นค่าเริ่มต้น
จุดที่ระบบขึ้นธง ⚠️ (เช่น GE3/GE5 ที่ลงรหัสเก่า 1 นก, วิชาเลือกเสรีจากหน่วยกิตส่วนเกิน)
**ควรยืนยันกับอาจารย์ที่ปรึกษา/ตรวจสอบใน SIS** ก่อนใช้ตัดสินใจจริง
