import { supabase } from "./src/lib/supabase";

async function checkSchema() {
  const { data, error } = await supabase
    .from('media_hub')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error("Error:", error);
  } else if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("No data found to check columns.");
  }
}

checkSchema();
