import * as fs from "fs";
import * as path from "path";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

class CustomUploadError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "CustomUploadError";
    this.statusCode = statusCode;
  }
}

export async function validateAndSaveFile(
  file: File,
  type: "avatar" | "certificate",
  coachId: number
): Promise<string> {
  // Validate file presence
  if (!file || !file.name) {
    throw new CustomUploadError("Không tìm thấy file upload", 400);
  }

  // Validate size limits
  const maxSize = type === "avatar" ? 3 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxSize) {
    const limitLabel = type === "avatar" ? "3MB" : "5MB";
    const entityLabel = type === "avatar" ? "Ảnh đại diện" : "Ảnh chứng chỉ";
    throw new CustomUploadError(
      `${entityLabel} không được vượt quá ${limitLabel}`,
      400
    );
  }

  // Validate extension
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new CustomUploadError("Chỉ được chọn ảnh JPG, PNG hoặc WEBP", 400);
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new CustomUploadError("Chỉ được chọn ảnh JPG, PNG hoặc WEBP", 400);
  }

  // Generate safe filename
  const timestamp = Date.now();
  const safeFilename = `coach-${coachId}-${type}-${timestamp}${ext}`;

  // Ensure upload directory exists
  const subDir = type === "avatar" ? "avatar" : "certificates";
  const uploadDir = path.join(process.cwd(), "public", "uploads", "coaches", subDir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Read file data and write to disk
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const targetPath = path.join(uploadDir, safeFilename);
  fs.writeFileSync(targetPath, buffer);

  // Return relative path
  return `/uploads/coaches/${subDir}/${safeFilename}`;
}

export function deleteFile(relativePath: string) {
  try {
    const fullPath = path.join(process.cwd(), "public", relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error("Lỗi khi xóa file:", err);
  }
}

export async function validateAndSaveCourtFile(
  file: File,
  courtId: number
): Promise<string> {
  if (!file || !file.name) {
    throw new CustomUploadError("Không tìm thấy file upload", 400);
  }

  // 5MB limit
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new CustomUploadError(
      "Hình ảnh sân không được vượt quá 5MB",
      400
    );
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new CustomUploadError("Chỉ được chọn ảnh JPG, PNG hoặc WEBP", 400);
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new CustomUploadError("Chỉ được chọn ảnh JPG, PNG hoặc WEBP", 400);
  }

  const timestamp = Date.now();
  const safeFilename = `court-${courtId}-${timestamp}${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "courts");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const targetPath = path.join(uploadDir, safeFilename);
  fs.writeFileSync(targetPath, buffer);

  return `/uploads/courts/${safeFilename}`;
}
