/* =============================================================================
   KONKANTRIP HOSPITALITY PLATFORM - MASTER CATALOG & LOOKUPS SEED SCRIPT
   =============================================================================
   This script populates all foundational master tables, system lookups, 
   predefined RBAC roles, granular permissions, and super-admin accounts.
   
   Database: konkantrip
   Context: Konkan Tourism & Hospitality (Hotels, Resorts, Beach Villas, Homestays)
   Execution: Safe & Idempotent (INSERT IGNORE)
   ============================================================================= */

USE konkantrip;

SET FOREIGN_KEY_CHECKS = 0;

/* =============================================================================
   SECTION 1: LANGUAGES (Regional & International Tourist Languages)
   ============================================================================= */
INSERT IGNORE INTO languages (
    language_id, language_uuid, language_name, native_name, iso_639_1, iso_639_2, language_code, text_direction, flag_icon, display_order, is_indian_language, is_active
) VALUES
(1, UUID(), 'English', 'English', 'en', 'eng', 'en-US', 'LTR', 'flags/en.svg', 1, 0, 1),
(2, UUID(), 'Marathi', 'मराठी', 'mr', 'mar', 'mr-IN', 'LTR', 'flags/mr.svg', 2, 1, 1),
(3, UUID(), 'Hindi', 'हिन्दी', 'hi', 'hin', 'hi-IN', 'LTR', 'flags/hi.svg', 3, 1, 1),
(4, UUID(), 'Gujarati', 'ગુજરાતી', 'gu', 'guj', 'gu-IN', 'LTR', 'flags/gu.svg', 4, 1, 1),
(5, UUID(), 'Kannada', 'ಕನ್ನಡ', 'kn', 'kan', 'kn-IN', 'LTR', 'flags/kn.svg', 5, 1, 1),
(6, UUID(), 'German', 'Deutsch', 'de', 'deu', 'de-DE', 'LTR', 'flags/de.svg', 6, 0, 1),
(7, UUID(), 'French', 'Français', 'fr', 'fra', 'fr-FR', 'LTR', 'flags/fr.svg', 7, 0, 1);


/* =============================================================================
   SECTION 3: DOCUMENT TYPES (Legal & Hospitality Compliance)
   ============================================================================= */
INSERT IGNORE INTO document_types (
    document_type_id, document_type_uuid, document_name, document_slug, document_category, description, accepted_file_types, max_file_size_mb, is_mandatory, requires_expiry, requires_verification, validity_period_days, display_order, is_active
) VALUES
(1, UUID(), 'Property Ownership Proof / 7/12 Extract', 'property-7-12-extract', 'Property', 'Official land ownership record from Maharashtra Revenue Department', '["pdf", "jpg", "png"]', 10, 1, 0, 1, NULL, 1, 1),
(2, UUID(), 'MTDC Tourism Registration Certificate', 'mtdc-tourism-registration', 'Government', 'Maharashtra Tourism Development Corporation official registration certificate', '["pdf"]', 10, 1, 1, 1, 365, 2, 1),
(3, UUID(), 'Fire Safety NOC', 'fire-safety-noc', 'Safety', 'No Objection Certificate issued by Local Fire Department', '["pdf"]', 5, 1, 1, 1, 365, 3, 1),
(4, UUID(), 'FSSAI Food Business License', 'fssai-license', 'License', 'Food Safety and Standards Authority of India commercial food license', '["pdf", "jpg"]', 5, 0, 1, 1, 730, 4, 1),
(5, UUID(), 'GST Registration Certificate', 'gst-certificate', 'Tax', 'Goods and Services Tax certificate for hospitality accommodations', '["pdf"]', 5, 1, 0, 1, NULL, 5, 1),
(6, UUID(), 'Local Gram Panchayat / Municipal NOC', 'gram-panchayat-noc', 'Government', 'NOC from local village authority or municipal council', '["pdf", "jpg"]', 5, 1, 0, 1, NULL, 6, 1),
(7, UUID(), 'Electricity Bill / Utility Proof', 'electricity-bill', 'Property', 'Recent commercial or domestic electricity bill for address verification', '["pdf", "jpg", "png"]', 5, 0, 0, 1, 90, 7, 1),
(8, UUID(), 'Police Verification Clearance', 'police-verification', 'Safety', 'Local police station verification certificate for guest accommodation', '["pdf"]', 5, 0, 1, 1, 365, 8, 1);


/* =============================================================================
   SECTION 4: NEARBY PLACE TYPES
   ============================================================================= */
INSERT IGNORE INTO nearby_place_types (
    nearby_place_type_id, nearby_place_type_uuid, place_type_name, place_type_slug, place_icon, marker_color, description, display_order, is_transport, is_tourist_place, is_essential_service, is_active
) VALUES
(1, UUID(), 'Beach', 'beach', 'icons/beach.svg', '#00A8FF', 'Sandy coastal beaches, water sports, and sunset points', 1, 0, 1, 0, 1),
(2, UUID(), 'Sea Fort / Heritage Monument', 'sea-fort-heritage', 'icons/fort.svg', '#E67E22', 'Historic sea forts, hill forts and cultural monuments (e.g. Sindhudurg, Murud)', 2, 0, 1, 0, 1),
(3, UUID(), 'Railway Station', 'railway-station', 'icons/train.svg', '#2ECC71', 'Konkan Railway and local rail transit stations', 3, 1, 0, 0, 1),
(4, UUID(), 'Temple / Pilgrim Site', 'temple-pilgrim-site', 'icons/temple.svg', '#F39C12', 'Ancient and prominent temples of coastal Maharashtra', 4, 0, 1, 0, 1),
(5, UUID(), 'Hospital / Emergency Clinic', 'hospital-clinic', 'icons/hospital.svg', '#E74C3C', '24/7 Emergency medical hospitals and primary health centers', 5, 0, 0, 1, 1),
(6, UUID(), 'Scuba Diving & Water Sports Center', 'water-sports-center', 'icons/scuba.svg', '#0984E3', 'Scuba diving, parasailing, jet ski, and snorkeling centers', 6, 0, 1, 0, 1),
(7, UUID(), 'Local Market / Fish Market', 'local-market', 'icons/market.svg', '#6C5CE7', 'Fresh seafood markets, Konkani spice and mango markets', 7, 0, 0, 1, 1),
(8, UUID(), 'Airport', 'airport', 'icons/plane.svg', '#00CEC9', 'Nearest domestic or international airports (e.g. Chipi Sindhudurg, Goa Mopa)', 8, 1, 0, 0, 1),
(9, UUID(), 'Waterfall / Nature Spot', 'waterfall-nature', 'icons/waterfall.svg', '#00B894', 'Seasonal waterfalls, mango orchards, and Western Ghats viewpoints', 9, 0, 1, 0, 1);


/* =============================================================================
   SECTION 5: PROPERTY HOUSE RULE CATEGORIES
   ============================================================================= */
INSERT IGNORE INTO property_house_rule_categories (
    rule_category_id, rule_category_uuid, category_name, category_icon, description, display_order, is_active
) VALUES
(1, UUID(), 'Check-in & Check-out', 'icons/clock.svg', 'Rules governing guest check-in, key handover, and checkout schedule', 1, 1),
(2, UUID(), 'Noise & Quiet Hours', 'icons/volume-mute.svg', 'Policies restricting loud music and late night disturbance', 2, 1),
(3, UUID(), 'Pets & Animals', 'icons/paw.svg', 'Guidelines on pet accommodation, leashing, and hygiene', 3, 1),
(4, UUID(), 'Smoking & Alcohol', 'icons/smoke-free.svg', 'Designated smoking areas and alcohol consumption policies', 4, 1),
(5, UUID(), 'Visitors & Celebrations', 'icons/users.svg', 'Guest visitor policies, bachelor parties, and private event guidelines', 5, 1),
(6, UUID(), 'Swimming Pool Usage', 'icons/pool-rules.svg', 'Pool timings, swimwear guidelines, and child safety rules', 6, 1),
(7, UUID(), 'Kitchen & Self-Cooking', 'icons/kitchen.svg', 'Self-cooking guidelines, kitchen usage fees, and cleanup rules', 7, 1);


/* =============================================================================
   SECTION 6: TAGS & SEARCH BADGES
   ============================================================================= */
INSERT IGNORE INTO tags (
    tag_id, tag_uuid, tag_name, tag_slug, tag_color, display_order, status
) VALUES
(1, UUID(), 'Beachfront', 'beachfront', '#0288D1', 1, 1),
(2, UUID(), 'Homestyle Konkani Food', 'homestyle-konkani-food', '#FB8C00', 2, 1),
(3, UUID(), 'Sea View', 'sea-view', '#00ACC1', 3, 1),
(4, UUID(), 'Pet Friendly', 'pet-friendly', '#43A047', 4, 1),
(5, UUID(), 'Family Friendly', 'family-friendly', '#8E24AA', 5, 1),
(6, UUID(), 'Couple Friendly', 'couple-friendly', '#E91E63', 6, 1),
(7, UUID(), 'Private Swimming Pool', 'private-swimming-pool', '#00BCD4', 7, 1),
(8, UUID(), 'Workation / Fast Wi-Fi', 'workation-fast-wifi', '#3F51B5', 8, 1),
(9, UUID(), 'Pure Vegetarian Kitchen', 'pure-vegetarian-kitchen', '#4CAF50', 9, 1),
(10, UUID(), 'Budget Homestay', 'budget-homestay', '#795548', 10, 1),
(11, UUID(), 'Luxury Villa', 'luxury-villa', '#D4AF37', 11, 1);


/* =============================================================================
   SECTION 7: AMENITY CATEGORIES & AMENITIES
   ============================================================================= */
INSERT IGNORE INTO amenity_categories (
    amenity_category_id, amenity_category_uuid, category_name, category_icon, display_order, status
) VALUES
(1, UUID(), 'General & Connectivity', 'icons/wifi.svg', 1, 1),
(2, UUID(), 'Outdoor & Leisure', 'icons/pool.svg', 2, 1),
(3, UUID(), 'Food & Dining', 'icons/dining.svg', 3, 1),
(4, UUID(), 'Safety & Security', 'icons/shield.svg', 4, 1),
(5, UUID(), 'Parking & Transportation', 'icons/car.svg', 5, 1),
(6, UUID(), 'Comfort & Convenience', 'icons/sparkles.svg', 6, 1);

INSERT IGNORE INTO amenities (
    amenity_id, amenity_uuid, amenity_category_id, amenity_name, amenity_icon, amenity_description, display_order, is_popular, status
) VALUES
(1, UUID(), 1, 'High-Speed Wi-Fi', 'amenities/wifi.svg', 'Complimentary fiber optic wireless internet across all rooms and public spaces', 1, 1, 1),
(2, UUID(), 1, '100% Power Backup / Generator', 'amenities/power.svg', 'Continuous 24x7 inverter and DG set power backup for uninterrupted electricity', 2, 1, 1),
(3, UUID(), 2, 'Swimming Pool', 'amenities/pool.svg', 'Clean swimming pool with dedicated shallow kids section', 3, 1, 1),
(4, UUID(), 2, 'Lush Coconut Grove & Lawn', 'amenities/lawn.svg', 'Spacious private garden, coconut orchard, and hammock relaxation area', 4, 1, 1),
(5, UUID(), 2, 'Bonfire & Campfire Setup', 'amenities/bonfire.svg', 'Nightly campfire setup in outdoor private lawn (chargeable on request)', 5, 0, 1),
(6, UUID(), 2, 'Barbecue (BBQ) Grill', 'amenities/bbq.svg', 'Outdoor charcoal barbecue grill and grilling skewers available', 6, 0, 1),
(7, UUID(), 3, 'Authentic Konkani Dining Kitchen', 'amenities/kitchen.svg', 'Freshly cooked authentic Malvani seafood, Surmai/Pomfret fry, and veg thalis', 7, 1, 1),
(8, UUID(), 3, 'Complimentary Breakfast', 'amenities/breakfast.svg', 'Traditional breakfast including Poha, Ghavane, Amboli, and Masala Chai', 8, 1, 1),
(9, UUID(), 4, '24x7 CCTV Surveillance', 'amenities/cctv.svg', 'Round-the-clock closed circuit surveillance across perimeter and public areas', 9, 1, 1),
(10, UUID(), 4, 'Doctor on Call & First Aid', 'amenities/medical.svg', 'Emergency first aid box and tie-up with local on-call physician', 10, 0, 1),
(11, UUID(), 5, 'Free Private Parking', 'amenities/parking.svg', 'Dedicated secure parking space on property for cars and tourist vans', 11, 1, 1),
(12, UUID(), 5, 'EV Charging Station', 'amenities/ev.svg', 'Electric vehicle charging point available on premises', 12, 0, 1),
(13, UUID(), 6, 'Solar Hot Water System', 'amenities/solar.svg', 'Eco-friendly 24x7 solar water heating for all bathrooms', 13, 1, 1),
(14, UUID(), 6, 'Caretaker on Site', 'amenities/caretaker.svg', 'Resident caretaker available round the clock for guest assistance and luggage', 14, 1, 1),
(15, UUID(), 6, 'Direct Beach Access', 'amenities/beach-access.svg', 'Private pathway with direct access to sandy beach within 2 minutes walk', 15, 1, 1);


/* =============================================================================
   SECTION 8: PROPERTY IMAGE TYPES
   ============================================================================= */
INSERT IGNORE INTO property_image_types (
    image_type_id, image_type_uuid, image_type_name, description, display_order, status
) VALUES
(1, UUID(), 'Property Exterior & Facade', 'Architectural facade, landscape, and main property entrance', 1, 1),
(2, UUID(), 'Lobby & Reception', 'Front desk, reception counter, and welcome lounge', 2, 1),
(3, UUID(), 'Swimming Pool & Lawns', 'Pool deck, coconut orchard lawns, and outdoor seating areas', 3, 1),
(4, UUID(), 'Restaurant & Dining Area', 'In-house dining hall, open-air beach dining shack, and restaurant', 4, 1),
(5, UUID(), 'Scenic Coastal Views', 'Panoramic sea views, sunset horizon, and coastal landscapes', 5, 1),
(6, UUID(), 'Aerial / Drone View', 'Top-down drone aerial view of the property and beachfront landscape', 6, 1);


/* =============================================================================
   SECTION 9: CONTACT TYPES
   ============================================================================= */
INSERT IGNORE INTO contact_types (
    contact_type_id, contact_type_uuid, contact_type_name, description, display_order, status
) VALUES
(1, UUID(), 'Front Desk & Reception', 'On-duty reception desk for guest check-in, key handover, and concierge', 1, 1),
(2, UUID(), 'Property Owner / General Manager', 'Direct contact of the property owner or general manager', 2, 1),
(3, UUID(), 'Reservations & Booking Office', 'Dedicated office line for advance booking inquiries and group bookings', 3, 1),
(4, UUID(), 'Emergency 24x7 Support', 'Local emergency contact available round-the-clock', 4, 1),
(5, UUID(), 'Dining & Kitchen Incharge', 'Head chef or kitchen manager for meal customization and banquet catering', 5, 1);


/* =============================================================================
   SECTION 10: CERTIFICATION TYPES
   ============================================================================= */
INSERT IGNORE INTO certification_types (
    certification_type_id, certification_type_uuid, certification_name, certification_slug, certification_category, issuing_authority, description, validity_required, default_validity_years, mandatory_for_property, renewable, verification_required, display_order, certification_icon, website_url, is_active
) VALUES
(1, UUID(), 'MTDC Tourism Recognition', 'mtdc-tourism-recognition', 'Tourism', 'Maharashtra Tourism Development Corporation', 'Official tourism classification certificate for registered coastal stays', 1, 3, 1, 1, 1, 1, 'badges/mtdc.svg', 'https://www.mtdc.co', 1),
(2, UUID(), 'FSSAI Hygiene Rating', 'fssai-hygiene-rating', 'Food', 'Food Safety and Standards Authority of India', 'National hygiene and food safety star certification for dining kitchens', 1, 2, 0, 1, 1, 2, 'badges/fssai.svg', 'https://fssai.gov.in', 1),
(3, UUID(), 'ISO 9001:2015 Quality Standard', 'iso-9001-2015-quality', 'Quality', 'International Organization for Standardization', 'Certified international standard for excellence in hospitality service', 1, 3, 0, 1, 1, 3, 'badges/iso.svg', 'https://iso.org', 1),
(4, UUID(), 'Konkan Eco-Tourism Green Badge', 'konkan-eco-green-badge', 'Environmental', 'Konkan Eco-Tourism Board', 'Recognition for rainwater harvesting, solar heating, and sustainable coastal practices', 1, 1, 0, 1, 1, 4, 'badges/eco.svg', 'https://ecotourism.gov.in', 1),
(5, UUID(), 'Fire Safety & Disaster Readiness NOC', 'fire-safety-noc-cert', 'Safety', 'Maharashtra Fire Services', 'State certified fire prevention and safety compliance certification', 1, 1, 1, 1, 1, 5, 'badges/fire.svg', 'https://mahafireservice.gov.in', 1);


/* =============================================================================
   SECTION 11: BED TYPES
   ============================================================================= */
INSERT IGNORE INTO bed_types (
    bed_type_id, bed_type_uuid, bed_type_name, bed_type_slug, short_name, description, bed_size, width_cm, length_cm, maximum_occupancy, suitable_for, icon, display_order, is_standard, is_active
) VALUES
(1, UUID(), 'King Size Bed', 'king-size-bed', 'King', 'Luxurious double mattress for couples', '76 x 80 inches', 193, 203, 2, '2 Adults / Couples', 'beds/king.svg', 1, 1, 1),
(2, UUID(), 'Queen Size Bed', 'queen-size-bed', 'Queen', 'Comfortable double bed ideal for 2 adults', '60 x 80 inches', 152, 203, 2, '2 Adults', 'beds/queen.svg', 2, 1, 1),
(3, UUID(), 'Twin Single Beds', 'twin-single-beds', 'Twin', 'Pair of separate single cots for solo travellers or friends', '38 x 75 inches each', 97, 191, 2, '2 Adults', 'beds/twin.svg', 3, 1, 1),
(4, UUID(), 'Single Cot', 'single-cot', 'Single', 'Standard single bed for solo guest', '38 x 75 inches', 97, 191, 1, '1 Adult', 'beds/single.svg', 4, 1, 1),
(5, UUID(), 'Convertible Sofa Bed', 'convertible-sofa-bed', 'Sofa Bed', 'Convertible living room sofa cum bed for extra guests', '54 x 75 inches', 137, 191, 2, 'Extra guests or children', 'beds/sofa.svg', 5, 0, 1),
(6, UUID(), 'Bunk Bed', 'bunk-bed', 'Bunk', 'Two-tier bunk bed ideal for kids or group hostel rooms', '38 x 75 inches each', 97, 191, 2, '2 Kids / Adults', 'beds/bunk.svg', 6, 0, 1),
(7, UUID(), 'Extra Floor Mattress', 'extra-floor-mattress', 'Rollaway', 'Comfortable rollaway folding floor mattress with linen', '36 x 72 inches', 91, 182, 1, '1 Adult / Child', 'beds/rollaway.svg', 7, 0, 1);


/* =============================================================================
   SECTION 12: ROOM TYPES (Master Room Templates)
   ============================================================================= */
INSERT IGNORE INTO room_types (
    room_type_id, room_type_uuid, room_type_name, room_type_slug, short_name, room_category, description, default_guest_capacity, maximum_guest_capacity, default_room_area, room_area_unit, default_bathrooms, default_balcony, default_kitchen, default_living_room, default_air_conditioning, default_wifi, default_breakfast, display_order, is_active
) VALUES
(1, UUID(), 'Deluxe Sea Facing Room', 'deluxe-sea-facing-room', 'Deluxe Sea View', 'Resort', 'Air-conditioned luxury room featuring private balcony with unobstructed sea views', 2, 3, 350.00, 'Sq.ft', 1, 1, 0, 0, 1, 1, 1, 1, 1),
(2, UUID(), 'Coastal Wooden Cottage', 'coastal-wooden-cottage', 'Wooden Cottage', 'Cottage', 'Eco-friendly wooden cottage surrounded by coconut trees near the beach', 2, 4, 420.00, 'Sq.ft', 1, 1, 0, 1, 1, 1, 1, 2, 1),
(3, UUID(), 'Executive Family Suite', 'executive-family-suite', 'Family Suite', 'Resort', 'Spacious 2-bedroom suite with interconnecting living lounge for families', 4, 6, 700.00, 'Sq.ft', 2, 1, 0, 1, 1, 1, 1, 3, 1),
(4, UUID(), 'Heritage Konkani Homestay Room', 'heritage-konkani-homestay-room', 'Homestay Room', 'Homestay', 'Traditional room built with Konkan red laterite stone and central courtyard access', 2, 3, 280.00, 'Sq.ft', 1, 0, 0, 0, 1, 1, 0, 4, 1),
(5, UUID(), 'Beachfront Private Luxury Villa', 'beachfront-private-luxury-villa', 'Beach Villa', 'Villa', 'Exclusive 3-bedroom private beach villa with personal lawn, kitchen, and deck', 6, 8, 1500.00, 'Sq.ft', 3, 1, 1, 1, 1, 1, 1, 5, 1),
(6, UUID(), 'Standard AC Room', 'standard-ac-room', 'Standard AC', 'Hotel', 'Comfortable air-conditioned bedroom with attached modern bathroom', 2, 3, 250.00, 'Sq.ft', 1, 0, 0, 0, 1, 1, 0, 6, 1),
(7, UUID(), 'Standard Non-AC Room', 'standard-non-ac-room', 'Standard Non-AC', 'Homestay', 'Budget friendly naturally ventilated room with ceiling fan and attached bath', 2, 3, 220.00, 'Sq.ft', 1, 0, 0, 0, 0, 1, 0, 7, 1);


/* =============================================================================
   SECTION 13: ROOM STATUS (Lifecycle & Housekeeping States)
   ============================================================================= */
INSERT IGNORE INTO room_status (
    room_status_id, room_status_uuid, status_name, status_slug, description, status_color, status_icon, is_bookable, affects_inventory, display_order, is_system_status, is_active
) VALUES
(1, UUID(), 'Available & Clean', 'available-clean', 'Room is thoroughly cleaned, inspected, and ready for immediate check-in', '#2ECC71', 'icons/check-circle.svg', 1, 1, 1, 1, 1),
(2, UUID(), 'Occupied', 'occupied', 'Guest is currently checked-in and occupying the room', '#3498DB', 'icons/user-check.svg', 0, 1, 2, 1, 1),
(3, UUID(), 'Housekeeping Required', 'housekeeping-required', 'Guest checked out; room awaiting housekeeping and linen change', '#F39C12', 'icons/broom.svg', 0, 1, 3, 1, 1),
(4, UUID(), 'Cleaning in Progress', 'cleaning-in-progress', 'Housekeeping staff is currently cleaning and sanitizing the room', '#E67E22', 'icons/refresh.svg', 0, 1, 4, 1, 1),
(5, UUID(), 'Under Maintenance', 'under-maintenance', 'Room blocked for scheduled AC, plumbing, or electrical repairs', '#E74C3C', 'icons/wrench.svg', 0, 1, 5, 1, 1),
(6, UUID(), 'Blocked by Management', 'blocked-by-management', 'Room reserved for owner stay or VIP corporate booking hold', '#9B59B6', 'icons/lock.svg', 0, 1, 6, 1, 1),
(7, UUID(), 'Out of Order', 'out-of-order', 'Room is temporarily unavailable for long term renovation or damage', '#7F8C8D', 'icons/alert-circle.svg', 0, 1, 7, 1, 1);


/* =============================================================================
   SECTION 14: ROOM VIEWS
   ============================================================================= */
INSERT IGNORE INTO room_views (
    room_view_id, room_view_uuid, room_view_name, room_view_slug, short_name, description, icon, display_order, premium_view, additional_charge, is_active
) VALUES
(1, UUID(), 'Direct Arabian Sea View', 'direct-arabian-sea-view', 'Sea View', 'Unobstructed 180-degree panoramic view of the sea and sunset', 'views/sea.svg', 1, 1, 500.00, 1),
(2, UUID(), 'Partial Sea View', 'partial-sea-view', 'Partial Sea', 'Side balcony view offering partial glimpse of the ocean', 'views/partial-sea.svg', 2, 1, 250.00, 1),
(3, UUID(), 'Coconut Grove & Garden View', 'coconut-grove-garden-view', 'Garden View', 'Lush green views of coconut palms, betel nut trees, and flowering gardens', 'views/garden.svg', 3, 0, 0.00, 1),
(4, UUID(), 'Swimming Pool View', 'swimming-pool-view', 'Pool View', 'Balcony facing the illuminated pool deck and outdoor patio', 'views/pool.svg', 4, 0, 200.00, 1),
(5, UUID(), 'Western Ghats Hill View', 'western-ghats-hill-view', 'Hill View', 'Misty hills and forest valleys of the Western Ghats range', 'views/hills.svg', 5, 0, 0.00, 1),
(6, UUID(), 'Traditional Courtyard View', 'traditional-courtyard-view', 'Courtyard View', 'Inner courtyard view with traditional Konkani wooden pillared veranda', 'views/courtyard.svg', 6, 0, 0.00, 1);


/* =============================================================================
   SECTION 15: ROOM IMAGE TYPES
   ============================================================================= */
INSERT IGNORE INTO room_image_types (
    room_image_type_id, room_image_type_uuid, image_type_name, image_type_slug, description, image_category, recommended_width, recommended_height, allowed_formats, max_file_size_mb, is_cover_allowed, is_required, display_order, is_active
) VALUES
(1, UUID(), 'Master Bedroom Interior', 'master-bedroom-interior', 'Wide angle shot of the bedroom interior and bed setup', 'Bedroom', 1920, 1080, '["jpg", "png", "webp"]', 10, 1, 1, 1, 1),
(2, UUID(), 'Attached Bathroom', 'attached-bathroom', 'Clean view of the bathroom amenities, shower, and vanity', 'Bathroom', 1920, 1080, '["jpg", "png", "webp"]', 10, 0, 1, 2, 1),
(3, UUID(), 'Balcony & Ocean View', 'balcony-ocean-view', 'Photo taken from the private room balcony showing the sea panorama', 'View', 1920, 1080, '["jpg", "png", "webp"]', 10, 1, 0, 3, 1),
(4, UUID(), 'Living & Seating Lounge', 'living-seating-lounge', 'Room seating setup, coffee table, and work desk', 'Interior', 1920, 1080, '["jpg", "png", "webp"]', 10, 0, 0, 4, 1),
(5, UUID(), 'Cottage Veranda & Exterior', 'cottage-veranda-exterior', 'Outdoor private sit-out porch and cottage entrance view', 'Exterior', 1920, 1080, '["jpg", "png", "webp"]', 10, 1, 0, 5, 1);


/* =============================================================================
   SECTION 16: ROOM FACILITY CATEGORIES & FACILITIES
   ============================================================================= */
INSERT IGNORE INTO room_facility_categories (
    room_facility_category_id, room_facility_category_uuid, category_name, category_slug, category_description, category_icon, display_order, is_active
) VALUES
(1, UUID(), 'Bathroom & Toiletries', 'bathroom-toiletries', 'Private bathroom amenities, hot water, and personal care supplies', 'icons/bath.svg', 1, 1),
(2, UUID(), 'Media & Technology', 'media-technology', 'Entertainment, high speed internet, and multimedia devices', 'icons/tv.svg', 2, 1),
(3, UUID(), 'Refreshments & Kitchenette', 'refreshments-kitchenette', 'Coffee/tea makers, mini-fridge, and drinking water facilities', 'icons/coffee.svg', 3, 1),
(4, UUID(), 'Climate & Comfort', 'climate-comfort', 'Air conditioning, fans, heating, and bedding comforts', 'icons/fan.svg', 4, 1),
(5, UUID(), 'Workspace & Convenience', 'workspace-convenience', 'Work desk, safe deposit, wardrobes, and power outlets', 'icons/briefcase.svg', 5, 1);

INSERT IGNORE INTO room_facilities (
    room_facility_id, room_facility_uuid, room_facility_category_id, facility_name, facility_slug, facility_icon, description, display_order, is_active
) VALUES
(1, UUID(), 1, 'Geyser / 24x7 Hot Water', 'geyser-hot-water', 'facilities/geyser.svg', 'Instant water heater / geyser with hot and cold shower mixer', 1, 1),
(2, UUID(), 1, 'Complimentary Premium Toiletries', 'premium-toiletries', 'facilities/soap.svg', 'Herbal soap, shampoo, dental kit, and fresh cotton bath towels', 2, 1),
(3, UUID(), 1, 'Hair Dryer', 'hair-dryer', 'facilities/dryer.svg', 'Electric hair dryer provided in the bathroom', 3, 1),
(4, UUID(), 2, '43-inch 4K Smart TV with OTT', 'smart-tv-ott', 'facilities/tv.svg', 'Smart LED television with Netflix, Prime Video, and cable channels', 4, 1),
(5, UUID(), 2, 'In-Room High-Speed Wi-Fi', 'in-room-wifi', 'facilities/wifi.svg', 'Dedicated optical fiber Wi-Fi access point in the room', 5, 1),
(6, UUID(), 3, 'Electric Kettle with Tea & Coffee Kit', 'electric-kettle-tea-coffee', 'facilities/kettle.svg', 'Electric kettle, coffee sachets, tea bags, dairy creamer, and sugar', 6, 1),
(7, UUID(), 3, 'Mini Refrigerator', 'mini-refrigerator', 'facilities/fridge.svg', 'Compact silent mini fridge for beverages and fruits', 7, 1),
(8, UUID(), 3, 'Complimentary Packaged Drinking Water', 'packaged-water', 'facilities/water.svg', 'Two 1-litre sealed mineral water bottles replenished daily', 8, 1),
(9, UUID(), 4, 'Split Air Conditioner (Inverter AC)', 'split-air-conditioner', 'facilities/ac.svg', 'Energy efficient silent split air conditioner with remote temperature control', 9, 1),
(10, UUID(), 4, 'High-Speed Ceiling Fan', 'ceiling-fan', 'facilities/fan.svg', 'Silent high-speed decorative ceiling fan', 10, 1),
(11, UUID(), 5, 'Electronic Digital Safe', 'electronic-digital-safe', 'facilities/safe.svg', 'Motorized digital keypad safety locker for laptop and valuables', 11, 1),
(12, UUID(), 5, 'Full Size Wardrobe with Hangers', 'wardrobe-hangers', 'facilities/wardrobe.svg', 'Wooden wardrobe with full length mirror and wooden coat hangers', 12, 1),
(13, UUID(), 5, 'Dedicated Work Desk & Ergonomic Chair', 'work-desk-chair', 'facilities/desk.svg', 'Dedicated laptop work table with universal power sockets and chair', 13, 1);


/* =============================================================================
   SECTION 17: MEAL PLANS
   ============================================================================= */
INSERT IGNORE INTO meal_plans (
    meal_plan_id, meal_plan_uuid, meal_plan_name, meal_plan_slug, short_name, description, breakfast_included, lunch_included, dinner_included, snacks_included, beverages_included, alcoholic_beverages_included, breakfast_type, meal_serving_type, is_all_inclusive, is_complimentary, display_order, is_active
) VALUES
(1, UUID(), 'European Plan (Room Only)', 'european-plan-ep', 'EP', 'Room stay only without any included meals', 0, 0, 0, 0, 0, 0, 'None', 'None', 0, 0, 1, 1),
(2, UUID(), 'Continental Plan (Bed & Breakfast)', 'continental-plan-cp', 'CP', 'Room stay inclusive of freshly prepared daily morning breakfast and tea', 1, 0, 0, 0, 1, 0, 'Buffet', 'Buffet', 0, 1, 2, 1),
(3, UUID(), 'Modified American Plan (Half Board)', 'modified-american-plan-map', 'MAP', 'Room stay inclusive of breakfast and your choice of authentic lunch or dinner', 1, 0, 1, 0, 1, 0, 'Buffet', 'Buffet', 0, 0, 3, 1),
(4, UUID(), 'American Plan (Full Board - All Meals)', 'american-plan-ap', 'AP', 'All-inclusive stay including breakfast, traditional Konkani lunch, high tea, and dinner', 1, 1, 1, 1, 1, 0, 'Buffet', 'Buffet', 1, 0, 4, 1);


/* =============================================================================
   SECTION 18: PERMISSIONS REGISTRY (30+ Granular System Permissions)
   ============================================================================= */
INSERT IGNORE INTO permissions (
    permission_id, module, action, permission_code, description, is_active, created_at, updated_at
) VALUES
-- Properties Module
(1, 'properties', 'read', 'properties:read', 'View properties and property details', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'properties', 'create', 'properties:create', 'Create new properties', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'properties', 'update', 'properties:update', 'Update property details, amenities, and locations', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'properties', 'delete', 'properties:delete', 'Delete or deactivate properties', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'properties', 'manage', 'properties:manage', 'Manage property sub-resources (images, policies, documents)', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Rooms Module
(6, 'rooms', 'read', 'rooms:read', 'View rooms, beds, amenities, and room status', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 'rooms', 'create', 'rooms:create', 'Create new rooms and inventory allocations', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 'rooms', 'update', 'rooms:update', 'Update room configurations, pricing, and live room status', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 'rooms', 'delete', 'rooms:delete', 'Delete or deactivate rooms', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 'rooms', 'manage', 'rooms:manage', 'Manage room sub-resources (beds, facilities, images)', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Inventory & Calendar Module
(11, 'inventory', 'read', 'inventory:read', 'View inventory calendar, rates, stock, and transactions', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(12, 'inventory', 'update', 'inventory:update', 'Update daily inventory stock and base room rates', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(13, 'inventory', 'manage_blocks', 'inventory:manage_blocks', 'Create and release maintenance or VIP room blocks', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(14, 'inventory', 'manage_stopsell', 'inventory:manage_stopsell', 'Create and release stop-sell availability restrictions', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Bookings & Front Desk Module
(15, 'bookings', 'read', 'bookings:read', 'View guest reservations, arrival lists, and guest details', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(16, 'bookings', 'create', 'bookings:create', 'Create new guest reservations and walk-in bookings', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(17, 'bookings', 'update', 'bookings:update', 'Modify reservations, process guest check-in and check-out', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(18, 'bookings', 'delete', 'bookings:delete', 'Cancel guest reservations and process refunds', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Housekeeping Module
(19, 'housekeeping', 'read', 'housekeeping:read', 'View room cleanliness status and housekeeping task list', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(20, 'housekeeping', 'update', 'housekeeping:update', 'Update room cleaning, linen change, and inspection status', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Maintenance Module
(21, 'maintenance', 'read', 'maintenance:read', 'View maintenance work orders and repair tickets', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(22, 'maintenance', 'manage', 'maintenance:manage', 'Create, update, and resolve property & room maintenance tasks', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- CRM & Employees Module
(23, 'employees', 'read', 'employees:read', 'View staff profiles, designations, and property assignments', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(24, 'employees', 'create', 'employees:create', 'Add new employees and staff accounts', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(25, 'employees', 'update', 'employees:update', 'Update employee profiles, salary, and assigned roles', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(26, 'employees', 'delete', 'employees:delete', 'Deactivate or soft-delete employee accounts', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Roles & RBAC Module
(27, 'roles', 'read', 'roles:read', 'View employee roles and mapped permissions', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(28, 'roles', 'create', 'roles:create', 'Create custom staff roles', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(29, 'roles', 'update', 'roles:update', 'Update custom roles and permission mappings', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(30, 'roles', 'delete', 'roles:delete', 'Delete custom staff roles', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Reports & Financials Module
(31, 'reports', 'read', 'reports:read', 'View revenue analytics, occupancy metrics, and operational reports', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(32, 'financials', 'read', 'financials:read', 'View guest billing, invoices, payment settlements, and tax reports', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


/* =============================================================================
   SECTION 19: PREDEFINED SYSTEM ROLES & RBAC MAPPINGS
   ============================================================================= */
INSERT IGNORE INTO employee_roles (
    role_id, p_owner_id, role_name, role_slug, role_description, is_system_role, is_active, delete_status, created_at, updated_at
) VALUES
(1, NULL, 'Property Manager', 'property-manager', 'Full operational and managerial access across all assigned property modules', TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, NULL, 'Front Desk / Receptionist', 'front-desk', 'Handles guest check-ins, reservations, room availability, and guest requests', TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, NULL, 'Housekeeping Supervisor', 'housekeeping-supervisor', 'Manages room cleaning schedules, linen change, and room inspection status', TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, NULL, 'Maintenance Staff', 'maintenance-staff', 'Handles property maintenance, repair tickets, and maintenance room blocks', TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, NULL, 'Accountant / Finance', 'accountant-finance', 'Views guest invoices, payment settlements, revenue reports, and inventory rates', TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, NULL, 'Sales & Marketing', 'sales-marketing', 'Oversees room rates, stop-sells, inventory availability, and promotional inquiries', TRUE, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Map Permissions to System Roles
-- Role 1: Property Manager (All Permissions)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, permission_id FROM permissions;

-- Role 2: Front Desk / Receptionist
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, permission_id FROM permissions WHERE permission_code IN (
    'properties:read',
    'rooms:read', 'rooms:update',
    'inventory:read',
    'bookings:read', 'bookings:create', 'bookings:update',
    'housekeeping:read'
);

-- Role 3: Housekeeping Supervisor
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 3, permission_id FROM permissions WHERE permission_code IN (
    'properties:read',
    'rooms:read', 'rooms:update',
    'housekeeping:read', 'housekeeping:update'
);

-- Role 4: Maintenance Staff
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 4, permission_id FROM permissions WHERE permission_code IN (
    'properties:read',
    'rooms:read',
    'inventory:read', 'inventory:manage_blocks',
    'maintenance:read', 'maintenance:manage'
);

-- Role 5: Accountant / Finance
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 5, permission_id FROM permissions WHERE permission_code IN (
    'properties:read',
    'rooms:read',
    'inventory:read',
    'bookings:read',
    'reports:read',
    'financials:read'
);

-- Role 6: Sales & Marketing
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 6, permission_id FROM permissions WHERE permission_code IN (
    'properties:read',
    'rooms:read',
    'inventory:read', 'inventory:update', 'inventory:manage_stopsell',
    'bookings:read',
    'reports:read'
);

SET FOREIGN_KEY_CHECKS = 1;