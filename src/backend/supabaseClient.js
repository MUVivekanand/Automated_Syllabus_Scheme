const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config({ path: "../.env" });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);

if (!supabase) {
  console.error("Failed to initialize Supabase client.");
} else {
  console.log("Supabase client initialized successfully.");
}

module.exports = supabase;
