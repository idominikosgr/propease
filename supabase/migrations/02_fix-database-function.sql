-- Fix the upsert_property_from_ilist function
-- This fixes the variable naming conflict that was causing the import to fail

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