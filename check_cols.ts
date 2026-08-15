import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://btnxzffcuvwhuxdeshpk.supabase.co";
const supabaseKey = "sb_publishable_ZuDXDtPWYZmDAlZZrxz0uA_K_eeAb2G";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  try {
    const { data, error } = await supabase
      .from("jewelry_certificates")
      .select()
      .limit(1);

    if (error) {
      console.error("Error:", error.message);
    } else {
      if (data && data.length > 0) {
        const cols = Object.keys(data[0]);
        console.log("Columns in jewelry_certificates:");
        cols.forEach(c => console.log("  -", c));
      }
    }
  } catch (err) {
    console.error("Exception:", err.message);
  }
}

checkColumns();
