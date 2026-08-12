const db = require("../../config/db");

// Amenity Categories
const getAmenityCategories = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM amenity_categories WHERE status = TRUE ORDER BY display_order ASC"
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching amenity categories:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch amenity categories" });
    }
};

const createAmenityCategory = async (req, res) => {
    try {
        const { category_name, category_icon, display_order = 1, status = true } = req.body;
        if (!category_name) {
            return res.status(400).json({ success: false, message: "category_name is required" });
        }

        const [result] = await db.query(
            "INSERT INTO amenity_categories (category_name, category_icon, display_order, status) VALUES (?, ?, ?, ?)",
            [category_name, category_icon || null, display_order, status]
        );

        const [created] = await db.query("SELECT * FROM amenity_categories WHERE amenity_category_id = ?", [result.insertId]);
        return res.status(201).json({ success: true, message: "Category created", data: created[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to create category" });
    }
};

const updateAmenityCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_name, category_icon, display_order, status } = req.body;

        const [result] = await db.query(
            `UPDATE amenity_categories 
             SET category_name = COALESCE(?, category_name),
                 category_icon = COALESCE(?, category_icon),
                 display_order = COALESCE(?, display_order),
                 status = COALESCE(?, status)
             WHERE amenity_category_id = ?`,
            [category_name, category_icon, display_order, status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const [updated] = await db.query("SELECT * FROM amenity_categories WHERE amenity_category_id = ?", [id]);
        return res.status(200).json({ success: true, message: "Category updated", data: updated[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update category" });
    }
};

const deleteAmenityCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query("DELETE FROM amenity_categories WHERE amenity_category_id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        return res.status(200).json({ success: true, message: "Category deleted" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to delete category" });
    }
};

// Amenities
const getAmenities = async (req, res) => {
    try {
        const { category_id, popular_only } = req.query;
        let query = `
            SELECT a.*, c.category_name 
            FROM amenities a
            INNER JOIN amenity_categories c ON c.amenity_category_id = a.amenity_category_id
            WHERE a.status = TRUE
        `;
        const params = [];

        if (category_id) {
            query += " AND a.amenity_category_id = ?";
            params.push(category_id);
        }

        if (popular_only === "true") {
            query += " AND a.is_popular = TRUE";
        }

        query += " ORDER BY c.display_order ASC, a.display_order ASC";

        const [rows] = await db.query(query, params);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching amenities:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch amenities" });
    }
};

const createAmenity = async (req, res) => {
    try {
        const { amenity_category_id, amenity_name, amenity_icon, amenity_description, display_order = 1, is_popular = false, status = true } = req.body;
        if (!amenity_category_id || !amenity_name) {
            return res.status(400).json({ success: false, message: "amenity_category_id and amenity_name are required" });
        }

        const [result] = await db.query(
            `INSERT INTO amenities (amenity_category_id, amenity_name, amenity_icon, amenity_description, display_order, is_popular, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [amenity_category_id, amenity_name, amenity_icon || null, amenity_description || null, display_order, is_popular, status]
        );

        const [created] = await db.query("SELECT * FROM amenities WHERE amenity_id = ?", [result.insertId]);
        return res.status(201).json({ success: true, message: "Amenity created", data: created[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to create amenity" });
    }
};

const updateAmenity = async (req, res) => {
    try {
        const { id } = req.params;
        const { amenity_category_id, amenity_name, amenity_icon, amenity_description, display_order, is_popular, status } = req.body;

        const [result] = await db.query(
            `UPDATE amenities 
             SET amenity_category_id = COALESCE(?, amenity_category_id),
                 amenity_name = COALESCE(?, amenity_name),
                 amenity_icon = COALESCE(?, amenity_icon),
                 amenity_description = COALESCE(?, amenity_description),
                 display_order = COALESCE(?, display_order),
                 is_popular = COALESCE(?, is_popular),
                 status = COALESCE(?, status)
             WHERE amenity_id = ?`,
            [amenity_category_id, amenity_name, amenity_icon, amenity_description, display_order, is_popular, status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Amenity not found" });
        }

        const [updated] = await db.query("SELECT * FROM amenities WHERE amenity_id = ?", [id]);
        return res.status(200).json({ success: true, message: "Amenity updated", data: updated[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update amenity" });
    }
};

const deleteAmenity = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query("DELETE FROM amenities WHERE amenity_id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Amenity not found" });
        }
        return res.status(200).json({ success: true, message: "Amenity deleted" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to delete amenity" });
    }
};

module.exports = {
    getAmenityCategories,
    createAmenityCategory,
    updateAmenityCategory,
    deleteAmenityCategory,
    getAmenities,
    createAmenity,
    updateAmenity,
    deleteAmenity
};
