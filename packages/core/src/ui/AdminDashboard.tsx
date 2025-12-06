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

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/cms/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ File uploaded! Path: ${data.url}`);
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage("❌ Failed to upload file");
      }
    } catch (error) {
      setMessage("❌ Error uploading file");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const renderField = (key: string, field: FieldMeta) => {
    switch (field.type) {
      case "text":
        return (
          <input
            id={key}
            type="text"
            value={field.value}
            onChange={(e) => updateField(key, e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        );
      case "number":
        return (
          <input
            id={key}
            type="number"
            value={field.value}
            onChange={(e) => updateField(key, parseFloat(e.target.value) || 0)}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        );
      case "date":
        return (
          <input
            id={key}
            type="date"
            value={field.value}
            onChange={(e) => updateField(key, e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        );
      case "markdown":
        return (
          <textarea
            id={key}
            value={field.value}
            onChange={(e) => updateField(key, e.target.value)}
            style={{
              width: "100%",
              minHeight: key === "content" ? "400px" : "150px",
              fontFamily: "monospace",
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
            placeholder={
              key === "content"
                ? "Write your markdown content here..."
                : "Markdown text..."
            }
          />
        );
      case "image":
        return (
          <div>
            <input
              id={key}
              type="text"
              value={field.value}
              onChange={(e) => updateField(key, e.target.value)}
              placeholder="/uploads/image.jpg or https://..."
              style={{
                width: "100%",
                padding: "0.5rem",
                marginBottom: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(key, e)}
              disabled={uploading}
              style={{ marginBottom: "0.5rem" }}
            />
            {field.value && (
              <img
                src={field.value}
                alt={key}
                style={{
                  maxWidth: "200px",
                  display: "block",
                  marginTop: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
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
          />
        );
    }
  };

  return (
    <div
      className="container"
      style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1>📝 Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: "0.5rem 1rem",
            background: "#f5f5f5",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(250px, 300px) 1fr",
          gap: "2rem",
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>Files</h2>

          {/* Breadcrumb */}
          <div
            style={{
              marginBottom: "1rem",
              fontSize: "0.875rem",
              color: "#666",
            }}
          >
            <span
              onClick={() => setCurrentPath("")}
              style={{
                cursor: "pointer",
                color: "#0070f3",
                textDecoration: "underline",
              }}
            >
              content
            </span>
            {currentPath && (
              <>
                {" / "}
                <span style={{ fontWeight: "bold" }}>{currentPath}</span>
              </>
            )}
          </div>

          {/* Back button */}
          {currentPath && (
            <button
              onClick={goUp}
              style={{
                width: "100%",
                marginBottom: "1rem",
                padding: "0.5rem",
                background: "#f5f5f5",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              ⬆️ Go Up
            </button>
          )}

          {/* New file form */}
          <div
            style={{
              marginBottom: "1.5rem",
              paddingBottom: "1.5rem",
              borderBottom: "1px solid #eee",
            }}
          >
            <input
              type="text"
              placeholder="new-file.md"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                marginBottom: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
            <button
              onClick={createFile}
              disabled={loading || !newFileName}
              style={{
                width: "100%",
                padding: "0.5rem",
                background: "#0070f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              + New File
            </button>
          </div>

          {/* File/folder list */}
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {entries.length === 0 && (
              <li style={{ color: "#999", fontStyle: "italic" }}>
                Empty directory
              </li>
            )}
            {entries.map((entry) => (
              <li
                key={entry.path}
                style={{
                  marginBottom: "0.5rem",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {entry.type === "directory" ? (
                  <button
                    onClick={() => navigateToDir(entry.path)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0070f3",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "1rem",
                      padding: "0.25rem 0",
                      fontWeight: "bold",
                    }}
                  >
                    📁 {entry.name}
                  </button>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={() => loadFile(entry.path)}
                      style={{
                        background: "none",
                        border: "none",
                        color: selectedFile === entry.path ? "#000" : "#444",
                        cursor: "pointer",
                        textAlign: "left",
                        padding: "0.25rem 0",
                        fontWeight:
                          selectedFile === entry.path ? "bold" : "normal",
                        textDecoration:
                          selectedFile === entry.path ? "underline" : "none",
                        flex: 1,
                      }}
                    >
                      📄 {entry.name}
                    </button>
                    <button
                      onClick={() => deleteFile(entry.path)}
                      disabled={loading}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#d32f2f",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        opacity: 0.7,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Editor */}
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {selectedFile ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "2rem",
                  paddingBottom: "1rem",
                  borderBottom: "1px solid #eee",
                }}
              >
                <h2 style={{ margin: 0 }}>Edit: {selectedFile}</h2>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={duplicateFile}
                    disabled={loading}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#f5f5f5",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    📋 Duplicate
                  </button>
                  <button
                    onClick={saveFile}
                    disabled={loading}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#0070f3",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? "Saving..." : "💾 Save Changes"}
                  </button>
                </div>
              </div>

              {message && (
                <div
                  style={{
                    marginBottom: "1.5rem",
                    padding: "0.75rem",
                    background: message.includes("✅") ? "#e6ffe6" : "#ffe6e6",
                    borderRadius: "4px",
                    border: message.includes("✅")
                      ? "1px solid #a5d6a7"
                      : "1px solid #ef9a9a",
                  }}
                >
                  {message}
                </div>
              )}

              {/* Dynamic Fields */}
              <div style={{ marginBottom: "2rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Fields</h3>
                  <button
                    onClick={addField}
                    style={{
                      fontSize: "0.875rem",
                      padding: "0.4rem 0.8rem",
                      background: "#e1f5fe",
                      color: "#0288d1",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    + Add Field
                  </button>
                </div>

                {Object.keys(fields).length === 0 ? (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      background: "#f9f9f9",
                      borderRadius: "4px",
                      border: "1px dashed #ccc",
                    }}
                  >
                    <p
                      style={{ color: "#666", fontStyle: "italic", margin: 0 }}
                    >
                      No fields yet. Click "+ Add Field" to start.
                    </p>
                    <small
                      style={{
                        color: "#999",
                        marginTop: "0.5rem",
                        display: "block",
                      }}
                    >
                      Add 'content' field for the main body
                    </small>
                  </div>
                ) : (
                  Object.entries(fields).map(([key, field]) => (
                    <div
                      key={key}
                      style={{
                        marginBottom: "1.5rem",
                        background: "#fff",
                        border: "1px solid #eee",
                        padding: "1rem",
                        borderRadius: "6px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <label htmlFor={key} style={{ fontWeight: 500 }}>
                          {key}
                          <span
                            style={{
                              marginLeft: "0.5rem",
                              fontSize: "0.75rem",
                              color: "#999",
                              background: "#f0f0f0",
                              padding: "0.1rem 0.4rem",
                              borderRadius: "4px",
                            }}
                          >
                            {field.type}
                          </span>
                        </label>
                        <button
                          onClick={() => removeField(key)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#e57373",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                          }}
                        >
                          ✕ Remove
                        </button>
                      </div>

                      {renderField(key, field)}
                    </div>
                  ))
                )}
              </div>

              {/* General File Upload */}
              <div
                style={{
                  marginTop: "3rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid #eee",
                }}
              >
                <h3
                  style={{
                    fontSize: "1rem",
                    marginBottom: "0.5rem",
                    color: "#666",
                  }}
                >
                  Quick File Upload
                </h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ flex: 1 }}
                  />
                  {uploading && (
                    <span style={{ color: "#666" }}>Uploading...</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "5rem 2rem",
                color: "#999",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👈</div>
              <p style={{ fontSize: "1.1rem" }}>
                Select a file from the sidebar to edit
              </p>
              <p>or create a new file to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
