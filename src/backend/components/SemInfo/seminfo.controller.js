const supabase = require("../../supabaseClient");

const updateSemInfo = async (req, res) => {
  const { semData } = req.body;

  try {
    // Process each row in the semData
    for (const row of semData) {
      if (!row.degree || !row.department) {
        continue; // Skip rows without degree or department
      }

      // Choose table based on degree
      const tableName = row.degree === "M.E" ? "seminfome" : "seminfo";

      // Prepare data for upsert
      const semInfoRow = {
        sem_no: row.sem_no,
        theory_courses: row.theory_courses,
        practical_courses: row.practical_courses,
        mandatory_courses: row.mandatory_courses,
        total_credits: row.total_credits,
        degree: row.degree,
        department: row.department
      };

      // Upsert into the appropriate table (update if exists, insert if not)
      const { error } = await supabase
        .from(tableName)
        .upsert(semInfoRow, {
          onConflict: 'sem_no'
        });

      if (error) {
        console.error(`Supabase ${tableName} upsert error:`, error);
        return res.status(500).json({
          success: false,
          message: `Failed to update semester information in ${tableName}.`,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Semester information updated successfully.",
    });
  } catch (error) {
    console.error("Unexpected error while updating SemesterInfo:", error);
    res.status(500).json({
      success: false,
      message: "Unexpected error occurred.",
      error: error.message,
    });
  }
};

const updateCredits = async (req, res) => {
  const { creditsData } = req.body;

  if (!creditsData || creditsData.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No credits data provided. Existing data remains unchanged.",
    });
  }

  try {
    // Get unique combinations of sem_no, degree, and department
    const semCombinations = [...new Set(creditsData.map(item => 
      `${item.sem_no}-${item.degree || ''}-${item.department || ''}`
    ))].map(combo => {
      const [sem_no, degree, department] = combo.split('-');
      return { sem_no: parseInt(sem_no), degree, department };
    });

    // Process data for each semester with degree and department info
    let processedCreditsData = [];
    
    for (const { sem_no, degree, department } of semCombinations) {
      const semesterItems = creditsData.filter(item => 
        item.sem_no === sem_no && 
        item.degree === degree && 
        item.department === department
      );
      
      if (semesterItems.length === 0) continue;
      
      // Get the first item to access course counts
      const firstItem = semesterItems[0];
      
      // Create a unique identifier for this combination
      const comboId = `${sem_no}-${degree}-${department}`;
      
      // Create theory and practical courses
      const theoryRows = Array.from(
        { length: parseInt(firstItem.theory_courses) || 0 },
        (_, i) => ({
          course_name: `T-${comboId}-${i + 1}`, // Unique course_name
          sem_no: sem_no,
          category: "theory",
          serial_no: i + 1,
          degree: degree,
          department: department
        })
      );

      const practicalRows = Array.from(
        { length: parseInt(firstItem.practical_courses) || 0 },
        (_, i) => ({
          course_name: `P-${comboId}-${i + 1}`, // Unique course_name
          sem_no: sem_no,
          category: "practical",
          serial_no: theoryRows.length + i + 1,
          degree: degree,
          department: department
        })
      );
      
      // Add to processed data
      processedCreditsData = [...processedCreditsData, ...theoryRows, ...practicalRows];
    }

    // Choose the appropriate table based on degree and clear existing records
    const beCredits = processedCreditsData.filter(item => item.degree === "B.E");
    const meCredits = processedCreditsData.filter(item => item.degree === "M.E");

    // Handle B.E credits
    if (beCredits.length > 0) {
      // Get unique department combinations for B.E
      const beDepartments = [...new Set(beCredits.map(item => item.department))];
      
      for (const department of beDepartments) {
        // Delete existing records for this department and B.E degree
        const { error: deleteError } = await supabase
          .from("credits")
          .delete()
          .eq("degree", "B.E")
          .eq("department", department);
          
        if (deleteError) {
          console.error("Supabase delete error for B.E credits:", deleteError);
          continue;
        }
        
        // Insert new B.E records for this department
        const deptCredits = beCredits.filter(item => item.department === department);
        const { error: insertError } = await supabase
          .from("credits")
          .insert(deptCredits);
          
        if (insertError) {
          console.error("Supabase insert error for B.E credits:", insertError);
          continue;
        }
      }
    }

    // Handle M.E credits - create a new creditsME table with the same structure
    if (meCredits.length > 0) {
      // Get unique department combinations for M.E
      const meDepartments = [...new Set(meCredits.map(item => item.department))];
      
      for (const department of meDepartments) {
        // Delete existing records for this department and M.E degree
        const { error: deleteError } = await supabase
          .from("creditsME")
          .delete()
          .eq("degree", "M.E")
          .eq("department", department);
          
        if (deleteError) {
          console.error("Supabase delete error for M.E credits:", deleteError);
          continue;
        }
        
        // Insert new M.E records for this department
        const deptCredits = meCredits.filter(item => item.department === department);
        const { error: insertError } = await supabase
          .from("creditsME")
          .insert(deptCredits);
          
        if (insertError) {
          console.error("Supabase insert error for M.E credits:", insertError);
          continue;
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Credits information updated successfully.",
    });
  } catch (error) {
    console.error("Unexpected error while updating Credits:", error);
    res.status(500).json({
      success: false,
      message: "Unexpected error occurred.",
      error: error.message,
    });
  }
};

module.exports = { updateSemInfo, updateCredits };