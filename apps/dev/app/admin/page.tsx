"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

export default function AdminPage() {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, FieldMeta>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

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
      if (data.content) {
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
        console.error("Save failed:", response.status, errorData);
        setMessage(
          `❌ Failed to save file: ${errorData.error || response.statusText}`
        );
      }
    } catch (error) {
      console.error("Save error:", error);
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

    // Ask for new filename (without extension)
    const newName = prompt("Enter new filename (without .md extension):");
    if (!newName) return;

    const duplicateName = currentPath
      ? `${currentPath}/${newName}.md`
      : `${newName}.md`;

    setLoading(true);
    setMessage("");

    try {
      // Convert fields back to frontmatter/content
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
    router.push("/admin/login");
    router.refresh();
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
    switch (field.type) {
      case "text":
        return (
          <input
            id={key}
            type="text"
            value={field.value}
            onChange={(e) => updateField(key, e.target.value)}
          />
        );

      case "number":
        return (
          <input
            id={key}
            type="number"
            value={field.value}
            onChange={(e) => updateField(key, parseFloat(e.target.value) || 0)}
          />
        );

      case "date":
        return (
          <input
            id={key}
            type="date"
            value={field.value}
            onChange={(e) => updateField(key, e.target.value)}
          />
        );

      case "markdown":
        return (
          <textarea
            id={key}
            value={field.value}
            onChange={(e) => updateField(key, e.target.value)}
            style={{
              minHeight: key === "content" ? "400px" : "150px",
              fontFamily: "monospace",
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
              style={{ marginBottom: "0.5rem" }}
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
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1>📝 Admin Dashboard</h1>
        <button onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: "2rem",
        }}
      >
        {/* Sidebar */}
        <div className="card">
          <h2>Files</h2>

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
              style={{ cursor: "pointer", color: "#0070f3" }}
            >
              📁 content
            </span>
            {currentPath && (
              <>
                {" / "}
                <span>{currentPath}</span>
              </>
            )}
          </div>

          {/* Back button */}
          {currentPath && (
            <button
              onClick={goUp}
              className="btn btn-secondary"
              style={{
                width: "100%",
                marginBottom: "1rem",
                fontSize: "0.875rem",
              }}
            >
              ⬆️ Go Up
            </button>
          )}

          {/* New file form */}
          <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="new-file.md"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                marginBottom: "0.5rem",
              }}
            />
            <button
              onClick={createFile}
              className="btn btn-primary"
              style={{ width: "100%", fontSize: "0.875rem" }}
              disabled={loading || !newFileName}
            >
              + New File
            </button>
          </div>

          {/* File/folder list */}
          <ul className="file-list">
            {entries.map((entry) => (
              <li
                key={entry.path}
                className="file-item"
                style={{ flexDirection: "column", alignItems: "flex-start" }}
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
                    }}
                  >
                    📁 {entry.name}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => loadFile(entry.path)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0070f3",
                        cursor: "pointer",
                        textAlign: "left",
                        marginBottom: "0.5rem",
                        fontWeight:
                          selectedFile === entry.path ? "bold" : "normal",
                      }}
                    >
                      📄 {entry.name}
                    </button>
                    <button
                      onClick={() => deleteFile(entry.path)}
                      className="btn btn-danger"
                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Editor */}
        <div className="card">
          {selectedFile ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h2>Edit: {selectedFile}</h2>
                <button
                  onClick={duplicateFile}
                  className="btn btn-secondary"
                  disabled={loading}
                  style={{ fontSize: "0.875rem" }}
                >
                  📋 Duplicate
                </button>
              </div>

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
                  <h3 style={{ fontSize: "1.1rem" }}>Fields</h3>
                  <button
                    onClick={addField}
                    className="btn btn-primary"
                    style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                  >
                    + Add Field
                  </button>
                </div>

                {Object.keys(fields).length === 0 ? (
                  <p style={{ color: "#999", fontStyle: "italic" }}>
                    No fields yet. Click "+ Add Field" to create custom fields.
                    <br />
                    <small>
                      Field types: text, date, number, markdown, image
                    </small>
                  </p>
                ) : (
                  Object.entries(fields).map(([key, field]) => (
                    <div
                      key={key}
                      className="form-group"
                      style={{ position: "relative" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <label htmlFor={key}>
                          {key}
                          <span
                            style={{
                              marginLeft: "0.5rem",
                              fontSize: "0.75rem",
                              color: "#999",
                            }}
                          >
                            ({field.type})
                          </span>
                        </label>
                        <button
                          onClick={() => removeField(key)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#e00",
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

              {message && (
                <div
                  style={{
                    marginBottom: "1rem",
                    padding: "0.75rem",
                    background: message.includes("✅") ? "#e6ffe6" : "#ffe6e6",
                    borderRadius: "4px",
                  }}
                >
                  {message}
                </div>
              )}

              <button
                onClick={saveFile}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "💾 Save Changes"}
              </button>
            </>
          ) : (
            <div
              style={{ textAlign: "center", padding: "3rem", color: "#999" }}
            >
              <p>Select a file from the sidebar or create a new one</p>
              <small style={{ display: "block", marginTop: "1rem" }}>
                Available field types: text, date, number, markdown, image
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
