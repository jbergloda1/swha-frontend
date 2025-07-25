import axios from "../lib/axios";

interface CaptioningParams {
  file?: File;
  image_url?: string;
  conditional_text?: string;
}

export const generateCaption = async ({
  file,
  image_url,
  conditional_text,
}: CaptioningParams) => {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  } else if (image_url) {
    formData.append("image_url", image_url);
  } else {
    throw new Error("Either a file or an image URL must be provided.");
  }

  if (conditional_text) {
    formData.append("conditional_text", conditional_text);
  }

  const res = await axios.post("/api/v1/captioning/generate", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}; 