const db = require("./src/config/db");

async function fixCdn() {
  try {
    console.log("Cleaning dummy image URLs from MySQL...");

    const [resP] = await db.query(
      "DELETE FROM property_images WHERE cdn_url LIKE ? OR cdn_url LIKE ?",
      ["%unsplash.com%", "%cdn.konkantrip.com%"]
    );
    const [resR] = await db.query(
      "DELETE FROM room_images WHERE cdn_url LIKE ? OR cdn_url LIKE ?",
      ["%unsplash.com%", "%cdn.konkantrip.com%"]
    );

    console.log("Removed dummy property_images:", resP.affectedRows);
    console.log("Removed dummy room_images:", resR.affectedRows);

    console.log("CDN images cleaned successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error fixing CDN:", err);
    process.exit(1);
  }
}

fixCdn();

