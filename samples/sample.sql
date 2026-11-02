-- Find active projects with recent activity.
WITH recent_events AS (
    SELECT project_id, COUNT(*) AS event_count, MAX(created_at) AS last_seen
    FROM events
    WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
    GROUP BY project_id
)
SELECT
    p.id,
    p.name,
    COALESCE(e.event_count, 0) AS event_count,
    CASE
        WHEN e.last_seen IS NULL THEN 'No activity'
        ELSE 'Active'
    END AS status
FROM projects AS p
LEFT JOIN recent_events AS e ON e.project_id = p.id
WHERE p.archived = FALSE
ORDER BY event_count DESC, p.name ASC
LIMIT 20;


-- Write operations share the same structural accents.
INSERT INTO projects (name, archived)
VALUES ('eenei', FALSE)
RETURNING id;

UPDATE projects SET archived = TRUE WHERE id = 42;
DELETE FROM projects WHERE archived = TRUE AND name LIKE 'Draft%';
