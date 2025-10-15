-- Создание таблицы для хранения показаний электросчётчиков
CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    meter_number VARCHAR(100) NOT NULL,
    reading INTEGER NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Добавление комментариев к таблице и колонкам
COMMENT ON TABLE readings IS 'История показаний электросчётчиков пользователей';
COMMENT ON COLUMN readings.user_id IS 'Идентификатор пользователя';
COMMENT ON COLUMN readings.meter_number IS 'Номер счётчика (буквенно-цифровой)';
COMMENT ON COLUMN readings.reading IS 'Показания счётчика в кВт·ч';
COMMENT ON COLUMN readings.photo_url IS 'URL загруженного фото счётчика';
COMMENT ON COLUMN readings.created_at IS 'Дата и время записи показаний';