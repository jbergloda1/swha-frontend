import axios from "../lib/axios";

export const getVoices = async () => {
  const res = await axios.get("/api/v1/tts/voices");
  return res.data;
};

export const getLanguages = async () => {
  const res = await axios.get("/api/v1/tts/languages");
  return res.data;
};

export const generateTTS = async (payload: {
  text: string;
  voice: string;
  language_code: string;
  speed: number;
  split_pattern: string;
}) => {
  const res = await axios.post("/api/v1/tts/generate", payload);
  return res.data;
}; 