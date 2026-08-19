const db = require("./src/config/db");

async function fixCdn() {
  try {
    console.log("Fixing property images in MySQL...");

    const propUpdates = [
      { id: 1, url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80" },
      { id: 2, url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80" },
      { id: 3, url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80" },
      { id: 4, url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80" },
      { id: 5, url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80" }
    ];

    for (const item of propUpdates) {
      await db.query(
        "UPDATE property_images SET cdn_url = ?, thumbnail_url = ? WHERE image_id = ? OR property_id = ?",
        [item.url, item.url, item.id, item.id]
      );
    }

    console.log("Fixing room images in MySQL...");
    const roomUpdates = [
      { id: 1, url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80" },
      { id: 2, url: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80" },
      { id: 3, url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80" },
      { id: 4, url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80" },
      { id: 5, url: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80" }
    ];

    for (const item of roomUpdates) {
      await db.query(
        "UPDATE room_images SET cdn_url = ?, thumbnail_url = ?, webp_url = ? WHERE room_image_id = ? OR room_id = ?",
        [item.url, item.url, item.url, item.id, item.id]
      );
    }

    // Replace any remaining cdn.konkantrip.com in all image tables
    await db.query("UPDATE property_images SET cdn_url = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', thumbnail_url = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80' WHERE cdn_url LIKE '%cdn.konkantrip.com%'");
    await db.query("UPDATE room_images SET cdn_url = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', thumbnail_url = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80' WHERE cdn_url LIKE '%cdn.konkantrip.com%'");

    const [pCheck] = await db.query("SELECT image_id, property_id, image_title, cdn_url FROM property_images");
    console.log("Updated property_images:", pCheck);

    const [rCheck] = await db.query("SELECT room_image_id, room_id, image_title, cdn_url FROM room_images");
    console.log("Updated room_images:", rCheck);

    console.log("CDN URLs fixed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error fixing CDN:", err);
    process.exit(1);
  }
}

fixCdn();
