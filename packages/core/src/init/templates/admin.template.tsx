"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

//Types
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

export default function AdminDashboard() {
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

      const loadedFields: Record<string, FieldMeta> = {};

      if (data.content !== undefined) {
        loadedFields["content"] = { type: "markdown", value: data.content };
      }

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
          <Input
            id={key}
            type="text"
            value={field.value}
            onChange={(e) => updateField(key, e.target.value)}
          />
        );
      case "number":
        return (
          <Input
            id={key}
            type="number"
            value={field.value}
            onChange={(e) => updateField(key, parseFloat(e.target.value) || 0)}
          />
        );
      case "date":
        return (
          <Input
            id={key}
            type="date"
            value={field.value}
            onChange={(e) => updateField(key, e.target.value)}
          />
        );
      case "markdown":
        return (
          <Textarea
            id={key}
            value={field.value}
            onChange={(e) => updateField(key, e.target.value)}
            className="font-mono"
            style={{ minHeight: key === "content" ? "400px" : "150px" }}
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
            <Input
              id={key}
              type="text"
              value={field.value}
              onChange={(e) => updateField(key, e.target.value)}
              placeholder="/uploads/image.jpg or https://..."
            />
            <div className="flex items-center gap-4">
              <label className="relative cursor-pointer rounded-md bg-white font-semibold text-primary hover:text-primary/90">
                <span>Upload a file</span>
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(key, e)}
                  disabled={uploading}
                />
              </label>
            </div>
            {field.value && (
              <div className="mt-2 rounded-lg border p-1 bg-muted w-fit">
                <img
                  src={field.value}
                  alt={key}
                  className="max-w-[200px] h-auto rounded block"
                />
              </div>
            )}
          </div>
        );
      default:
        return (
          <Input
            id={key}
            type="text"
            value={field.value}
            onChange={(e) => updateField(key, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <h1 className="text-xl font-bold tracking-tight">
              📝 Admin Dashboard
            </h1>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">Files</CardTitle>
                <div className="mt-1 text-sm text-muted-foreground truncate">
                  <span
                    onClick={() => setCurrentPath("")}
                    className="cursor-pointer text-primary hover:text-primary/80 font-medium"
                  >
                    content
                  </span>
                  {currentPath && (
                    <span className="font-medium"> / {currentPath}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {currentPath && (
                  <Button variant="outline" onClick={goUp} className="w-full">
                    ⬅️ Go Up
                  </Button>
                )}

                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="new-file"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                  />
                  <Button
                    onClick={createFile}
                    disabled={loading || !newFileName}
                    size="icon"
                  >
                    +
                  </Button>
                </div>

                <ul role="list" className="space-y-1">
                  {entries.length === 0 && (
                    <li className="text-center text-sm text-muted-foreground py-4 italic">
                      Empty directory
                    </li>
                  )}
                  {entries.map((entry) => (
                    <li
                      key={entry.path}
                      className="flex items-center justify-between group rounded-md p-2 hover:bg-muted"
                    >
                      {entry.type === "directory" ? (
                        <button
                          onClick={() => navigateToDir(entry.path)}
                          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 truncate"
                        >
                          📁 {entry.name}
                        </button>
                      ) : (
                        <button
                          onClick={() => loadFile(entry.path)}
                          className={`flex items-center gap-2 text-sm truncate flex-1 text-left ${
                            selectedFile === entry.path
                              ? "font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          📄 {entry.name}
                        </button>
                      )}

                      {entry.type === "file" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFile(entry.path);
                          }}
                          className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Editor */}
          <div className="lg:col-span-3">
            <Card>
              {selectedFile ? (
                <CardContent className="p-6">
                  <div className="flex items-center justify-between border-b pb-4 mb-6">
                    <h3 className="text-lg font-semibold truncate max-w-lg">
                      Editing: {selectedFile}
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={duplicateFile}
                        disabled={loading}
                      >
                        Duplicate
                      </Button>
                      <Button onClick={saveFile} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>

                  {message && (
                    <div
                      className={`mb-6 rounded-md p-4 text-sm ${
                        message.includes("✅")
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {message}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Fields</h4>
                      <Button
                        variant="link"
                        onClick={addField}
                        className="text-sm"
                      >
                        + Add Field
                      </Button>
                    </div>

                    {Object.keys(fields).length === 0 ? (
                      <div className="text-center rounded-lg border-2 border-dashed p-12">
                        <span className="mt-2 block text-sm font-semibold">
                          No fields defined
                        </span>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Get started by adding a custom field or the main
                          content body.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(fields).map(([key, field]) => (
                          <Card key={key}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-4">
                                <Label
                                  htmlFor={key}
                                  className="text-sm font-bold flex items-center gap-2"
                                >
                                  {key}
                                  <Badge variant="secondary">
                                    {field.type}
                                  </Badge>
                                </Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeField(key)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  Remove
                                </Button>
                              </div>
                              {renderField(key, field)}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              ) : (
                <CardContent className="text-center py-24">
                  <div className="text-5xl mb-4">👈</div>
                  <h3 className="mt-2 text-sm font-semibold">
                    No file selected
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Select a file from the sidebar or create a new one.
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
