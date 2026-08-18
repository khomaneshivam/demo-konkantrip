const db = require("../../config/db");
const tableConfig = require("../../utils/tableConfig");

// Helper to validate table access
const validateTable = (tableName) => {
    const config = tableConfig[tableName];
    if (!config) {
        throw new Error(`Table '${tableName}' is not supported for dynamic CRUD operations`);
    }
    if (config.isComposite) {
        throw new Error(`Table '${tableName}' has a composite primary key and is not supported by single-ID dynamic routes.`);
    }
    return config;
};

const getAllRecords = async (req, res) => {
    try {
        const { table } = req.params;
        const config = validateTable(table);

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const offset = (page - 1) * limit;

        const countQuery = `SELECT COUNT(*) AS total FROM ??`;
        const [countResult] = await db.query(countQuery, [table]);
        const total = countResult[0]?.total || 0;

        const dataQuery = `SELECT * FROM ?? ORDER BY ?? DESC LIMIT ? OFFSET ?`;
        // usually we can order by the primary key descending
        const [rows] = await db.query(dataQuery, [table, config.pk, limit, offset]);

        return res.status(200).json({
            success: true,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error(`Admin CRUD getAllRecords Error [${req.params.table}]:`, error.message);
        return res.status(error.message.includes('not supported') ? 403 : 500).json({ success: false, message: error.message || "Internal server error" });
    }
};

const getRecordById = async (req, res) => {
    try {
        const { table, id } = req.params;
        const config = validateTable(table);

        const [rows] = await db.query(`SELECT * FROM ?? WHERE ?? = ? LIMIT 1`, [table, config.pk, id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Record not found" });
        }
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(`Admin CRUD getRecordById Error [${req.params.table}]:`, error.message);
        return res.status(error.message.includes('not supported') ? 403 : 500).json({ success: false, message: error.message || "Internal server error" });
    }
};

const createRecord = async (req, res) => {
    try {
        const { table } = req.params;
        validateTable(table); // we validate but we don't strictly need the PK config for insert unless returning it

        // We assume req.body contains column pairs that map perfectly to the table schema
        // Also it is up to the admin client to not send un-insertable fields
        const payload = req.body;

        // Quick protection: dont allow insert if body is empty
        if (!payload || Object.keys(payload).length === 0) {
            return res.status(400).json({ success: false, message: "Empty payload provided" });
        }

        const [result] = await db.query(`INSERT INTO ?? SET ?`, [table, payload]);

        return res.status(201).json({
            success: true,
            message: "Record created successfully",
            data: { insertId: result.insertId }
        });
    } catch (error) {
        console.error(`Admin CRUD createRecord Error [${req.params.table}]:`, error.message);
        return res.status(error.message.includes('not supported') ? 403 : 500).json({ success: false, message: error.message || "Internal server error" });
    }
};

const updateRecord = async (req, res) => {
    try {
        const { table, id } = req.params;
        const config = validateTable(table);
        const payload = req.body;

        if (!payload || Object.keys(payload).length === 0) {
            return res.status(400).json({ success: false, message: "Empty payload provided" });
        }

        // Prevent updating the primary key even if sent
        const updatePayload = { ...payload };
        delete updatePayload[config.pk];

        const [result] = await db.query(`UPDATE ?? SET ? WHERE ?? = ?`, [table, updatePayload, config.pk, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Record not found or no changes made" });
        }

        return res.status(200).json({ success: true, message: "Record updated successfully" });
    } catch (error) {
        console.error(`Admin CRUD updateRecord Error [${req.params.table}]:`, error.message);
        return res.status(error.message.includes('not supported') ? 403 : 500).json({ success: false, message: error.message || "Internal server error" });
    }
};

const deleteRecord = async (req, res) => {
    try {
        const { table, id } = req.params;
        const config = validateTable(table);

        // Optional: Check if table has delete_status before doing hard delete? 
        // For a generic generic approach, we'll try HARD DELETE first. 
        // In a fully featured version, you can check `delete_status` column existence dynamically.

        const [result] = await db.query(`DELETE FROM ?? WHERE ?? = ?`, [table, config.pk, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Record not found" });
        }

        return res.status(200).json({ success: true, message: "Record deleted successfully" });
    } catch (error) {
        console.error(`Admin CRUD deleteRecord Error [${req.params.table}]:`, error.message);

        // Foreign key constraint failure handle gracefully
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ success: false, message: "Cannot delete record because it is referenced by other records." });
        }

        return res.status(error.message.includes('not supported') ? 403 : 500).json({ success: false, message: error.message || "Internal server error" });
    }
};

module.exports = {
    getAllRecords,
    getRecordById,
    createRecord,
    updateRecord,
    deleteRecord
};
