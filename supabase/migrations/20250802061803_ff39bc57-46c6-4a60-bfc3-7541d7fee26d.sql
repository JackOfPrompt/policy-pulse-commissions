-- Drop existing restrictive check constraints
ALTER TABLE public.motor_policies 
DROP CONSTRAINT IF EXISTS motor_policies_vehicle_type_check;

ALTER TABLE public.motor_policies 
DROP CONSTRAINT IF EXISTS motor_policies_fuel_type_check;

-- Create more flexible check constraints that allow common variations
ALTER TABLE public.motor_policies 
ADD CONSTRAINT motor_policies_vehicle_type_check 
CHECK (vehicle_type IS NULL OR vehicle_type IN (
  'Car', 'Bike', 'Commercial Vehicle', 'Tractor', 'EV',
  '2W', 'Two Wheeler', 'Two-Wheeler', 'Motorcycle', 'Scooter',
  'Private Car', 'Commercial Car', 'Goods Carrier', 'Passenger Carrier',
  'Truck', 'Bus', 'Van', 'Auto', 'Rickshaw', 'Three Wheeler',
  'Miscellaneous', 'Others', 'Electric Vehicle', 'Hybrid'
));

ALTER TABLE public.motor_policies 
ADD CONSTRAINT motor_policies_fuel_type_check 
CHECK (fuel_type IS NULL OR fuel_type IN (
  'Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG',
  'PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID',
  'Compressed Natural Gas', 'Liquified Petroleum Gas',
  'Battery Electric Vehicle', 'BEV', 'Plug-in Hybrid',
  'Petrol+CNG', 'Diesel+CNG', 'Bi-Fuel', 'Others'
));