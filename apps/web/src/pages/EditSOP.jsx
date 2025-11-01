// src/pages/EditSop.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { PDFDocument } from "pdf-lib";

const BASE_URL = "http://localhost:3000/api";
const SOP_URL = `${BASE_URL}/sops`;

export default function EditSop({ userId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [filename, setFilename] = useState("");
  const canvasRef = useRef(null);
  const [edited, setEdited] = useState(false);

  // Fetch signed file URL
  useEffect(() => {
    (async () => {
      try {
        console.log("[EditSOP] useParams id:", id);
        const { data } = await axios.get(`${SOP_URL}/signed/${id}`);
        console.log("[EditSOP] /signed response:", data);
        setFileUrl(data?.Data?.downloadUrl);
        setFilename(data?.Data?.filename || `Edited_${Date.now()}.pdf`);
        setLoading(false);
      } catch (err) {
        console.error("[EditSOP] Error fetching file:", err);
        alert("Failed to fetch SOP. Please try again.");
        navigate("/SopManager");
      }
    })();
  }, [id, navigate]);

  // Add sample text (proof of concept)
  const addText = async () => {
    try {
      setLoading(true);
      const existingPdfBytes = await fetch(fileUrl).then((r) =>
        r.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      firstPage.drawText("Edited via SOP Manager", {
        x: 50,
        y: 50,
        size: 14,
      });
      const editedPdfBytes = await pdfDoc.save();

      // Call backend replace API
      const newFilename = `Edited_${Date.now()}.pdf`;
      const { data: replaceRes } = await axios.post(
        `${SOP_URL}/replace/${id}`,
        {
          filename: newFilename,
          ext: "pdf",
          uploaded_by: userId,
          updated_by: userId,
        }
      );

      const payload = replaceRes?.Data || replaceRes?.data?.Data;
      const uploadUrl = payload?.uploadUrl;
      const newFileId = payload?.newFileId;

      if (!uploadUrl || !newFileId) {
        throw new Error("Missing upload URL or newFileId from replace API");
      }

      // Upload edited file to Supabase
      await axios.put(uploadUrl, new Blob([editedPdfBytes]), {
        headers: { "Content-Type": "application/pdf", "x-upsert": "true" },
      });

      // Commit metadata
      await axios.post(`${SOP_URL}/commit`, { fileId: newFileId });
      alert("✅ File edited and updated successfully!");
      navigate("/SopManager");
    } catch (err) {
      console.error("[EditSOP] Error in edit flow:", err);
      alert("Failed to edit or upload file.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading preview...</p>;

  return (
    <div className="p-6 bg-[#0b0f19] text-white min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">Edit SOP</h2>

      {/* File preview */}
      <iframe
        src={fileUrl}
        title="SOP Preview"
        className="w-full h-[600px] rounded mb-4"
      />

      {/* Basic editing buttons */}
      <div className="flex gap-3">
        <button
          onClick={addText}
          className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded"
        >
          Add “Edited via SOP Manager” Text
        </button>
        <button
          onClick={() => navigate("/SopManager")}
          className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
