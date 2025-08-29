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
    SELECT 
      v.id, 
      v.title, 
      m.thumbnail, 
      c.name as category, 
      m.date as match_date,
      l.name as league,          /* NEW */
      co.name as country,        /* NEW */
      m.matchview_url as video_url  /* NEW */
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    JOIN leagues l ON m.league_id = l.id       /* NEW */
    JOIN countries co ON l.country_id = co.id  /* NEW */
    WHERE c.name = ?
    ORDER BY m.date ${sort}
    LIMIT LEAST(?, 100) OFFSET ?    /* UPDATED: impose max 100 */
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
    SELECT 
      v.id, 
      v.title, 
      m.thumbnail, 
      c.name as category, 
      m.date as match_date,
      l.name as league,          /* NEW */
      co.name as country,        /* NEW */
      m.matchview_url as video_url  /* NEW */
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    JOIN leagues l ON m.league_id = l.id       /* NEW */
    JOIN countries co ON l.country_id = co.id  /* NEW */
    WHERE c.name = ? AND m.date BETWEEN ? AND ?
    ORDER BY m.date ${sort}
    LIMIT LEAST(?, 100) OFFSET ?    /* UPDATED: impose max 100 */
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
        SELECT 
          v.id, 
          v.title, 
          m.thumbnail, 
          c.name as category, 
          m.date as match_date,
          l.name as league,          /* NEW */
          co.name as country,        /* NEW */
          m.matchview_url as video_url  /* NEW */
        FROM videos v
        JOIN categories c ON v.category_id = c.id
        JOIN matches m ON v.match_id = m.id
        JOIN leagues l ON m.league_id = l.id       /* NEW */
        JOIN countries co ON l.country_id = co.id  /* NEW */
        WHERE m.date BETWEEN ? AND ? AND c.name = ?
        ORDER BY m.date ${sort}
        LIMIT LEAST(?, 100) OFFSET ?    /* UPDATED: impose max 100 */
      `;
    } else {
      return `
        SELECT 
          v.id, 
          v.title, 
          m.thumbnail, 
          c.name as category, 
          m.date as match_date,
          l.name as league,          /* NEW */
          co.name as country,        /* NEW */
          m.matchview_url as video_url  /* NEW */
        FROM videos v
        JOIN categories c ON v.category_id = c.id
        JOIN matches m ON v.match_id = m.id
        JOIN leagues l ON m.league_id = l.id       /* NEW */
        JOIN countries co ON l.country_id = co.id  /* NEW */
        WHERE m.date BETWEEN ? AND ?
        ORDER BY m.date ${sort}
        LIMIT LEAST(?, 100) OFFSET ?    /* UPDATED: impose max 100 */
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
    SELECT 
      v.id, 
      v.title, 
      m.thumbnail, 
      c.name as category, 
      m.date as match_date,
      l.name as league,          /* NEW */
      co.name as country,        /* NEW */
      m.matchview_url as video_url  /* NEW */
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    JOIN leagues l ON m.league_id = l.id       /* NEW */
    JOIN countries co ON l.country_id = co.id  /* NEW */
    ORDER BY m.date ${sort}
    LIMIT LEAST(?, 100) OFFSET ?    /* UPDATED: impose max 100 */
  `,

  // Get video by ID
  getVideoById: `
    SELECT 
      v.id, 
      v.title, 
      m.thumbnail, 
      c.name as category, 
      m.date as match_date,
      l.name as league,          /* NEW */
      co.name as country,        /* NEW */
      m.matchview_url as video_url  /* NEW */
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    JOIN leagues l ON m.league_id = l.id       /* NEW */
    JOIN countries co ON l.country_id = co.id  /* NEW */
    WHERE v.id = ?
  `,

  // Get all categories
  getCategories: `
    SELECT id, name
    FROM categories
    ORDER BY name ASC
  `,
};
