const db = require("../config/db");

/**
 * Execute a callback within an explicit MySQL transaction.
 * Automatically handles getConnection, beginTransaction, commit, rollback, and connection release.
 * Also supports mock DB executors for tests.
 * 
 * @param {Function} callback - async (connection) => { ... }
 * @param {object} [poolInstance=db] - Database pool instance
 * @returns {Promise<any>}
 */
const withTransaction = async (callback, poolInstance = db) => {
    // If the pool provides getConnection (MySQL Pool)
    if (typeof poolInstance.getConnection === "function") {
        const connection = await poolInstance.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Failed to rollback MySQL transaction:", rollbackError.message);
            }
            throw error;
        } finally {
            if (typeof connection.release === "function") {
                connection.release();
            }
        }
    }

    // Fallback for mocked DB environments in unit tests
    return await callback(poolInstance);
};

module.exports = {
    withTransaction
};