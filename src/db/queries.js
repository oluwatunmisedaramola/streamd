// db/queries.js
export const queries = {
  // Count videos by category
  countVideosByCategory: `
    SELECT COUNT(*) as total
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    WHERE c.name = ?
  `,

  // Get videos by category
  getVideosByCategory: (sort = "DESC") => `
    SELECT v.id, v.title, m.thumbnail, c.name as category, m.date as match_date
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    WHERE c.name = ?
    ORDER BY m.date ${sort}
    LIMIT ? OFFSET ?
  `,

  // Count videos by category + date
  countVideosByCategoryAndDate: `
    SELECT COUNT(*) as total
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    WHERE c.name = ? AND m.date BETWEEN ? AND ?
  `,

  // Get videos by category + date
  getVideosByCategoryAndDate: (sort = "DESC") => `
    SELECT v.id, v.title, m.thumbnail, c.name as category, m.date as match_date
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    WHERE c.name = ? AND m.date BETWEEN ? AND ?
    ORDER BY m.date ${sort}
    LIMIT ? OFFSET ?
  `,

  // Count videos by date
  countVideosByDate: `
    SELECT COUNT(*) as total
    FROM videos v
    JOIN matches m ON v.match_id = m.id
    WHERE m.date BETWEEN ? AND ?
  `,

  // Count videos by date + category
  countVideosByDateAndCategory: `
    SELECT COUNT(*) as total
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    WHERE m.date BETWEEN ? AND ? AND c.name = ?
  `,

  // Get videos by date range (with/without category)
  getVideosByDateRange: (withCategory = false, sort = "DESC") => {
    if (withCategory) {
      return `
        SELECT v.id, v.title, m.thumbnail, c.name as category, m.date as match_date
        FROM videos v
        JOIN categories c ON v.category_id = c.id
        JOIN matches m ON v.match_id = m.id
        WHERE m.date BETWEEN ? AND ? AND c.name = ?
        ORDER BY m.date ${sort}
        LIMIT ? OFFSET ?
      `;
    } else {
      return `
        SELECT v.id, v.title, m.thumbnail, c.name as category, m.date as match_date
        FROM videos v
        JOIN categories c ON v.category_id = c.id
        JOIN matches m ON v.match_id = m.id
        WHERE m.date BETWEEN ? AND ?
        ORDER BY m.date ${sort}
        LIMIT ? OFFSET ?
      `;
    }
  },

  // Count all videos
  countAllVideos: `
    SELECT COUNT(*) as total
    FROM videos
  `,

  // Get all videos
  getAllVideos: (sort = "DESC") => `
    SELECT v.id, v.title, m.thumbnail, c.name as category, m.date as match_date
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    ORDER BY m.date ${sort}
    LIMIT ? OFFSET ?
  `,

  // Get video by ID
  getVideoById: `
    SELECT v.id, v.title, m.thumbnail, c.name as category, m.date as match_date
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    WHERE v.id = ?
  `,
};
