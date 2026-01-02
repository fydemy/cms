"use client";

import React, { useState, useEffect } from "react";

// Types
interface FileEntry {
  path: string;
  name: string;
  type: "file" | "directory";
}

type FieldType = "text" | "date" | "number" | "markdown" | "image";

interface FieldMeta {
  type: FieldType;
  value: any;
}

export function AdminDashboard() {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, FieldMeta>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  const loadDirectory = async (path: string) => {
    try {
      const url = path ? `/api/cms/list/${path}` : "/api/cms/list";
      const response = await fetch(url);
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error("Failed to load directory:", error);
    }
  };

  const loadFile = async (filePath: string) => {
    try {
      const response = await fetch(`/api/cms/content/${filePath}`);
      const data = await response.json();
      setSelectedFile(filePath);

      // Convert loaded data to fields format
      const loadedFields: Record<string, FieldMeta> = {};

      // Add content as markdown field if exists
      if (data.content !== undefined) {
        loadedFields["content"] = { type: "markdown", value: data.content };
      }

      // Add frontmatter fields with type detection
      Object.entries(data.data || {}).forEach(([key, value]) => {
        loadedFields[key] = {
          type: detectFieldType(value as any),
          value,
        };
      });

      setFields(loadedFields);
    } catch (error) {
      setMessage("Failed to load file");
    }
  };

  const detectFieldType = (value: any): FieldType => {
    if (typeof value === "number") return "number";
    if (typeof value === "string") {
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) return "date";
      if (value.startsWith("/uploads/") || value.startsWith("http"))
        return "image";
      if (value.length > 100) return "markdown";
    }
    return "text";
  };

  const saveFile = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setMessage("");

    try {
      // Separate content from frontmatter
      const frontmatter: Record<string, any> = {};
      let content = "";

      Object.entries(fields).forEach(([key, field]) => {
        if (key === "content") {
          content = field.value;
        } else {
          frontmatter[key] = field.value;
        }
      });

      const response = await fetch(`/api/cms/content/${selectedFile}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: frontmatter, content }),
      });

      if (response.ok) {
        setMessage("✅ File saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage(
          `❌ Failed to save file: ${errorData.error || response.statusText}`
        );
      }
    } catch (error) {
      setMessage(
        `❌ Error saving file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const createFile = async () => {
    if (!newFileName) return;

    const fileName = newFileName.endsWith(".md")
      ? newFileName
      : `${newFileName}.md`;
    const fullPath = currentPath ? `${currentPath}/${fileName}` : fileName;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/cms/content/${fullPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {},
          content: "",
        }),
      });

      if (response.ok) {
        setMessage("✅ File created!");
        setNewFileName("");
        loadDirectory(currentPath);
        loadFile(fullPath);
      } else {
        setMessage("❌ Failed to create file");
      }
    } catch (error) {
      setMessage("❌ Error creating file");
    } finally {
      setLoading(false);
    }
  };

  const duplicateFile = async () => {
    if (!selectedFile) return;

    const newName = prompt("Enter new filename (without .md extension):");
    if (!newName) return;

    const duplicateName = currentPath
      ? `${currentPath}/${newName}.md`
      : `${newName}.md`;

    setLoading(true);
    setMessage("");

    try {
      const frontmatter: Record<string, any> = {};
      let content = "";

      Object.entries(fields).forEach(([key, field]) => {
        if (key === "content") {
          content = field.value;
        } else {
          frontmatter[key] = field.value;
        }
      });

      const response = await fetch(`/api/cms/content/${duplicateName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: frontmatter, content }),
      });

      if (response.ok) {
        setMessage("✅ File duplicated!");
        loadDirectory(currentPath);
        loadFile(duplicateName);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage(
          `❌ Failed to duplicate file: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      setMessage("❌ Error duplicating file");
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (filePath: string) => {
    if (!confirm(`Delete ${filePath}?`)) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/cms/content/${filePath}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage("✅ File deleted!");
        if (selectedFile === filePath) {
          setSelectedFile(null);
          setFields({});
        }
        loadDirectory(currentPath);
      } else {
        setMessage("❌ Failed to delete file");
      }
    } catch (error) {
      setMessage("❌ Error deleting file");
    } finally {
      setLoading(false);
    }
  };

  const navigateToDir = (dirPath: string) => {
    setCurrentPath(dirPath);
    setSelectedFile(null);
  };

  const goUp = () => {
    const parts = currentPath.split("/");
    parts.pop();
    setCurrentPath(parts.join("/"));
    setSelectedFile(null);
  };

  const handleLogout = async () => {
    await fetch("/api/cms/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const updateField = (key: string, value: any) => {
    setFields((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
  };

  const addField = () => {
    const fieldName = prompt("Enter field name:");
    if (!fieldName || fields[fieldName]) return;

    const fieldType = prompt(
      "Enter field type (text/date/number/markdown/image):",
      "text"
    ) as FieldType;
    const validTypes: FieldType[] = [
      "text",
      "date",
      "number",
      "markdown",
      "image",
    ];

    if (!validTypes.includes(fieldType)) {
      alert("Invalid field type! Use: text, date, number, markdown, or image");
      return;
    }

    const defaultValue =
      fieldType === "number"
        ? 0
        : fieldType === "date"
        ? new Date().toISOString().split("T")[0]
        : "";

    setFields((prev) => ({
      ...prev,
      [fieldName]: { type: fieldType, value: defaultValue },
    }));
  };

  const removeField = (key: string) => {
    const newFields = { ...fields };
    delete newFields[key];
    setFields(newFields);
  };

  const handleImageUpload = async (
    key: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/cms/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        updateField(key, data.url);
        setMessage(`✅ Image uploaded!`);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ Failed to upload image");
      }
    } catch (error) {
      setMessage("❌ Error uploading image");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const renderField = (key: string, field: FieldMeta) => {
    const inputClasses =
      "flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50";

    switch (field.type) {
      case "text":
        return (
          <input
            id={key}
            type="text"
            value={field.value}
            onChange={(e) => updateField(key, e.target.value)}
            className={inputClasses}
          />
        );
      case "number":
        return (
          <input
            id={key}
            type="number"
            value={field.value}
            onChange={(e) => updateField(key, parseFloat(e.target.value) || 0)}
            className={inputClasses}
          />
        );
      case "date":
        return (
          <input
            id={key}
            type="date"
            value={field.value}
            onChange={(e) => updateField(key, e.target.value)}
            className={inputClasses}
          />
        );
      case "markdown":
        return (
          <textarea
            id={key}
            value={field.value}
            onChange={(e) => updateField(key, e.target.value)}
            className="flex min-h-[300px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
            placeholder={
              key === "content"
                ? "Write your markdown content here..."
                : "Markdown text..."
            }
          />
        );
      case "image":
        return (
          <div className="space-y-2">
            <input
              id={key}
              type="text"
              value={field.value}
              onChange={(e) => updateField(key, e.target.value)}
              placeholder="/uploads/image.jpg or https://..."
              className={inputClasses}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(key, e)}
              disabled={uploading}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-slate-50 file:text-slate-700
                hover:file:bg-slate-100"
            />
            {field.value && (
              <img
                src={field.value}
                alt={key}
                className="max-w-[200px] rounded-md border border-slate-200"
              />
            )}
          </div>
        );
      default:
        return (
          <input
            id={key}
            type="text"
            value={field.value}
            onChange={(e) => updateField(key, e.target.value)}
            className={inputClasses}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-8">
      <div className="border-b border-slate-200 bg-white px-4 py-4 mb-6">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">
              📝 Admin Dashboard
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold leading-none tracking-tight mb-4">
                Files
              </h2>

              {/* Breadcrumb */}
              <div className="mb-4 text-sm text-slate-500 flex items-center gap-1 overflow-hidden">
                <button
                  onClick={() => setCurrentPath("")}
                  className="hover:text-slate-900 hover:underline shrink-0"
                >
                  content
                </button>
                {currentPath && (
                  <>
                    <span className="text-slate-300">/</span>
                    <span className="font-medium truncate text-slate-900">
                      {currentPath}
                    </span>
                  </>
                )}
              </div>

              {/* Back button */}
              {currentPath && (
                <button
                  onClick={goUp}
                  className="mb-4 inline-flex h-8 w-full items-center justify-center rounded-md bg-slate-100 px-3 text-xs font-medium text-slate-900 hover:bg-slate-200/80"
                >
                  ⬆️ Go Up
                </button>
              )}

              {/* New file form */}
              <div className="mb-6 space-y-2 border-b border-slate-100 pb-6">
                <input
                  type="text"
                  placeholder="new-file.md"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                />
                <button
                  onClick={createFile}
                  disabled={loading || !newFileName}
                  className="inline-flex h-9 w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-slate-50 shadow hover:bg-slate-900/90 disabled:pointer-events-none disabled:opacity-50"
                >
                  + New File
                </button>
              </div>

              {/* File/folder list */}
              <ul className="space-y-1">
                {entries.length === 0 && (
                  <li className="text-sm text-slate-500 italic px-2">
                    Empty directory
                  </li>
                )}
                {entries.map((entry) => (
                  <li key={entry.path}>
                    {entry.type === "directory" ? (
                      <button
                        onClick={() => navigateToDir(entry.path)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                      >
                        📁 {entry.name}
                      </button>
                    ) : (
                      <div className="group flex items-center justify-between rounded-md hover:bg-slate-100 px-2 py-1.5">
                        <button
                          onClick={() => loadFile(entry.path)}
                          className={`flex-1 text-left text-sm truncate ${
                            selectedFile === entry.path
                              ? "font-semibold text-slate-900"
                              : "text-slate-600 group-hover:text-slate-900"
                          }`}
                        >
                          📄 {entry.name}
                        </button>
                        <button
                          onClick={() => deleteFile(entry.path)}
                          disabled={loading}
                          className="opacity-0 group-hover:opacity-100 ml-2 text-slate-400 hover:text-red-500 transition-opacity"
                          title="Delete file"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm min-h-[500px]">
            {selectedFile ? (
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                  <h2 className="text-xl font-semibold tracking-tight break-all">
                    Edit: {selectedFile}
                  </h2>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={duplicateFile}
                      disabled={loading}
                      className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50"
                    >
                      📋 Duplicate
                    </button>
                    <button
                      onClick={saveFile}
                      disabled={loading}
                      className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-slate-50 shadow hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "💾 Save Changes"}
                    </button>
                  </div>
                </div>

                {message && (
                  <div
                    className={`mb-6 rounded-md p-3 text-sm flex items-center gap-2 ${
                      message.includes("✅")
                        ? "bg-green-50 text-green-900 border border-green-200"
                        : "bg-red-50 text-red-900 border border-red-200"
                    }`}
                  >
                    {message}
                  </div>
                )}

                {/* Dynamic Fields */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium leading-none text-slate-500 uppercase tracking-wider">
                      Frontmatter Fields
                    </h3>
                    <button
                      onClick={addField}
                      className="inline-flex h-8 items-center justify-center rounded-md bg-slate-100 px-3 text-xs font-medium text-slate-900 hover:bg-slate-200"
                    >
                      + Add Field
                    </button>
                  </div>

                  {Object.keys(fields).length === 0 ? (
                    <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                      No fields found. Add one or load a file layout.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(fields)
                        .filter(([key]) => key !== "content")
                        .map(([key, field]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label
                                htmlFor={key}
                                className="text-sm font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700"
                              >
                                {key}{" "}
                                <span className="text-slate-400 font-normal text-xs ml-1">
                                  ({field.type})
                                </span>
                              </label>
                              <button
                                onClick={() => removeField(key)}
                                className="text-xs text-red-500 hover:text-red-700 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                            {renderField(key, field)}
                          </div>
                        ))}

                      {fields["content"] && (
                        <div className="pt-6 mt-6 border-t border-slate-100">
                          <label
                            htmlFor="content"
                            className="block text-sm font-medium mb-3 text-slate-900"
                          >
                            Content (Markdown)
                          </label>
                          {renderField("content", fields["content"])}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-slate-500">
                <div className="text-4xl mb-4">📄</div>
                <p>Select a file to edit or create a new one.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
