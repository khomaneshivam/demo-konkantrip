const tableConfig = {
    // Users
    property_owners: { pk: 'p_owner_id' },
    property_owner_login_logs: { pk: 'id' },
    admin_logs: { pk: 'id' },

    // Lookups & Master Tables
    languages: { pk: 'language_id' },
    document_types: { pk: 'document_type_id' },
    nearby_place_types: { pk: 'nearby_place_type_id' },
    property_house_rule_categories: { pk: 'rule_category_id' },
    tags: { pk: 'tag_id' },
    amenity_categories: { pk: 'amenity_category_id' },
    amenities: { pk: 'amenity_id' },
    property_image_types: { pk: 'image_type_id' },
    contact_types: { pk: 'contact_type_id' },
    certification_types: { pk: 'certification_type_id' },

    // Room Config
    bed_types: { pk: 'bed_type_id' },
    room_types: { pk: 'room_type_id' },
    room_status: { pk: 'room_status_id' },
    room_views: { pk: 'room_view_id' },
    room_image_types: { pk: 'room_image_type_id' },
    room_facility_categories: { pk: 'room_facility_category_id' },
    room_facilities: { pk: 'room_facility_id' },

    // Properties
    meal_plans: { pk: 'meal_plan_id' },
    properties: { pk: 'property_id' },
    property_locations: { pk: 'location_id' },
    property_contacts: { pk: 'contact_id' },
    property_images: { pk: 'image_id' },
    property_amenities: { pk: 'property_id', isComposite: true },
    property_highlights: { pk: 'highlight_id' },
    property_tags: { pk: 'property_id', isComposite: true },
    property_policies: { pk: 'policy_id' },
    property_house_rules: { pk: 'rule_category_id', isComposite: true },
    property_nearby_places: { pk: 'property_id', isComposite: true },
    property_statistics: { pk: 'property_id', isComposite: true },
    property_documents: { pk: 'document_id' },
    property_languages: { pk: 'property_id', isComposite: true },

    // Rooms
    rooms: { pk: 'room_id' },
    room_images: { pk: 'image_id' },
    room_beds: { pk: 'room_id', isComposite: true },
    room_amenities: { pk: 'room_id', isComposite: true },
    room_facilities_mapping: { pk: 'room_id', isComposite: true },

    // Inventory
    room_inventory: { pk: 'inventory_id' },
    inventory_calendar: { pk: 'calendar_id' },
    inventory_transactions: { pk: 'transaction_id' },
    room_blocks: { pk: 'block_id' },
    stop_sell: { pk: 'stop_sell_id' }
};

module.exports = tableConfig;
