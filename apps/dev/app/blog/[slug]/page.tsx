import { getCollectionItem, getCollectionItems } from "@fydemy/cms";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface BlogPost {
  title: string;
  date: string;
  author?: string;
  description?: string;
  [key: string]: any;
}

// Generate metadata dynamically from blog post frontmatter
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getCollectionItem<BlogPost>("blog", params.slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.data.title || "Untitled Post",
    description: post.data.description || post.content.substring(0, 160),
    authors: post.data.author ? [{ name: post.data.author }] : undefined,
    openGraph: {
      title: post.data.title || "Untitled Post",
      description: post.data.description || post.content.substring(0, 160),
      type: "article",
      publishedTime: post.data.date,
    },
  };
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  const posts = await getCollectionItems("blog");
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  // Fetch the specific blog post
  const post = await getCollectionItem<BlogPost>("blog", params.slug);

  if (!post) {
    notFound();
  }

  const formattedDate = post.data.date
    ? new Date(post.data.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown date";

  return (
    <div className="container">
      <div className="card">
        {/* Post Header */}
        <article>
          <header style={{ marginBottom: "2rem" }}>
            <h1 style={{ marginBottom: "0.5rem" }}>
              {post.data.title || "Untitled"}
            </h1>
            <div style={{ fontSize: "0.875rem", color: "#666" }}>
              📅 {formattedDate}
              {post.data.author && <span> • ✍️ {post.data.author}</span>}
            </div>
          </header>

          {/* Post Content */}
          <div
            style={{
              lineHeight: 1.8,
              fontSize: "1rem",
              whiteSpace: "pre-wrap",
              marginBottom: "2rem",
            }}
          >
            {post.content}
          </div>

          {/* Frontmatter Metadata */}
          <details
            style={{
              marginTop: "2rem",
              padding: "1rem",
              background: "#f9f9f9",
              borderRadius: "8px",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: "bold",
                color: "#333",
              }}
            >
              📋 View Post Metadata (Frontmatter)
            </summary>
            <div style={{ marginTop: "1rem" }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#666",
                  marginBottom: "0.5rem",
                }}
              >
                All fields from the markdown frontmatter are available
                dynamically:
              </p>
              <pre
                style={{
                  padding: "1rem",
                  background: "#fff",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  overflow: "auto",
                  border: "1px solid #e0e0e0",
                }}
              >
                {JSON.stringify(post.data, null, 2)}
              </pre>
            </div>
          </details>
        </article>

        {/* Navigation */}
        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
          <Link href="/blog" className="btn btn-primary">
            ← Back to Blog
          </Link>
          <Link href="/" className="btn btn-primary">
            Home
          </Link>
        </div>

        {/* Example: Accessing custom fields */}
        {Object.keys(post.data).filter(
          (key) => !["title", "date", "author"].includes(key)
        ).length > 0 && (
          <div
            style={{
              marginTop: "2rem",
              padding: "1rem",
              background: "#e3f2fd",
              borderRadius: "8px",
              fontSize: "0.875rem",
            }}
          >
            <strong>💡 Custom Fields Found:</strong>
            <ul style={{ marginTop: "0.5rem", marginBottom: 0 }}>
              {Object.keys(post.data)
                .filter((key) => !["title", "date", "author"].includes(key))
                .map((key) => (
                  <li key={key}>
                    <code>{key}</code>: {JSON.stringify(post.data[key])}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
