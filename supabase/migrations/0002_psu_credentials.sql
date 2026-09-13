-- รหัส scmis ของผู้ใช้ (เข้ารหัส AES-256-GCM ฝั่ง server) — สำหรับซิงค์ผลการเรียนอัตโนมัติ
-- password ไม่เคยเก็บ plaintext: pass_cipher/iv/tag เป็น base64 จาก src/lib/psu/crypto.ts

create table if not exists psu_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,            -- รหัสนักศึกษา/ล็อกอิน scmis
  pass_cipher text not null,         -- base64( AES-256-GCM ciphertext )
  iv text not null,                  -- base64( 12-byte IV )
  tag text not null,                 -- base64( 16-byte auth tag )
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

alter table psu_credentials enable row level security;

-- เจ้าของแถวเท่านั้น (เหมือน taken_courses)
drop policy if exists "own psu credentials" on psu_credentials;
create policy "own psu credentials" on psu_credentials
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
