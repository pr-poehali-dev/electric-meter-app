CREATE TABLE IF NOT EXISTS t_p51427126_electric_meter_app.readings (
    id SERIAL PRIMARY KEY,
    meter_number VARCHAR(100) NOT NULL,
    reading INTEGER NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(100) DEFAULT 'default_user'
);

CREATE INDEX idx_readings_meter_number ON t_p51427126_electric_meter_app.readings(meter_number);
CREATE INDEX idx_readings_created_at ON t_p51427126_electric_meter_app.readings(created_at DESC);
CREATE INDEX idx_readings_user_id ON t_p51427126_electric_meter_app.readings(user_id);