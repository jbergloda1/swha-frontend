import axios from "../lib/axios";

export const transcribeAudioFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post("/api/v1/stt/transcribe", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const transcribeAudioUrl = async (audioUrl: string) => {
  const formData = new FormData();
  formData.append("audio_url", audioUrl);
  const res = await axios.post("/api/v1/stt/transcribe", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}; 