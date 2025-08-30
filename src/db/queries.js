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
      m.matchview_url as video_url
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
      m.matchview_url as video_url
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
          m.matchview_url as video_url
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
          m.matchview_url as video_url
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
      m.matchview_url as video_url
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
      m.matchview_url as video_url
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

  // Get related videos by category (thumbnail comes from matches table)
   getRelatedVideos: `
  SELECT v.id, v.title, c.name AS category, m.date AS match_date, m.thumbnail
  FROM videos v
  JOIN categories c ON v.category_id = c.id
  JOIN matches m ON v.match_id = m.id
  WHERE v.category_id = (
    SELECT category_id FROM videos WHERE id = ?
  )
  AND v.id <> ?
  ORDER BY m.date DESC
  LIMIT ?
`,


  // Get top favorited matches
  getTopFavoritedMatches: `
    SELECT m.id as match_id, m.title, m.thumbnail, COUNT(f.id) as total_favorites
    FROM favorite_matches f
    JOIN matches m ON f.match_id = m.id
    GROUP BY m.id
    ORDER BY total_favorites DESC
    LIMIT ?
  `,

  // Get top loved matches
  getTopLovedMatches: `
    SELECT m.id as match_id, m.title, m.thumbnail, COUNT(l.id) as total_loves
    FROM loved_matches l
    JOIN matches m ON l.match_id = m.id
    WHERE l.deleted_at IS NULL
    GROUP BY m.id
    ORDER BY total_loves DESC
    LIMIT ?
  `,

  // Get top saved matches
  getTopSavedMatches: `
    SELECT m.id as match_id, m.title, m.thumbnail, COUNT(s.id) as total_saves
    FROM saved_matches s
    JOIN matches m ON s.match_id = m.id
    GROUP BY m.id
    ORDER BY total_saves DESC
    LIMIT ?
  `,
};
