---
title: My First Blog Post
date: "2025-12-06T05:17:05.410Z"
author: Nathan
description: Learn how the dynamic blog system automatically detects and displays custom fields from markdown frontmatter without requiring static type definitions.
category: Tutorial
tags: [cms, nextjs, markdown]
featured: true
---

# My First Blog Post

This is an example blog post with **custom fields** in the frontmatter!

The dynamic blog system can automatically detect and display:

- Standard fields like `title`, `date`, and `author`
- Custom fields like `category`, `tags`, and `featured`

All without requiring static type definitions! 🎉

## How it works

1. Create a markdown file in `public/content/blog/`
2. Add any frontmatter fields you want
3. Use `getCollectionItems("blog")` to fetch all posts
4. Access fields via `post.data.yourField`

Pretty neat, right?
