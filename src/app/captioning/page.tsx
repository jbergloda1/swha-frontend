"use client";

import { useState } from "react";
import { generateCaption } from "../api/captioning";
import { FaUpload, FaLink, FaTimes, FaCopy, FaImage } from "react-icons/fa";

interface CaptioningResult {
  caption: string;
}

export default function ImageCaptioningPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [conditionalText, setConditionalText] = useState("");
  const [result, setResult] = useState<CaptioningResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl(""); // Clear URL input
      setFileName(file.name);
      setError("");
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    setImageFile(null); // Clear file input
    setFileName(e.target.value);
    setError("");
  };

  const handleClearInput = () => {
    setImageFile(null);
    setImageUrl("");
    setFileName("");
    setError("");
    setResult(null);
  };

  const handleGenerateCaption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile && !imageUrl) {
      setError("Please upload an image or provide an image URL.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await generateCaption({
        file: imageFile || undefined,
        image_url: imageUrl,
        conditional_text: conditionalText,
      });
      setResult(data);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Captioning failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.caption) {
      navigator.clipboard.writeText(result.caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 text-center">
          Image Captioning
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          Upload an image or provide a URL to generate a caption.
        </p>
        <form onSubmit={handleGenerateCaption} className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FaImage className="mx-auto h-12 w-12 text-gray-400" />
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
            >
              <span>Upload an image</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                accept="image/*"
              />
            </label>
            <p className="pl-1">or provide a URL</p>

            {fileName && (
              <div className="mt-4 flex items-center justify-center bg-gray-100 p-2 rounded-md text-sm text-gray-700">
                <span className="truncate">{fileName}</span>
                <button
                  type="button"
                  onClick={handleClearInput}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
            )}

            {!imageFile && (
              <div className="mt-4 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLink className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={handleUrlChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="conditional-text" className="block text-sm font-medium text-gray-700">
              Optional Text (to guide the caption)
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="conditional-text"
                id="conditional-text"
                value={conditionalText}
                onChange={(e) => setConditionalText(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="e.g., a person sitting on a bench"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || (!imageFile && !imageUrl)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Generating..." : "Generate Caption"}
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-blue-700 mb-2">
              Generated Caption
            </h2>
            <div className="relative bg-white p-4 rounded-md border">
              <p className="text-gray-800 whitespace-pre-wrap">
                {result.caption}
              </p>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 text-gray-500 hover:text-blue-600"
              >
                {copied ? "Copied!" : <FaCopy />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 