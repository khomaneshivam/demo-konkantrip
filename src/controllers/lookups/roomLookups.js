const db = require("../../config/db");

const createLookupController = (tableName, primaryKey, options = {}) => {
    return {
        getAll: async (req, res) => {
            try {
                let query = `SELECT * FROM ${tableName}`;
                const conditions = [];
                const params = [];

                if (options.hasActiveField !== false) {
                    if (req.query.active_only === "true") {
                        conditions.push("is_active = TRUE");
                    }
                }

                if (conditions.length > 0) {
                    query += ` WHERE ${conditions.join(" AND ")}`;
                }

                if (options.hasDisplayOrder !== false) {
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
                const [rows] = await db.query(`SELECT * FROM ${tableName} WHERE ${primaryKey} = ? LIMIT 1`, [id]);
                if (rows.length === 0) {
                    return res.status(404).json({ success: false, message: `${tableName} item not found` });
                }
                return res.status(200).json({ success: true, data: rows[0] });
            } catch (error) {
                console.error(`Error fetching ${tableName}:`, error);
                return res.status(500).json({ success: false, message: `Failed to fetch ${tableName}` });
            }
        },

        create: async (req, res) => {
            try {
                const body = req.body;
                delete body[primaryKey];
                const fields = Object.keys(body);
                const values = Object.values(body);
                const placeholders = fields.map(() => "?").join(", ");

                const query = `INSERT INTO ${tableName} (${fields.join(", ")}) VALUES (${placeholders})`;
                const [result] = await db.query(query, values);

                const [created] = await db.query(`SELECT * FROM ${tableName} WHERE ${primaryKey} = ? LIMIT 1`, [result.insertId]);
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

                const [result] = await db.query(`UPDATE ${tableName} SET ${setClauses} WHERE ${primaryKey} = ?`, values);
                if (result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: `${tableName} item not found` });
                }

                const [updated] = await db.query(`SELECT * FROM ${tableName} WHERE ${primaryKey} = ? LIMIT 1`, [id]);
                return res.status(200).json({ success: true, message: "Updated successfully", data: updated[0] });
            } catch (error) {
                console.error(`Error updating ${tableName}:`, error);
                return res.status(500).json({ success: false, message: error.sqlMessage || `Failed to update ${tableName}` });
            }
        },

        delete: async (req, res) => {
            try {
                const id = req.params.id;
                const [result] = await db.query(`DELETE FROM ${tableName} WHERE ${primaryKey} = ?`, [id]);
                if (result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: `${tableName} item not found` });
                }
                return res.status(200).json({ success: true, message: "Deleted successfully" });
            } catch (error) {
                console.error(`Error deleting ${tableName}:`, error);
                return res.status(500).json({ success: false, message: error.sqlMessage || `Failed to delete from ${tableName}` });
            }
        }
    };
};

module.exports = {
    bedTypesController: createLookupController("bed_types", "bed_type_id"),
    roomTypesController: createLookupController("room_types", "room_type_id"),
    roomStatusController: createLookupController("room_status", "room_status_id"),
    roomViewsController: createLookupController("room_views", "room_view_id"),
    roomImageTypesController: createLookupController("room_image_types", "room_image_type_id"),
    roomFacilityCategoriesController: createLookupController("room_facility_categories", "room_facility_category_id"),
    roomFacilitiesController: createLookupController("room_facilities", "room_facility_id")
};
