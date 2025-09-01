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
      l.name as league,         
      co.name as country,       
      v.embed_code as video_url  -- ✅ updated from m.matchview_url
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    JOIN leagues l ON m.league_id = l.id
    JOIN countries co ON l.country_id = co.id
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
    SELECT 
      v.id, 
      v.title, 
      m.thumbnail, 
      c.name as category, 
      m.date as match_date,
      l.name as league,         
      co.name as country,       
      v.embed_code as video_url  -- ✅ updated from m.matchview_url
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    JOIN leagues l ON m.league_id = l.id
    JOIN countries co ON l.country_id = co.id
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

  // Get videos by date range
  getVideosByDateRange: (withCategory = false, sort = "DESC") => {
    if (withCategory) {
      return `
        SELECT 
          v.id, 
          v.title, 
          m.thumbnail, 
          c.name as category, 
          m.date as match_date,
          l.name as league,         
          co.name as country,       
          v.embed_code as video_url  -- ✅ updated from m.matchview_url
        FROM videos v
        JOIN categories c ON v.category_id = c.id
        JOIN matches m ON v.match_id = m.id
        JOIN leagues l ON m.league_id = l.id
        JOIN countries co ON l.country_id = co.id
        WHERE m.date BETWEEN ? AND ? AND c.name = ?
        ORDER BY m.date ${sort}
        LIMIT ? OFFSET ?
      `;
    } else {
      return `
        SELECT 
          v.id, 
          v.title, 
          m.thumbnail, 
          c.name as category, 
          m.date as match_date,
          l.name as league,         
          co.name as country,       
          v.embed_code as video_url  -- ✅ updated from m.matchview_url
        FROM videos v
        JOIN categories c ON v.category_id = c.id
        JOIN matches m ON v.match_id = m.id
        JOIN leagues l ON m.league_id = l.id
        JOIN countries co ON l.country_id = co.id
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
    SELECT 
      v.id, 
      v.title, 
      m.thumbnail, 
      c.name as category, 
      m.date as match_date,
      l.name as league,         
      co.name as country,       
      v.embed_code as video_url  -- ✅ updated from m.matchview_url
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    JOIN leagues l ON m.league_id = l.id
    JOIN countries co ON l.country_id = co.id
    ORDER BY m.date ${sort}
    LIMIT ? OFFSET ?
  `,

  // Get video by ID
  getVideoById: `
    SELECT 
      v.id, 
      v.title, 
      m.thumbnail, 
      c.name as category, 
      m.date as match_date,
      l.name as league,         
      co.name as country,       
      v.embed_code as video_url  -- ✅ updated from m.matchview_url
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    JOIN leagues l ON m.league_id = l.id
    JOIN countries co ON l.country_id = co.id
    WHERE v.id = ?
  `,

  // Get all categories
  getCategories: `
    SELECT id, name
    FROM categories
    ORDER BY name ASC
  `,

   getMatchStats: `
    SELECT
      (SELECT COUNT(*) FROM saved_matches sm WHERE sm.match_id = ?) AS saved_count,
      (SELECT COUNT(*) FROM loved_matches lm WHERE lm.match_id = ? AND lm.deleted_at IS NULL) AS loved_count,
      (SELECT COUNT(*) FROM favorite_matches fm WHERE fm.match_id = ?) AS favorite_count
  `,

  // 📊 Subscriber stats: count how many matches user has saved, loved, favorited
  getSubscriberStats: `
    SELECT
      (SELECT COUNT(*) FROM saved_matches sm WHERE sm.subscriber_id = ?) AS saved_count,
      (SELECT COUNT(*) FROM loved_matches lm WHERE lm.subscriber_id = ? AND lm.deleted_at IS NULL) AS loved_count,
      (SELECT COUNT(*) FROM favorite_matches fm WHERE fm.subscriber_id = ?) AS favorite_count
  `,

  getRecentHighlights: (sort = "DESC") =>`
    SELECT v.id, v.title, c.name AS category, m.date AS match_date, m.thumbnail
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    WHERE m.date >= DATE_SUB(NOW(), INTERVAL 3 DAY)
    ORDER BY m.date DESC
    LIMIT ? OFFSET ?
  `,

  countRecentHighlights: `
    SELECT COUNT(*) as total
    FROM videos v
    JOIN matches m ON v.match_id = m.id
    WHERE m.date >= DATE_SUB(NOW(), INTERVAL 3 DAY)
  `,

  getRelatedVideos: `
    SELECT 
      v.id,
      v.title,
      c.name AS category,
      m.date AS match_date,
      m.thumbnail,
      v.embed_code AS video_url,  -- ✅ updated from m.matchview_url
      l.name AS league,
      co.name AS country
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    JOIN leagues l ON m.league_id = l.id
    JOIN countries co ON l.country_id = co.id
    WHERE v.category_id = (
      SELECT category_id FROM videos WHERE id = ?
    )
    AND v.id <> ?
    ORDER BY m.date DESC
    LIMIT ?
  `,
}
