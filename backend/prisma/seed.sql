-- Ensure the owner exists
INSERT INTO "users" (user_id, name, email, password, role, created_at)
VALUES ('test-owner-id', 'Test Owner', 'owner@test.com', 'password', 'MIDDLEMAN', NOW())
ON CONFLICT (email) DO NOTHING;

-- Clean up existing listings to avoid conflicts
DELETE FROM "listings" WHERE listing_id IN ('mumbai-luxury-1', 'mumbai-urban-1', 'delhi-urban-1', 'bangalore-park-1', 'manali-resort-1');

-- Insert Mumbai Listings
INSERT INTO "listings" (listing_id, title, description, category, status, owner_id, city, address, latitude, longitude, image_urls, created_at)
VALUES 
('mumbai-luxury-1', 'Ocean Breeze Penthouse', 'Luxury penthouse with a view of the Arabian Sea.', 'LUXURY', 'ACTIVE', 'test-owner-id', 'Mumbai', 'Marine Drive, Mumbai', 18.9440, 72.8230, ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80'], NOW()),
('mumbai-urban-1', 'Bandra Business Studio', 'Modern studio in the heart of Bandra.', 'URBAN', 'ACTIVE', 'test-owner-id', 'Mumbai', 'Pali Hill, Bandra West', 19.0600, 72.8290, ARRAY['https://images.unsplash.com/photo-1502672260266-1c1e52db06ac?auto=format&fit=crop&w=1600&q=80'], NOW());

-- Insert Delhi Listing
INSERT INTO "listings" (listing_id, title, description, category, status, owner_id, city, address, latitude, longitude, image_urls, created_at)
VALUES 
('delhi-urban-1', 'Connaught Place Heritage Stay', 'Live in the historical center of New Delhi.', 'URBAN', 'ACTIVE', 'test-owner-id', 'Delhi', 'Block B, CP, New Delhi', 28.6315, 77.2167, ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80'], NOW());

-- Insert Bangalore Listing
INSERT INTO "listings" (listing_id, title, description, category, status, owner_id, city, address, latitude, longitude, image_urls, created_at)
VALUES 
('bangalore-park-1', 'Garden City Luxury Suite', 'Premium suite in the lush greens of Indiranagar.', 'LUXURY', 'ACTIVE', 'test-owner-id', 'Bangalore', 'Indiranagar, Bangalore', 12.9716, 77.5946, ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80'], NOW());

-- Insert Manali Listing
INSERT INTO "listings" (listing_id, title, description, category, status, owner_id, city, address, latitude, longitude, image_urls, created_at)
VALUES 
('manali-resort-1', 'Snow Peak Chalet', 'Cozy chalet with panoramic Himalayan views.', 'WATERFRONT', 'ACTIVE', 'test-owner-id', 'Manali', 'Old Manali, Himachal', 32.2432, 77.1892, ARRAY['https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1600&q=80'], NOW());
