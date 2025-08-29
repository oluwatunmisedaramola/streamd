export const queries = {
  // -------------------
  // Categories
  // -------------------
  getAllCategories: `
    SELECT id, name, description 
    FROM categories 
    ORDER BY name ASC
  `,

  // -------------------
  // Videos by Category
  // -------------------
  countVideosByCategory: `
    SELECT COUNT(*) AS total 
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    WHERE c.name = ?
  `,

  // 🔥 UPDATED: added v.thumbnail
  getVideosByCategory: (sort = "DESC") => `
    SELECT v.id, v.title, v.description, v.url, v.published_at, v.thumbnail, c.name as category
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    WHERE c.name = ?
    ORDER BY v.published_at ${sort}
    LIMIT ? OFFSET ?
  `,

  // -------------------
  // Videos by Category + Date
  // -------------------
  countVideosByCategoryAndDate: `
    SELECT COUNT(*) AS total 
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    WHERE c.name = ?
      AND DATE(v.published_at) BETWEEN ? AND ?
  `,

  // 🔥 UPDATED: added v.thumbnail
  getVideosByCategoryAndDate: (sort = "DESC") => `
    SELECT v.id, v.title, v.description, v.url, v.published_at, v.thumbnail, c.name as category
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    WHERE c.name = ?
      AND DATE(v.published_at) BETWEEN ? AND ?
    ORDER BY v.published_at ${sort}
    LIMIT ? OFFSET ?
  `,

  // -------------------
  // Videos by Date (with optional category filter)
  // -------------------
  countVideosByDate: `
    SELECT COUNT(*) AS total
    FROM videos
    WHERE DATE(published_at) BETWEEN ? AND ?
  `,

  countVideosByDateAndCategory: `
    SELECT COUNT(*) AS total
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    WHERE DATE(v.published_at) BETWEEN ? AND ?
      AND c.name = ?
  `,

  // 🔥 UPDATED: added v.thumbnail
  getVideosByDateRange: (withCategory = false, sort = "DESC") =>
    withCategory
      ? `
        SELECT v.id, v.title, v.description, v.url, v.published_at, v.thumbnail, c.name as category
        FROM videos v
        JOIN categories c ON v.category_id = c.id
        WHERE DATE(v.published_at) BETWEEN ? AND ?
          AND c.name = ?
        ORDER BY v.published_at ${sort}
        LIMIT ? OFFSET ?
      `
      : `
        SELECT v.id, v.title, v.description, v.url, v.published_at, v.thumbnail, c.name as category
        FROM videos v
        JOIN categories c ON v.category_id = c.id
        WHERE DATE(v.published_at) BETWEEN ? AND ?
        ORDER BY v.published_at ${sort}
        LIMIT ? OFFSET ?
      `,

  // -------------------
  // Single Video
  // -------------------
  // 🔥 UPDATED: added v.thumbnail
  getVideoById: `
    SELECT v.id, v.title, v.description, v.url, v.published_at, v.thumbnail, c.name as category
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    WHERE v.id = ?
  `,

  // -------------------
  // All Videos (any category)
  // -------------------
  countAllVideos: `
    SELECT COUNT(*) AS total
    FROM videos
  `,

  // 🔥 UPDATED: added v.thumbnail
  getAllVideos: (sort = "DESC") => `
    SELECT v.id, v.title, v.description, v.url, v.published_at, v.thumbnail, c.name as category
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    ORDER BY v.published_at ${sort}
    LIMIT ? OFFSET ?
  `,

  // -------------------
  // All Videos by Date
  // -------------------
  countAllVideosByDate: `
    SELECT COUNT(*) AS total
    FROM videos
    WHERE DATE(published_at) BETWEEN ? AND ?
  `,

  // 🔥 UPDATED: added v.thumbnail
  getAllVideosByDate: (sort = "DESC") => `
    SELECT v.id, v.title, v.description, v.url, v.published_at, v.thumbnail, c.name as category
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    WHERE DATE(v.published_at) BETWEEN ? AND ?
    ORDER BY v.published_at ${sort}
    LIMIT ? OFFSET ?
  `,
};
