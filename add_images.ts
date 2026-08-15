import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://btnxzffcuvwhuxdeshpk.supabase.co";
const supabaseKey = "sb_publishable_ZuDXDtPWYZmDAlZZrxz0uA_K_eeAb2G";

const supabase = createClient(supabaseUrl, supabaseKey);

async function addImagesColumn() {
  try {
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: "ALTER TABLE jewelry_certificates ADD COLUMN images text[] DEFAULT '{}'"
    });

    if (error) {
      console.error("Error:", error.message);
    } else {
      console.log("Column added successfully");
    }
  } catch (err) {
    console.error("Exception:", err.message);
  }
}

addImagesColumn();
