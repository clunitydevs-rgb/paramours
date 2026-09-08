export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  summary: string;
  content: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  author: string;
  status: string;
  publishedDate: string;
  modifiedDate: string;
  createdDate: string;
  isIndexable: boolean;
  isActive: boolean;
}

export interface GetBlogsResponse {
  oBlog: BlogPost[];
  message: string;
  ncoderror: number;
}

export interface GetBlogBySlugResponse {
  oBlog: BlogPost | null;
  message: string;
  ncoderror: number;
}

export const BLOG_API_URL = 'https://cl.api.blog.paramours.cl/api/v1/Blog';

export function isPublishedBlog(post: BlogPost | null | undefined): post is BlogPost {
  return !!post && post.status === 'V' && post.isActive === true
    && typeof post.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug);
}
