// login เข้า scmis แทนผู้ใช้ แล้วดึง HTML หน้าผลตรวจสอบหลักสูตร (std_chkstruc.asp)
// server-only — เรียกจาก route handler เท่านั้น (ถือรหัสผ่าน scmis)
//
// ทำไมต้องจัดการ cookie/redirect เอง: fetch ไม่มี cookie jar และไม่ส่ง cookie ข้าม redirect
// flow จริง: GET login.asp (prime ASPSESSIONID) → POST chkdss.asp → 302 chklogin.asp → 302 std_chkstruc.asp
// WAF (Fortinet) บล็อก UA ที่เป็น bot → ต้องส่ง User-Agent แบบเบราว์เซอร์ทุก request

const BASE = 'https://scmis.sci.psu.ac.th/sccheckgraduate'
const ORIGIN = 'https://scmis.sci.psu.ac.th'
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

export class PsuAuthError extends Error {
  constructor(message = 'รหัส scmis ไม่ถูกต้อง') {
    super(message)
    this.name = 'PsuAuthError'
  }
}

type Jar = Map<string, string>

function storeCookies(jar: Jar, res: Response): void {
  const all = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? []
  for (const c of all) {
    const pair = c.split(';')[0]
    const eq = pair.indexOf('=')
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim())
  }
}

function cookieHeader(jar: Jar): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

async function request(jar: Jar, url: string, init: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    redirect: 'manual',
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'th,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      ...(jar.size ? { Cookie: cookieHeader(jar) } : {}),
      ...init.headers,
    },
  })
}

// ตาม redirect เอง พร้อมสะสม cookie (สูงสุด 6 hop กัน loop)
async function followRedirects(jar: Jar, res0: Response, fromUrl: string): Promise<Response> {
  let res = res0
  let url = fromUrl
  for (let hop = 0; hop < 6 && res.status >= 300 && res.status < 400; hop++) {
    storeCookies(jar, res)
    const loc = res.headers.get('location')
    if (!loc) break
    url = new URL(loc, url).toString().replace(/^http:/, 'https:')
    res = await request(jar, url, { method: 'GET' })
  }
  storeCookies(jar, res)
  return res
}

export async function fetchStructureHtml(username: string, password: string): Promise<string> {
  const jar: Jar = new Map()

  // 1) prime: GET หน้า login เพื่อรับ ASPSESSIONID
  await followRedirects(jar, await request(jar, `${BASE}/login.asp`, { method: 'GET' }), `${BASE}/login.asp`)

  // 2) POST รหัสไป chkdss.asp แล้วตาม redirect ไปหน้าผลลัพธ์
  const posted = await request(jar, `${BASE}/chkdss.asp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: `${BASE}/login.asp`,
      Origin: ORIGIN,
    },
    body: new URLSearchParams({ username, password }).toString(),
  })
  const final = await followRedirects(jar, posted, `${BASE}/chkdss.asp`)
  const html = await final.text()

  // login สำเร็จ → หน้า std_chkstruc.asp มี "หน่วยกิตสะสม" เสมอ; ล้มเหลว → เด้งกลับหน้า login
  if (!/หน่วยกิตสะสม/.test(html)) throw new PsuAuthError()
  return html
}
