import fetch from 'node-fetch';
import FormData from 'form-data';

export async function proxyMultipart(req, res, FASTAPI_URL) {
  // สร้าง form ใหม่
  const form = new FormData();
  // req.body จะไม่มีไฟล์ ต้องอ่านจาก req.files (ถ้าใช้ multer)
  // และ req.body สำหรับ field อื่นๆ
  if (req.files) {
    for (const file of req.files) {
      form.append(file.fieldname, file.buffer, file.originalname);
    }
  }
  if (req.body) {
    for (const key in req.body) {
      form.append(key, req.body[key]);
    }
  }
  const response = await fetch(FASTAPI_URL + req.url, {
    method: req.method,
    headers: form.getHeaders(),
    body: form,
  });
  const contentType = response.headers.get('content-type');
  res.status(response.status);
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    res.json(data);
  } else {
    const text = await response.text();
    res.send(text);
  }
}
