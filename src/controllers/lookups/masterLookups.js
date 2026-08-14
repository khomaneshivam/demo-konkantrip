const db = require("../../config/db");

/**
 * Generic helper for simple lookup table CRUD
 */
const createLookupController = (tableName, primaryKey, uniqueNameField = "name", options = {}) => {
    const hasActive = options.hasActiveField !== false;
    const activeCol = options.activeColumn || options.activeField || "is_active";

    return {
        getAll: async (req, res) => {
            try {
                let query = `SELECT * FROM ${tableName}`;
                const conditions = [];
                const params = [];

                if (hasActive) {
                    const includeInactive = req.query.include_inactive === "true" || req.query.all === "true";
                    if (!includeInactive) {
                        conditions.push(`${activeCol} = TRUE`);
                    }
                }

                if (conditions.length > 0) {
                    query += ` WHERE ${conditions.join(" AND ")}`;
                }

                if (options.orderBy) {
                    query += ` ORDER BY ${options.orderBy}`;
                } else if (options.hasDisplayOrder) {
                    query += " ORDER BY display_order ASC";
                }

                const [rows] = await db.query(query, params);
                return res.status(200).json({ success: true, data: rows });
            } catch (error) {
                console.error(`Error fetching ${tableName}:`, error);
                return res.status(500).json({ success: false, message: `Failed to fetch ${tableName}` });
            }
        },

        getById: async (req, res) => {
            try {
                const id = req.params.id;
                const activeClause = hasActive ? ` AND ${activeCol} = TRUE` : "";
                const [rows] = await db.query(`SELECT * FROM ${tableName} WHERE ${primaryKey} = ?${activeClause} LIMIT 1`, [id]);
                if (rows.length === 0) {
                    return res.status(404).json({ success: false, message: `${tableName} item not found` });
                }
                return res.status(200).json({ success: true, data: rows[0] });
            } catch (error) {
                console.error(`Error fetching ${tableName} item:`, error);
                return res.status(500).json({ success: false, message: `Failed to fetch ${tableName} item` });
            }
        },

        create: async (req, res) => {
            try {
                const body = req.body;
                if (!body || Object.keys(body).length === 0) {
                    return res.status(400).json({ success: false, message: "Payload is required" });
                }

                // Exclude PK if provided
                delete body[primaryKey];
                const fields = Object.keys(body);
                const values = Object.values(body);
                const placeholders = fields.map(() => "?").join(", ");

                const query = `INSERT INTO ${tableName} (${fields.join(", ")}) VALUES (${placeholders})`;
                const [result] = await db.query(query, values);

                const activeClause = hasActive ? ` AND ${activeCol} = TRUE` : "";
                const [created] = await db.query(`SELECT * FROM ${tableName} WHERE ${primaryKey} = ?${activeClause} LIMIT 1`, [result.insertId]);
                return res.status(201).json({ success: true, message: "Created successfully", data: created[0] });
            } catch (error) {
                console.error(`Error creating ${tableName}:`, error);
                return res.status(500).json({ success: false, message: error.sqlMessage || `Failed to create ${tableName}` });
            }
        },

        update: async (req, res) => {
            try {
                const id = req.params.id;
                const body = req.body;
                delete body[primaryKey];

                const fields = Object.keys(body);
                if (fields.length === 0) {
                    return res.status(400).json({ success: false, message: "No fields to update" });
                }

                const setClauses = fields.map(f => `${f} = ?`).join(", ");
                const values = [...Object.values(body), id];
                const activeClause = hasActive ? ` AND ${activeCol} = TRUE` : "";

                const [result] = await db.query(`UPDATE ${tableName} SET ${setClauses} WHERE ${primaryKey} = ?${activeClause}`, values);
                if (result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: `${tableName} item not found` });
                }

                const [updated] = await db.query(`SELECT * FROM ${tableName} WHERE ${primaryKey} = ?${activeClause} LIMIT 1`, [id]);
                return res.status(200).json({ success: true, message: "Updated successfully", data: updated[0] });
            } catch (error) {
                console.error(`Error updating ${tableName}:`, error);
                return res.status(500).json({ success: false, message: error.sqlMessage || `Failed to update ${tableName}` });
            }
        },

        delete: async (req, res) => {
            try {
                const id = req.params.id;
                let result;
                if (hasActive) {
                    [result] = await db.query(`UPDATE ${tableName} SET ${activeCol} = FALSE WHERE ${primaryKey} = ? AND ${activeCol} = TRUE`, [id]);
                } else {
                    [result] = await db.query(`DELETE FROM ${tableName} WHERE ${primaryKey} = ?`, [id]);
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: `${tableName} item not found` });
                }
                return res.status(200).json({ success: true, message: "Deleted successfully" });
            } catch (error) {
                console.error(`Error deleting from ${tableName}:`, error);
                return res.status(500).json({ success: false, message: error.sqlMessage || `Failed to delete from ${tableName}` });
            }
        }
    };
};

module.exports = {
    languagesController: createLookupController("languages", "language_id", "language_name", { hasDisplayOrder: true, activeColumn: "is_active" }),
    documentTypesController: createLookupController("document_types", "document_type_id", "document_name", { hasDisplayOrder: true, activeColumn: "is_active" }),
    nearbyPlaceTypesController: createLookupController("nearby_place_types", "nearby_place_type_id", "place_type_name", { hasDisplayOrder: true, activeColumn: "is_active" }),
    houseRuleCategoriesController: createLookupController("property_house_rule_categories", "rule_category_id", "category_name", { hasDisplayOrder: true, activeColumn: "is_active" }),
    tagsController: createLookupController("tags", "tag_id", "tag_name", { hasDisplayOrder: true, activeColumn: "status" }),
    propertyImageTypesController: createLookupController("property_image_types", "image_type_id", "image_type_name", { hasDisplayOrder: true, activeColumn: "status" }),
    contactTypesController: createLookupController("contact_types", "contact_type_id", "contact_type_name", { hasDisplayOrder: true, activeColumn: "status" }),
    certificationTypesController: createLookupController("certification_types", "certification_type_id", "certification_name", { hasDisplayOrder: true, activeColumn: "is_active" }),
    mealPlansController: createLookupController("meal_plans", "meal_plan_id", "meal_plan_name", { hasDisplayOrder: true, activeColumn: "is_active" })
};
