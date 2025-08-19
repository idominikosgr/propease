-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enum types matching iList structure
CREATE TYPE property_status_type AS ENUM ('active', 'deleted');
CREATE TYPE sync_status_type AS ENUM ('pending', 'syncing', 'completed', 'failed');

-- Core properties table - 100% iList parity
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Direct iList fields (exact mapping)
  ilist_id INTEGER UNIQUE NOT NULL, -- iList Id field
  category_id INTEGER, -- Category_ID
  subcategory_id INTEGER, -- SubCategory_ID  
  aim_id INTEGER, -- Aim_ID (1=sale, 2=rent, etc)
  custom_code VARCHAR, -- CustomCode
  price DECIMAL(15, 2), -- Price
  sqr_meters INTEGER, -- SqrMeters
  price_per_sqrm DECIMAL(10, 2), -- PricePerSqrm
  building_year INTEGER, -- BuildingYear
  plot_sqr_meters INTEGER, -- PlotSqrMeters
  rooms INTEGER, -- Rooms
  master_bedrooms INTEGER, -- MasterBedrooms
  bathrooms INTEGER, -- Bathrooms
  wc INTEGER, -- WC
  area_id INTEGER, -- Area_ID
  subarea_id INTEGER, -- SubArea_ID
  latitude DECIMAL(12, 8), -- Latitude
  longitude DECIMAL(12, 8), -- Longitude
  postal_code VARCHAR, -- PostalCode
  energy_class_id INTEGER, -- EnergyClass_ID
  floor_id INTEGER, -- Floor_ID
  levels VARCHAR, -- Levels (comma separated)
  total_parkings INTEGER DEFAULT 0, -- TotalParkings
  
  -- Status and metadata from iList
  send_date TIMESTAMPTZ, -- SendDate
  update_date TIMESTAMPTZ, -- UpdateDate
  token VARCHAR, -- Token
  is_sync BOOLEAN DEFAULT true, -- isSync
  status_id INTEGER DEFAULT 1, -- StatusID (1=active, 2=deleted)
  
  -- PostGIS location point
  location GEOMETRY(POINT, 4326),
  
  -- Complete iList response stored as JSONB for full parity
  ilist_raw_data JSONB NOT NULL,
  
  -- Internal tracking
  last_ilist_sync TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Search optimization
  search_vector TSVECTOR
);

-- Property images table - exact iList Images structure  
CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Direct iList Images fields
  ilist_image_id INTEGER, -- iList Id
  order_num INTEGER, -- OrderNum
  url TEXT NOT NULL, -- Url
  thumb_url TEXT, -- ThumbUrl
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property characteristics - exact iList Characteristics structure
CREATE TABLE property_characteristics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Direct iList Characteristics fields
  ilist_characteristic_id INTEGER, -- iList Id
  language_id INTEGER, -- Language_Id
  title VARCHAR NOT NULL, -- Title
  value TEXT, -- Value
  lookup_type VARCHAR, -- LookupType
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property additional languages - exact iList AdditionalLanguages structure
CREATE TABLE property_additional_languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Direct iList AdditionalLanguages fields
  ml_language_id INTEGER, -- MLLanguage_ID
  language VARCHAR, -- Language
  title TEXT, -- Title
  property_ad TEXT, -- PropertyAd
  description TEXT, -- Description
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property parkings - exact iList Parkings structure
CREATE TABLE property_parkings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  -- iList parking fields (structure from API response)
  parking_data JSONB, -- Store complete parking object
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property distance from places - exact iList DistanceFrom structure
CREATE TABLE property_distances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Direct iList DistanceFrom fields
  place_id INTEGER, -- Place_ID
  distance INTEGER, -- Distance
  measure_id INTEGER, -- Measure_ID
  descriptions JSONB, -- Description array with Language_ID and Value
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property basements - exact iList Basements structure
CREATE TABLE property_basements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  -- iList basement fields
  basement_data JSONB, -- Store complete basement object
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property partner/contact - exact iList Partner structure
CREATE TABLE property_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Direct iList Partner fields
  ilist_partner_id INTEGER, -- iList Id
  firstname VARCHAR, -- Firstname
  lastname VARCHAR, -- Lastname
  email VARCHAR, -- Email
  phone VARCHAR, -- Phone
  photo_url TEXT, -- PhotoUrl
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property flags - exact iList Flags structure
CREATE TABLE property_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  -- iList flag fields
  flag_data JSONB, -- Store complete flag object
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- iList lookup tables for complete data integrity
CREATE TABLE ilist_lookups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lookup_type VARCHAR NOT NULL, -- 'PropertyAmenities', 'HeatingType', etc.
  lookup_id INTEGER, -- The ID from iList
  language_id INTEGER DEFAULT 4, -- Language (4 = Greek)
  value TEXT, -- The display value
  raw_data JSONB, -- Complete lookup object
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lookup_type, lookup_id, language_id)
);

-- iList API sync management
CREATE TABLE ilist_sync_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type VARCHAR NOT NULL, -- 'full', 'incremental', 'single_property'
  status sync_status_type DEFAULT 'pending',
  
  -- Sync parameters
  status_id INTEGER DEFAULT 1, -- 1=active, 2=deleted
  include_deleted_from_crm BOOLEAN DEFAULT false,
  send_date_from_utc TIMESTAMPTZ,
  send_date_to_utc TIMESTAMPTZ,
  update_date_from_utc TIMESTAMPTZ,
  update_date_to_utc TIMESTAMPTZ,
  
  -- Results
  total_properties INTEGER DEFAULT 0,
  new_properties INTEGER DEFAULT 0,
  updated_properties INTEGER DEFAULT 0,
  deleted_properties INTEGER DEFAULT 0,
  failed_properties INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Raw API responses for debugging
  api_responses JSONB
);

-- iList API configuration
CREATE TABLE ilist_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_base_url VARCHAR DEFAULT 'https://ilist.e-agents.gr',
  auth_token VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_test_date TIMESTAMPTZ,
  test_success BOOLEAN,
  rate_limit_per_minute INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property inquiries/leads (website functionality)
CREATE TABLE property_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Lead information
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  phone VARCHAR,
  message TEXT,
  
  -- Tracking
  source VARCHAR DEFAULT 'website',
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  
  -- Status
  status VARCHAR DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'closed'
  assigned_to UUID, -- Can link to user system
  
  -- Integration with iList (if they support lead API)
  sent_to_ilist BOOLEAN DEFAULT false,
  ilist_lead_id INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_properties_ilist_id ON properties(ilist_id);
CREATE INDEX idx_properties_status_id ON properties(status_id);
CREATE INDEX idx_properties_category_id ON properties(category_id);
CREATE INDEX idx_properties_subcategory_id ON properties(subcategory_id);
CREATE INDEX idx_properties_aim_id ON properties(aim_id);
CREATE INDEX idx_properties_area_id ON properties(area_id);
CREATE INDEX idx_properties_subarea_id ON properties(subarea_id);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_sqr_meters ON properties(sqr_meters);
CREATE INDEX idx_properties_rooms ON properties(rooms);
CREATE INDEX idx_properties_energy_class_id ON properties(energy_class_id);
CREATE INDEX idx_properties_send_date ON properties(send_date);
CREATE INDEX idx_properties_update_date ON properties(update_date);
CREATE INDEX idx_properties_last_ilist_sync ON properties(last_ilist_sync);
CREATE INDEX idx_properties_search_vector ON properties USING gin(search_vector);

-- Spatial index
CREATE INDEX idx_properties_location ON properties USING gist(location);

-- Images indexes
CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_images_order_num ON property_images(order_num);

-- Characteristics indexes
CREATE INDEX idx_property_characteristics_property_id ON property_characteristics(property_id);
CREATE INDEX idx_property_characteristics_language_id ON property_characteristics(language_id);
CREATE INDEX idx_property_characteristics_title ON property_characteristics(title);
CREATE INDEX idx_property_characteristics_lookup_type ON property_characteristics(lookup_type);

-- Lookup indexes
CREATE INDEX idx_ilist_lookups_type_id ON ilist_lookups(lookup_type, lookup_id);
CREATE INDEX idx_ilist_lookups_language ON ilist_lookups(language_id);

-- Sync session indexes  
CREATE INDEX idx_ilist_sync_sessions_status ON ilist_sync_sessions(status);
CREATE INDEX idx_ilist_sync_sessions_started_at ON ilist_sync_sessions(started_at);

-- Inquiry indexes
CREATE INDEX idx_property_inquiries_property_id ON property_inquiries(property_id);
CREATE INDEX idx_property_inquiries_status ON property_inquiries(status);
CREATE INDEX idx_property_inquiries_created_at ON property_inquiries(created_at);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at 
  BEFORE UPDATE ON properties 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ilist_config_updated_at 
  BEFORE UPDATE ON ilist_config 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_inquiries_updated_at 
  BEFORE UPDATE ON property_inquiries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update location point from lat/lng
CREATE OR REPLACE FUNCTION update_property_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_property_location_trigger
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_property_location();

-- Function to update search vector from characteristics
CREATE OR REPLACE FUNCTION update_property_search_vector()
RETURNS TRIGGER AS $$
DECLARE
  title_text TEXT := '';
  description_text TEXT := '';
BEGIN
  -- Extract Greek title and description from characteristics
  SELECT COALESCE(STRING_AGG(value, ' '), '') INTO title_text
  FROM property_characteristics 
  WHERE property_id = NEW.id 
    AND language_id = 4 
    AND title = 'Τίτλος';
    
  SELECT COALESCE(STRING_AGG(value, ' '), '') INTO description_text
  FROM property_characteristics 
  WHERE property_id = NEW.id 
    AND language_id = 4 
    AND title IN ('Αγγελία', 'Επιπλέον κείμενο (ΧΕ)');
  
  NEW.search_vector := to_tsvector('greek', 
    COALESCE(title_text, '') || ' ' ||
    COALESCE(description_text, '') || ' ' ||
    COALESCE(NEW.custom_code, '') || ' ' ||
    COALESCE(NEW.postal_code, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_property_search_vector_trigger
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_property_search_vector();

-- Function to update search vector when characteristics change
CREATE OR REPLACE FUNCTION update_property_search_on_characteristics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE properties 
  SET updated_at = NOW() 
  WHERE id = NEW.property_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_property_search_on_characteristics_trigger
  AFTER INSERT OR UPDATE OR DELETE ON property_characteristics
  FOR EACH ROW EXECUTE FUNCTION update_property_search_on_characteristics();

-- Row Level Security (RLS) policies
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_characteristics ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_partners ENABLE ROW LEVEL SECURITY;

-- Public read access to active properties (status_id = 1)
CREATE POLICY "Active properties are viewable by everyone" ON properties
  FOR SELECT USING (status_id = 1);

-- Public read access to images of active properties
CREATE POLICY "Property images are viewable for active properties" ON property_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_images.property_id 
      AND properties.status_id = 1
    )
  );

-- Public read access to characteristics of active properties
CREATE POLICY "Property characteristics are viewable for active properties" ON property_characteristics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_characteristics.property_id 
      AND properties.status_id = 1
    )
  );

-- Public read access to partners of active properties
CREATE POLICY "Property partners are viewable for active properties" ON property_partners
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_partners.property_id 
      AND properties.status_id = 1
    )
  );

-- Public insert access to inquiries
CREATE POLICY "Anyone can create property inquiries" ON property_inquiries
  FOR INSERT WITH CHECK (true);

-- Materialized views for performance (refresh periodically)
CREATE MATERIALIZED VIEW property_search_optimized AS
SELECT 
  p.id,
  p.ilist_id,
  p.price,
  p.sqr_meters,
  p.price_per_sqrm,
  p.rooms,
  p.bathrooms,
  p.area_id,
  p.subarea_id,
  p.latitude,
  p.longitude,
  p.energy_class_id,
  p.send_date,
  p.update_date,
  
  -- Greek title from characteristics
  (SELECT value FROM property_characteristics 
   WHERE property_id = p.id AND language_id = 4 AND title = 'Τίτλος' 
   LIMIT 1) as title,
   
  -- Greek description from characteristics  
  (SELECT value FROM property_characteristics 
   WHERE property_id = p.id AND language_id = 4 AND title = 'Επιπλέον κείμενο (ΧΕ)' 
   LIMIT 1) as description,
   
  -- Primary image
  (SELECT url FROM property_images 
   WHERE property_id = p.id 
   ORDER BY order_num ASC 
   LIMIT 1) as primary_image_url,
   
  -- Image count
  (SELECT COUNT(*) FROM property_images 
   WHERE property_id = p.id) as image_count,
   
  -- Partner info
  (SELECT json_build_object(
    'name', firstname || ' ' || lastname,
    'email', email,
    'phone', phone,
    'photo_url', photo_url
   ) FROM property_partners 
   WHERE property_id = p.id 
   LIMIT 1) as partner_info

FROM properties p
WHERE p.status_id = 1; -- Only active properties

-- Create index on materialized view
CREATE INDEX idx_property_search_optimized_area ON property_search_optimized(area_id);
CREATE INDEX idx_property_search_optimized_price ON property_search_optimized(price);
CREATE INDEX idx_property_search_optimized_rooms ON property_search_optimized(rooms);

-- Functions for iList API integration

-- Function to create or update property from iList data
CREATE OR REPLACE FUNCTION upsert_property_from_ilist(ilist_data JSONB)
RETURNS UUID AS $$
DECLARE
  property_id UUID;
  property_ilist_id INTEGER;
  existing_property_id UUID;
BEGIN
  -- Extract iList ID
  property_ilist_id := (ilist_data->>'Id')::INTEGER;
  
  -- Check if property exists
  SELECT id INTO existing_property_id 
  FROM properties 
  WHERE properties.ilist_id = property_ilist_id;
  
  IF existing_property_id IS NOT NULL THEN
    -- Update existing property
    UPDATE properties SET
      category_id = (ilist_data->>'Category_ID')::INTEGER,
      subcategory_id = (ilist_data->>'SubCategory_ID')::INTEGER,
      aim_id = (ilist_data->>'Aim_ID')::INTEGER,
      custom_code = ilist_data->>'CustomCode',
      price = (ilist_data->>'Price')::DECIMAL(15,2),
      sqr_meters = (ilist_data->>'SqrMeters')::INTEGER,
      price_per_sqrm = (ilist_data->>'PricePerSqrm')::DECIMAL(10,2),
      building_year = (ilist_data->>'BuildingYear')::INTEGER,
      plot_sqr_meters = (ilist_data->>'PlotSqrMeters')::INTEGER,
      rooms = (ilist_data->>'Rooms')::INTEGER,
      master_bedrooms = (ilist_data->>'MasterBedrooms')::INTEGER,
      bathrooms = (ilist_data->>'Bathrooms')::INTEGER,
      wc = (ilist_data->>'WC')::INTEGER,
      area_id = (ilist_data->>'Area_ID')::INTEGER,
      subarea_id = (ilist_data->>'SubArea_ID')::INTEGER,
      latitude = (ilist_data->>'Latitude')::DECIMAL(12,8),
      longitude = (ilist_data->>'Longitude')::DECIMAL(12,8),
      postal_code = ilist_data->>'PostalCode',
      energy_class_id = (ilist_data->>'EnergyClass_ID')::INTEGER,
      floor_id = (ilist_data->>'Floor_ID')::INTEGER,
      levels = ilist_data->>'Levels',
      total_parkings = (ilist_data->>'TotalParkings')::INTEGER,
      send_date = (ilist_data->>'SendDate')::TIMESTAMPTZ,
      update_date = (ilist_data->>'UpdateDate')::TIMESTAMPTZ,
      token = ilist_data->>'Token',
      status_id = (ilist_data->>'StatusID')::INTEGER,
      ilist_raw_data = ilist_data,
      last_ilist_sync = NOW(),
      updated_at = NOW()
    WHERE id = existing_property_id;
    
    property_id := existing_property_id;
  ELSE
    -- Insert new property
    INSERT INTO properties (
      ilist_id, category_id, subcategory_id, aim_id, custom_code,
      price, sqr_meters, price_per_sqrm, building_year, plot_sqr_meters,
      rooms, master_bedrooms, bathrooms, wc, area_id, subarea_id,
      latitude, longitude, postal_code, energy_class_id, floor_id,
      levels, total_parkings, send_date, update_date, token, status_id,
      ilist_raw_data, last_ilist_sync
    ) VALUES (
      property_ilist_id,
      (ilist_data->>'Category_ID')::INTEGER,
      (ilist_data->>'SubCategory_ID')::INTEGER,
      (ilist_data->>'Aim_ID')::INTEGER,
      ilist_data->>'CustomCode',
      (ilist_data->>'Price')::DECIMAL(15,2),
      (ilist_data->>'SqrMeters')::INTEGER,
      (ilist_data->>'PricePerSqrm')::DECIMAL(10,2),
      (ilist_data->>'BuildingYear')::INTEGER,
      (ilist_data->>'PlotSqrMeters')::INTEGER,
      (ilist_data->>'Rooms')::INTEGER,
      (ilist_data->>'MasterBedrooms')::INTEGER,
      (ilist_data->>'Bathrooms')::INTEGER,
      (ilist_data->>'WC')::INTEGER,
      (ilist_data->>'Area_ID')::INTEGER,
      (ilist_data->>'SubArea_ID')::INTEGER,
      (ilist_data->>'Latitude')::DECIMAL(12,8),
      (ilist_data->>'Longitude')::DECIMAL(12,8),
      ilist_data->>'PostalCode',
      (ilist_data->>'EnergyClass_ID')::INTEGER,
      (ilist_data->>'Floor_ID')::INTEGER,
      ilist_data->>'Levels',
      (ilist_data->>'TotalParkings')::INTEGER,
      (ilist_data->>'SendDate')::TIMESTAMPTZ,
      (ilist_data->>'UpdateDate')::TIMESTAMPTZ,
      ilist_data->>'Token',
      (ilist_data->>'StatusID')::INTEGER,
      ilist_data,
      NOW()
    )
    RETURNING id INTO property_id;
  END IF;
  
  RETURN property_id;
END;
$$ LANGUAGE plpgsql;