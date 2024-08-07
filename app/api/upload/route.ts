import mime from "mime";
import { join } from "path";
import * as dateFn from "date-fns";
import { stat, mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";

const UPLOAD_DIR = join(process.cwd(), "public/uploads");

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll("files");
  const uploadFilePromises: Promise<string | false>[] = [];

  if (files.length === 0) {
    return NextResponse.json({ uploadedFiles: [] });
  }

  for (const file of files) {
    if (!(file instanceof Blob)) {
      continue;
    }

    uploadFilePromises.push(uploadFile(file));
  }

  return NextResponse.json({
    uploadedFiles: (await Promise.all(uploadFilePromises)).filter(
      (uploadedFile) => uploadedFile !== false
    ),
  });
}

async function uploadFile(file: Blob) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

  const filenameParts: string[] = [];
  if ("name" in file && typeof file.name === "string") {
    filenameParts.push(file.name.replace(/\.[^/.]+$/, ""));
  }
  filenameParts.push(`${uniqueSuffix}.${mime.getExtension(file.type)}`);

  try {
    const filename = filenameParts.join("-");
    await writeFile(`${UPLOAD_DIR}/${filename}`, buffer);
    return `/uploads/${filename}`;
  } catch (e) {
    console.error(
      `Error while trying to upload the file: ${filenameParts[0]}.\n`,
      e
    );

    return false;
  }
}
