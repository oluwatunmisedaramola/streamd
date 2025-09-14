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
      v.match_id,
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
      v.match_id,
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
          v.match_id,
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
          v.match_id, 
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
      v.match_id,
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
      v.match_id, 
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

  getRecentHighlights: (sort = "DESC") =>`
    SELECT 
     v.id, 
     v.title,
     v.match_id, 
     c.name AS category, 
     m.date AS match_date, 
     m.thumbnail,
     v.embed_code AS video_url, 
     l.name AS league,
     co.name AS country
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    JOIN leagues l ON m.league_id = l.id
    JOIN countries co ON l.country_id = co.id
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
      v.match_id,
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
// 📊 Match stats
getMatchStats: `
  SELECT
    (SELECT COUNT(*) FROM saved_matches sm WHERE sm.match_id = ? AND sm.deleted_at IS NULL) AS saved_count,
    (SELECT COUNT(*) FROM loved_matches lm WHERE lm.match_id = ? AND lm.deleted_at IS NULL) AS loved_count,
    (SELECT COUNT(*) FROM favorite_matches fm WHERE fm.match_id = ? AND fm.deleted_at IS NULL) AS favorite_count
`,

// 📊 Subscriber stats
getSubscriberStats: `
  SELECT
    (SELECT COUNT(*) FROM saved_matches sm WHERE sm.subscriber_id = ? AND sm.deleted_at IS NULL) AS saved_count,
    (SELECT COUNT(*) FROM loved_matches lm WHERE lm.subscriber_id = ? AND lm.deleted_at IS NULL) AS loved_count,
    (SELECT COUNT(*) FROM favorite_matches fm WHERE fm.subscriber_id = ? AND fm.deleted_at IS NULL) AS favorite_count
`,

// ⭐ Top favorited matches
getTopFavoritedMatches: `
  SELECT 
    m.id,
    v.match_id AS match_id,
    m.title,
    m.thumbnail,
    m.date AS match_date,
    v.embed_code AS video_url,
    c.name AS category,
    l.name AS league,
    co.name AS country,
    COUNT(fm.id) AS total
  FROM favorite_matches fm
  JOIN matches m ON fm.match_id = m.id
  JOIN videos v ON v.match_id = m.id
  JOIN categories c ON v.category_id = c.id
  JOIN leagues l ON m.league_id = l.id
  JOIN countries co ON l.country_id = co.id
  WHERE fm.deleted_at IS NULL
  GROUP BY m.id
  ORDER BY total DESC, m.date DESC
  LIMIT ?
`,

// ❤️ Top loved matches
getTopLovedMatches: `
  SELECT 
    m.id,
    v.match_id AS match_id,
    m.title,
    m.thumbnail,
    m.date AS match_date,
    v.embed_code AS video_url,
    c.name AS category,
    l.name AS league,
    co.name AS country,
    COUNT(lm.id) AS total
  FROM loved_matches lm
  JOIN matches m ON lm.match_id = m.id
  JOIN videos v ON v.match_id = m.id
  JOIN categories c ON v.category_id = c.id
  JOIN leagues l ON m.league_id = l.id
  JOIN countries co ON l.country_id = co.id
  WHERE lm.deleted_at IS NULL
  GROUP BY m.id
  ORDER BY total DESC, m.date DESC
  LIMIT ?
`,

// 💾 Top saved matches
getTopSavedMatches: `
  SELECT 
    m.id,
    v.match_id AS match_id,
    m.title,
    m.thumbnail,
    m.date AS match_date,
    v.embed_code AS video_url,
    c.name AS category,
    l.name AS league,
    co.name AS country,
    COUNT(sm.id) AS total
  FROM saved_matches sm
  JOIN matches m ON sm.match_id = m.id
  JOIN videos v ON v.match_id = m.id
  JOIN categories c ON v.category_id = c.id
  JOIN leagues l ON m.league_id = l.id
  JOIN countries co ON l.country_id = co.id
  WHERE sm.deleted_at IS NULL
  GROUP BY m.id
  ORDER BY total DESC, m.date DESC
  LIMIT ?
`,

// 📊 Aggregate totals
getInteractionTotals: `
  SELECT 'favorite' AS type, COUNT(*) AS total FROM favorite_matches WHERE deleted_at IS NULL
  UNION ALL
  SELECT 'loved' AS type, COUNT(*) AS total FROM loved_matches WHERE deleted_at IS NULL
  UNION ALL
  SELECT 'saved' AS type, COUNT(*) AS total FROM saved_matches WHERE deleted_at IS NULL;
`,

getSubscriberByMsisdn: `
    SELECT * 
    FROM subscribers 
    WHERE msisdn=? 
    LIMIT 1
  `,

insertSubscriber: `
    INSERT INTO subscribers (msisdn, status, start_time, end_time, amount) 
    VALUES (?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), ?)
  `,

insertSubscriberGeneric: `
  INSERT INTO subscribers (msisdn, status, start_time, end_time, amount) 
  VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), ?)
`,

updateSubscriber: `
    UPDATE subscribers 
    SET status='active', 
        start_time=NOW(), 
        end_time=DATE_ADD(NOW(), INTERVAL 1 DAY), 
        amount=?, 
        updated_at=NOW()
    WHERE msisdn=?
  `,

getSubscriptionLinkByCarrier: `
    SELECT link 
    FROM subscription_links sl 
    JOIN carriers c ON sl.carrier_id = c.id
    WHERE c.name=? 
    LIMIT 1
  `,

createSession: `
    INSERT INTO sessions (subscriber_id, token, expires_at) 
    VALUES (?, ?, ?)
  `,

getSessionWithSubscriber: `
    SELECT 
      s.token, 
      s.expires_at, 
      sub.* 
    FROM sessions s 
    JOIN subscribers sub ON s.subscriber_id=sub.id 
    WHERE s.token=? 
    LIMIT 1
  `,
 
  /* -------------------------
     FILTER OPTIONS QUERIES
  --------------------------*/

  getTeamsByName: `
    SELECT id, name 
    FROM teams 
    WHERE name LIKE ? 
    ORDER BY name ASC 
    LIMIT ? OFFSET ?
  `,

  getLeaguesByName: `
    SELECT id, name 
    FROM leagues 
    WHERE name LIKE ? 
    ORDER BY name ASC 
    LIMIT ? OFFSET ?
  `,

  // ✅ UPDATED: using countries instead of non-existent locations
  getLocationsByName: `
    SELECT id, name 
    FROM countries
    WHERE name LIKE ? 
    ORDER BY name ASC 
    LIMIT ? OFFSET ?
  `,

  /* -------------------------
     MAIN SEARCH QUERY BUILDER
  --------------------------*/
  buildSearchQuery: (filters) => {
    let sql = `
      SELECT v.id AS video_id,
             v.title AS video_title,
             m.title AS match_title,
             c.name AS category,
             l.name AS league,
             co.name AS country,
             GROUP_CONCAT(DISTINCT t.name) AS teams,
             m.date,
             COUNT(*) OVER() as total_count
      FROM videos v
      JOIN matches m ON v.match_id = m.id
      JOIN categories c ON v.category_id = c.id
      JOIN leagues l ON m.league_id = l.id
      JOIN countries co ON l.country_id = co.id
      JOIN match_teams mt ON m.id = mt.match_id
      JOIN teams t ON mt.team_id = t.id
      WHERE 1=1
    `;

    const params = [];

    // full-text search
    if (filters.q) {
      sql += `
        AND (
          MATCH(v.title) AGAINST(? IN NATURAL LANGUAGE MODE)
          OR MATCH(m.title) AGAINST(? IN NATURAL LANGUAGE MODE)
          OR t.name LIKE ?
        )
      `;
      params.push(filters.q, filters.q, `%${filters.q}%`);
    }

    // league
    if (filters.league?.length) {
      sql += ` AND l.id IN (${filters.league.map(() => "?").join(",")})`;
      params.push(...filters.league);
    }

    // team
    if (filters.team?.length) {
      sql += ` AND t.id IN (${filters.team.map(() => "?").join(",")})`;
      params.push(...filters.team);
    }

    // category
    if (filters.category?.length) {
      sql += ` AND c.name IN (${filters.category.map(() => "?").join(",")})`;
      params.push(...filters.category);
    }

    // ✅ UPDATED: location mapped to countries
    if (filters.location?.length) {
      sql += ` AND co.id IN (${filters.location.map(() => "?").join(",")})`;
      params.push(...filters.location);
    }

    // date
    if (filters.date) {
      sql += ` AND DATE(m.date) = ?`;
      params.push(filters.date);
    }

    // match status
    if (filters.match_status) {
      if (filters.match_status === "upcoming") sql += ` AND m.date > NOW()`;
      if (filters.match_status === "finished") sql += ` AND m.date < NOW()`;
      if (filters.match_status === "live") sql += ` AND m.date BETWEEN DATE_SUB(NOW(), INTERVAL 2 HOUR) AND NOW()`;
    }

    sql += `
      GROUP BY v.id
      ORDER BY m.date DESC
      LIMIT ? OFFSET ?
    `;
    params.push(Number(filters.limit), Number(filters.offset));

    return { sql, params };
  }
}
