import { getCollectionItems, CollectionItem } from "@fydemy/cms";
import Link from "next/link";
import { Metadata } from "next";

// Metadata for SEO
export const metadata: Metadata = {
  title: "Blog Posts",
  description:
    "Explore our collection of blog posts dynamically loaded from markdown files",
};

// Define an interface for blog post frontmatter
// This is optional - you can use Record<string, any> for fully dynamic types
interface BlogPost {
  title: string;
  date: string;
  author?: string;
  // Allow any other custom fields
  [key: string]: any;
}

export default async function BlogPage() {
  // Fetch all blog posts from public/content/blog folder
  const posts = await getCollectionItems<BlogPost>("blog");

  // Sort by date (newest first)
  const sortedPosts = posts.sort((a, b) => {
    const dateA = new Date(a.data.date || 0).getTime();
    const dateB = new Date(b.data.date || 0).getTime();
    return dateB - dateA;
  });

  return (
    <div className="container">
      <div className="card">
        <h1>📝 Blog Posts</h1>
        <p style={{ marginTop: "1rem", color: "#666" }}>
          Dynamically loaded from <code>public/content/blog</code> folder
        </p>

        <div style={{ marginTop: "2rem" }}>
          {sortedPosts.length === 0 ? (
            <p>No blog posts found. Create some in the admin dashboard!</p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {sortedPosts.map((post) => (
                <BlogPostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: "2rem" }}>
          <Link href="/" className="btn btn-primary">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Component to display a single blog post card
function BlogPostCard({ post }: { post: CollectionItem<BlogPost> }) {
  const formattedDate = post.data.date
    ? new Date(post.data.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown date";

  return (
    <div
      style={{
        background: "#f9f9f9",
        padding: "1.5rem",
        borderRadius: "8px",
        border: "1px solid #e0e0e0",
      }}
    >
      <h2 style={{ marginTop: 0 }}>
        <Link
          href={`/blog/${post.slug}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          {post.data.title || "Untitled"}
        </Link>
      </h2>

      <div
        style={{ fontSize: "0.875rem", color: "#666", marginBottom: "1rem" }}
      >
        📅 {formattedDate}
        {post.data.author && <span> • ✍️ {post.data.author}</span>}
      </div>

      {/* Show preview of content */}
      <p style={{ margin: 0, color: "#333" }}>
        {post.content.substring(0, 150)}
        {post.content.length > 150 && "..."}
      </p>

      <div style={{ marginTop: "1rem" }}>
        <Link href={`/blog/${post.slug}`} className="btn btn-primary">
          Read More →
        </Link>
      </div>

      {/* Display any custom fields dynamically */}
      {Object.keys(post.data).length > 0 && (
        <details style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
          <summary style={{ cursor: "pointer", color: "#666" }}>
            View all frontmatter fields
          </summary>
          <pre
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem",
              background: "#fff",
              borderRadius: "4px",
              fontSize: "0.75rem",
              overflow: "auto",
            }}
          >
            {JSON.stringify(post.data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
