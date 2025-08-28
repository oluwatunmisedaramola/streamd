// src/db/queries.js
function buildVideoSelect() {
  return `
    SELECT v.*, c.name as category, m.date as match_date, m.title as match_title,
           l.name as league, co.name as country
    FROM videos v
    JOIN categories c ON v.category_id = c.id
    JOIN matches m ON v.match_id = m.id
    JOIN leagues l ON m.league_id = l.id
    JOIN countries co ON l.country_id = co.id
  `;
}

export const queries = {
  getCategories: `
    SELECT id, name
    FROM categories
    ORDER BY name ASC
  `,

  getVideosByCategory: (sort = "DESC") => `
    ${buildVideoSelect()}
    WHERE c.name = ?
    ORDER BY m.date ${sort}
    LIMIT ? OFFSET ?
  `,

  getVideosByCategoryAndDate: (sort = "DESC") => `
    ${buildVideoSelect()}
    WHERE c.name = ?
      AND DATE(m.date) BETWEEN ? AND ?
    ORDER BY m.date ${sort}
    LIMIT ? OFFSET ?
  `,

  getVideosByDateRange: (hasCategory = false, sort = "DESC") => `
    ${buildVideoSelect()}
    WHERE DATE(m.date) BETWEEN ? AND ?
    ${hasCategory ? "AND c.name = ?" : ""}
    ORDER BY m.date ${sort}
    LIMIT ? OFFSET ?
  `,

  getVideoById: `
    ${buildVideoSelect()}
    WHERE v.id = ?
  `,

  getAllVideos: (sort = "DESC") => `
    ${buildVideoSelect()}
    ORDER BY m.date ${sort}
    LIMIT ? OFFSET ?
  `,

  getAllVideosByDate: (sort = "DESC") => `
    ${buildVideoSelect()}
    WHERE DATE(m.date) BETWEEN ? AND ?
    ORDER BY m.date ${sort}
    LIMIT ? OFFSET ?
  `
};
