// apps/backend/routes/sop.route.js
import express from "express";
import { success, z } from "zod";
import { v4 as uuidv4 } from "uuid";
import supabase from "../db/index.js"; // your existing Supabase client
import jsonResponse from "../utils/response.js"; // your response helper

const router = express.Router();
const BUCKET = "sops";

/* ---------------------------------------------------------
   1️⃣ Sign URL for new upload (frontend gets a PUT URL)
----------------------------------------------------------*/
// apps/backend/routes/sop.route.js
router.post("/sign-upload", async (req, res) => {
  console.log("[sign-upload] Request received");

  try {
    const body = req.body;
    console.log("[sign-upload] Body received:", body);

    const id = uuidv4();
    const storagePath = `sops/${id}/${body.filename}`;

    // Insert metadata
    const { error: insertErr } = await supabase.from("sop_files").insert({
      id,
      machine_name: body.machine_name,
      department: body.department,
      filename: body.filename,
      ext: body.ext,
      storage_path: storagePath,
      version: 1,
      uploaded_by: body.uploaded_by,
      updated_by: body.updated_by,
    });

    if (insertErr) throw insertErr;

    // Generate signed upload URL
    const { data: signedData, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath, {
        upsert: true,
        contentType:
          body.ext === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

    console.log("[sign-upload] createSignedUploadUrl →", signedData, signErr);

    const uploadUrl =
      signedData?.signedUrl || signedData?.url || signedData?.path || null;

    if (!uploadUrl) {
      throw new Error(
        "Signed upload URL not generated — check Supabase key & Storage policies."
      );
    }

    return res.json({
      success: true,
      Message: "Signed URL ready",
      Data: {
        uploadUrl,
        fileId: id,
        storagePath,
      },
    });
  } catch (err) {
    console.error("[sign-upload error]", err);
    return res.status(400).json(jsonResponse(false, err.message));
  }
});

/* ---------------------------------------------------------
   2️⃣ Commit after successful PUT to Supabase Storage
----------------------------------------------------------*/
router.post("/commit", async (req, res) => {
  try {
    const schema = z.object({
      fileId: z.string().uuid(),
    });
    const { fileId } = schema.parse(req.body);

    // Verify record exists
    const { data: fileData, error } = await supabase
      .from("sop_files")
      .select("*")
      .eq("id", fileId)
      .single();
    if (error || !fileData)
      throw new Error("File record not found or already committed");

    // ✅ Try downloading file to verify it's valid
    const { data: fileBlob, error: dlErr } = await supabase.storage
      .from(BUCKET)
      .download(fileData.storage_path);

    if (dlErr) throw new Error("Uploaded file missing or inaccessible");
    if (!fileBlob || fileBlob.size < 200) {
      throw new Error("File appears to be corrupted or empty");
    }

    // ✅ Check MIME type (optional)
    const mimeType = fileBlob.type || "unknown";
    console.log(`[commit] MIME check: ${mimeType}`);

    if (
      ![
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(mimeType)
    ) {
      console.warn("[commit] Unexpected MIME type:", mimeType);
    }

    // ✅ Mark as finalized
    await supabase
      .from("sop_files")
      .update({ updated_at: new Date() })
      .eq("id", fileId);

    return res.json({
      success: true,
      Message: "File upload committed and verified",
    });
  } catch (err) {
    console.error("[commit]", err);
    res.status(400).json(jsonResponse(false, err.message));
  }
});

/* ---------------------------------------------------------
   3️⃣ List SOPs with machine + department
----------------------------------------------------------*/
router.get("/list", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("sop_files")
      .select("*")
      .eq("version", 1)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return res.json({
      success: true,
      Message: "SOPs fetched",
      Data: data,
    });
  } catch (err) {
    console.error("[list]", err);
    res.status(500).json(jsonResponse(false, err.message));
  }
});

/* ---------------------------------------------------------
   4️⃣ Replace current version (auto-archive old one)
----------------------------------------------------------*/
router.post("/replace/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { filename, ext, uploaded_by, updated_by } = req.body;

    const { data: oldFile, error: oldErr } = await supabase
      .from("sop_files")
      .select("*")
      .eq("id", id)
      .single();
    if (oldErr || !oldFile) throw new Error("Old file not found");

    // Downgrade old file to version=0
    await supabase.from("sop_files").update({ version: 0 }).eq("id", id);

    // Create new file record linked to old version
    const newId = uuidv4();
    const storagePath = `sops/${newId}/${filename}`;

    const { data: newFile, error: newErr } = await supabase
      .from("sop_files")
      .insert({
        id: newId,
        machine_name: oldFile.machine_name,
        department: oldFile.department,
        filename,
        ext,
        storage_path: storagePath,
        version: 1,
        prev_file_id: id,
        uploaded_by,
        updated_by,
      })
      .select()
      .single();

    if (newErr) throw newErr;

    // Signed upload URL for replacement
    const { data: signedUrlData, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath);

    if (signErr) throw signErr;

    return res.json({
      success: true,
      Message: "Ready to replace file",
      Data: {
        uploadUrl: signedUrlData.signedUrl,
        newFileId: newId,
        storagePath,
      },
    });
  } catch (err) {
    console.error("[replace]", err);
    res.status(400).json(jsonResponse(false, err.message));
  }
});

/* ---------------------------------------------------------
   5️⃣ Restore previous version
----------------------------------------------------------*/
router.post("/restore/:id", async (req, res) => {
  try {
    let { id } = req.params;
    id = id.trim();
    console.log("[restore] Restore request for:", id);

    // 1️⃣ Fetch the current file and its previous version link
    const { data: currentFile, error: fetchErr } = await supabase
      .from("sop_files")
      .select("id, prev_file_id, storage_path, filename")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!currentFile) throw new Error("Current file not found");
    if (!currentFile.prev_file_id)
      throw new Error("No previous version available for this file");

    console.log("[restore] Current file:", currentFile);

    // 2️⃣ Delete current file from Supabase Storage
    const { error: delStorageErr } = await supabase.storage
      .from(BUCKET)
      .remove([currentFile.storage_path]);
    if (delStorageErr) throw delStorageErr;
    console.log("[restore] Deleted current file from storage");

    // 3️⃣ Delete current DB record
    const { error: delDbErr } = await supabase
      .from("sop_files")
      .delete()
      .eq("id", id);
    if (delDbErr) throw delDbErr;
    console.log("[restore] Deleted current DB record");

    // 4️⃣ Promote previous version to version 1
    const { data: restored, error: promoteErr } = await supabase
      .from("sop_files")
      .update({ version: 1, updated_at: new Date() })
      .eq("id", currentFile.prev_file_id)
      .select()
      .maybeSingle();

    if (promoteErr) throw promoteErr;
    console.log("[restore] Promoted old version:", restored);

    return res.json({
      success: true,
      Message: "Previous version restored and current version deleted",
      Data: restored,
    });
  } catch (err) {
    console.error("[restore]", err);
    res.status(400).json(jsonResponse(false, err.message));
  }
});

/* ---------------------------------------------------------
   6️⃣ Signed URL for view/download
----------------------------------------------------------*/
router.get("/signed/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[signed] File ID received:", id);

    const { data: file, error } = await supabase
      .from("sop_files")
      .select("id, storage_path, filename, version")
      .eq("id", id)
      .maybeSingle();

    console.log("[signed] Query result:", file, error);

    if (error) throw error;
    if (!file) throw new Error("File not found in sop_files table");

    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.storage_path, 600);

    if (signErr) throw signErr;

    const downloadUrl = `${signed.signedUrl}${
      signed.signedUrl.includes("?") ? "&" : "?"
    }&response-content-disposition=inline`;

    return res.json({
      success: true,
      Message: "Signed URL generated",
      Data: {
        downloadUrl,
        filename: file.filename,
      },
    });
  } catch (err) {
    console.error("[signed]", err);
    res.status(400).json(jsonResponse(false, err.message));
  }
});

export default router;
