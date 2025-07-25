import axios from "../lib/axios";

export const detectTable = async ({ file, imageUrl, visualize = true }: { file?: File; imageUrl?: string; visualize?: boolean }) => {
  const formData = new FormData();
  if (file) formData.append("file", file);
  if (imageUrl) formData.append("image_url", imageUrl);
  formData.append("visualize", String(visualize));
  const res = await axios.post("/api/v1/table/detect", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "Accept": "image/png",
    },
    responseType: "blob",
  });
  return res.data as Blob;
}; 