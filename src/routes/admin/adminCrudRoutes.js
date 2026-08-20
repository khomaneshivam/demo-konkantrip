const express = require("express");
const router = express.Router();

const {
    getAllRecords,
    getRecordById,
    createRecord,
    updateRecord,
    deleteRecord
} = require("../../controllers/admin/adminDynamicCrud");

// Generically mapped routes parameterized by the table name
router.get("/:table", getAllRecords);
router.post("/:table", createRecord);

router.get("/:table/:id", getRecordById);
router.put("/:table/:id", updateRecord);
router.delete("/:table/:id", deleteRecord);

module.exports = router;
