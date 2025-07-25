/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef } from "react";
import { detectTable } from "../api/table";
import { TableDetectParams } from "../types";
import { FaTable, FaUpload, FaLink, FaTimes } from "react-icons/fa";

export default function TableDetectPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [resultImg, setResultImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setImageUrl("");
    setError("");
    if (f) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    setFile(null);
    setError("");
    setPreview(e.target.value ? e.target.value : null);
  };

  const handleClear = () => {
    setFile(null);
    setImageUrl("");
    setResultImg(null);
    setError("");
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResultImg(null);
    try {
      const params: TableDetectParams = {
        file: file || undefined,
        imageUrl: imageUrl || undefined,
        visualize: true,
      };
      const blob = await detectTable(params);
      const imgUrl = URL.createObjectURL(blob);
      setResultImg(imgUrl);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    } catch (err: any) {
      setError("Detection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-300 py-8 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-yellow-200">
        <div className="flex items-center justify-center mb-6">
          <FaTable className="text-yellow-600 h-10 w-10 mr-2" />
          <h1 className="text-3xl font-bold text-gray-900">Table Detection</h1>
        </div>
        <p className="text-gray-600 mb-6 text-center">
          Upload an image or provide an image URL to detect tables. The result will be visualized below.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <label className="flex flex-col items-center w-full md:w-1/2 cursor-pointer bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-lg p-6 hover:bg-yellow-100 transition">
              <FaUpload className="h-8 w-8 text-yellow-400 mb-2" />
              <span className="text-gray-700 font-medium mb-2">Upload Image</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
              {file && (
                <span className="mt-2 text-xs text-gray-500 truncate max-w-[120px]">{file.name}</span>
              )}
            </label>
            <div className="flex flex-col w-full md:w-1/2">
              <div className="relative">
                <FaLink className="absolute left-3 top-3 text-yellow-400" />
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={handleUrlChange}
                  className="pl-10 pr-8 py-2 border border-yellow-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                />
                {imageUrl && (
                  <button type="button" onClick={handleClear} className="absolute right-2 top-2 text-gray-400 hover:text-gray-700">
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>
          </div>
          {(file || imageUrl) && preview && (
            <div className="flex flex-col items-center mt-4">
              <span className="text-gray-500 text-xs mb-2">Preview</span>
              <img src={preview} alt="Preview" className="max-h-48 rounded shadow border border-yellow-200" />
              <button type="button" onClick={handleClear} className="mt-2 text-xs text-gray-400 hover:text-gray-700">Clear Selection</button>
            </div>
          )}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-center">{error}</div>}
          <button
            type="submit"
            disabled={loading || (!file && !imageUrl)}
            className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg font-semibold text-lg shadow hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Detecting..." : "Detect Table"}
          </button>
        </form>
        {resultImg && (
          <div className="mt-10 text-center">
            <h2 className="text-xl font-semibold text-yellow-700 mb-4">Detection Result</h2>
            <img src={resultImg} alt="Table Detection Result" className="mx-auto rounded-lg border-2 border-yellow-300 shadow-lg max-h-[400px]" />
          </div>
        )}
      </div>
    </div>
  );
} 