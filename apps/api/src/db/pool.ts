import 'dotenv/config'
import { Pool } from 'pg'

const required = (key: string) => {
  const value = process.env[key]
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 5432,
  database: required('DB_NAME'),
  user: required('DB_USER'),
  password: required('DB_PASSWORD'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
})
