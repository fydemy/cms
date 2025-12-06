import { getMarkdownContent } from "@fydemy/cms";
import Link from "next/link";

export default async function HomePage() {
  let exampleContent = null;

  try {
    exampleContent = await getMarkdownContent("example.md");
  } catch (error) {
    // File might not exist yet
  }

  return (
    <div className="container">
      <div className="card">
        <h1>🚀 Simple CMS for Next.js</h1>
        <p style={{ marginTop: "1rem", marginBottom: "2rem" }}>
          A minimal, file-based CMS without database requirements.
        </p>

        {exampleContent ? (
          <div style={{ marginBottom: "2rem" }}>
            <h2>Example Content</h2>
            <div
              style={{
                background: "#f9f9f9",
                padding: "1rem",
                borderRadius: "4px",
                marginTop: "1rem",
              }}
            >
              <h3>{exampleContent.data.title}</h3>
              <p>{exampleContent.data.description}</p>
              <pre
                style={{
                  marginTop: "1rem",
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                }}
              >
                {exampleContent.content}
              </pre>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: "2rem" }}>
            <p>No content found. Visit the admin dashboard to create some!</p>
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/admin" className="btn btn-primary">
            Go to Admin Dashboard
          </Link>
          <Link href="/blog" className="btn btn-primary">
            View Blog Example
          </Link>
        </div>

        <div style={{ marginTop: "2rem", fontSize: "0.875rem", color: "#666" }}>
          <h3>Features:</h3>
          <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
            <li>File-based content storage (markdown)</li>
            <li>GitHub integration for production</li>
            <li>Simple authentication with env variables</li>
            <li>No database required</li>
            <li>TypeScript support</li>
            <li>Vercel-compatible</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
