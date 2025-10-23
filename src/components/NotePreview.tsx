import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import "katex/dist/katex.min.css";

export default function NotePreview({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-3xl leading-relaxed [&_hr]:my-6 [&_h2]:mt-8 [&_li]:my-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeSanitize]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}