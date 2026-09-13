-- เก็บ snapshot ผลตรวจสอบหลักสูตรจาก scmis (สรุป/หมวด/วิชาที่ยังไม่ครบ) ต่อผู้ใช้
-- จัดเก็บรวมในแถว psu_credentials (หนึ่งแถว/ผู้ใช้) — RLS "own psu credentials" ครอบให้แล้ว
alter table psu_credentials add column if not exists structure jsonb;
