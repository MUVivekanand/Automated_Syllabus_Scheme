const supabase = require("../../supabaseClient");

// GET endpoint to fetch semester info
const getSemInfo = async (req, res) => {
  const { degree, department } = req.query;

  if (!degree || !department) {
    return res.status(400).json({
      success: false,
      message: "Degree and department are required parameters",
    });
  }

  try {
    // Choose table based on degree
    const tableName = degree === "M.E" ? "seminfome" : "seminfo";

    // Query the appropriate table
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("degree", degree)
      .eq("department", department);

    if (error) {
      console.error(`Supabase ${tableName} query error:`, error);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch semester information from ${tableName}.`,
        error: error.message,
      });
    }

    res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("Unexpected error while fetching SemesterInfo:", error);
    res.status(500).json({
      success: false,
      message: "Unexpected error occurred.",
      error: error.message,
    });
  }
};

const updateSemInfo = async (req, res) => {
  const { semData } = req.body;

  try {
    for (const row of semData) {
      // Ensure required fields exist.
      if (!row.degree || !row.department) {
        continue; // Skip rows missing degree or department.
      }

      // Choose the appropriate table based on degree.
      const tableName = row.degree === "M.E" ? "seminfome" : "seminfo";

      // Check if a record with the same sem_no and department exists.
      const { data: existingData, error: queryError } = await supabase
        .from(tableName)
        .select("*")
        .eq("sem_no", row.sem_no)
        .eq("department", row.department)
        .maybeSingle();

      if (queryError) {
        console.error(`Supabase ${tableName} query error:`, queryError);
        continue;
      }

      if (existingData) {
        // If the record exists, only update if data has changed.
        if (
          existingData.theory_courses === row.theory_courses &&
          existingData.practical_courses === row.practical_courses &&
          existingData.mandatory_courses === row.mandatory_courses &&
          existingData.total_credits === row.total_credits
        ) {
          // No changes detected; skip this row.
          continue;
        }

        // Update the existing record.
        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            theory_courses: row.theory_courses,
            practical_courses: row.practical_courses,
            mandatory_courses: row.mandatory_courses,
            total_credits: row.total_credits,
          })
          .eq("sem_no", row.sem_no)
          .eq("department", row.department);

        if (updateError) {
          console.error(`Supabase ${tableName} update error:`, updateError);
          return res.status(500).json({
            success: false,
            message: `Failed to update semester information in ${tableName}.`,
            error: updateError.message,
          });
        }
      } else {
        // Record not found; insert as new.
        const { error: insertError } = await supabase
          .from(tableName)
          .insert([row]);

        if (insertError) {
          console.error(`Supabase ${tableName} insert error:`, insertError);
          return res.status(500).json({
            success: false,
            message: `Failed to insert new semester information in ${tableName}.`,
            error: insertError.message,
          });
        }
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


// const updateCredits = async (req, res) => {
//   const { creditsData } = req.body;

//   if (!creditsData || creditsData.length === 0) {
//     return res.status(200).json({
//       success: true,
//       message: "No credits data provided. Existing data remains unchanged.",
//     });
//   }

//   try {
//     // Get unique combinations of sem_no, degree, and department
//     const semCombinations = [...new Set(creditsData.map(item => 
//       `${item.sem_no}-${item.degree || ''}-${item.department || ''}`
//     ))].map(combo => {
//       const [sem_no, degree, department] = combo.split('-');
//       return { sem_no: parseInt(sem_no), degree, department };
//     });

//     // Process data for each semester with degree and department info
//     let processedCreditsData = [];
    
//     for (const { sem_no, degree, department } of semCombinations) {
//       const semesterItems = creditsData.filter(item => 
//         item.sem_no === sem_no && 
//         item.degree === degree && 
//         item.department === department
//       );
      
//       if (semesterItems.length === 0) continue;
      
//       // Get the first item to access course counts
//       const firstItem = semesterItems[0];
      
//       // Skip if createOnly flag is set (meaning only create new records, don't update)
//       const createOnly = firstItem.createOnly === true;
      
//       // Create a unique identifier for this combination
//       const comboId = `${sem_no}-${degree}-${department}`;
      
//       // Check for existing credits to avoid duplicates
//       const { data: existingCredits, error: queryError } = await supabase
//         .from("credits")
//         .select("course_name, category, serial_no")
//         .eq("sem_no", sem_no)
//         .eq("degree", degree)
//         .eq("department", department);
        
//       if (queryError) {
//         console.error("Supabase credits query error:", queryError);
//         continue; // Skip this combination on error
//       }
      
//       // Filter existing credits by category
//       const existingTheory = existingCredits?.filter(item => item.category === "theory") || [];
//       const existingPractical = existingCredits?.filter(item => item.category === "practical") || [];
      
//       // Calculate how many new courses to add
//       const theoryToAdd = Math.max(0, parseInt(firstItem.theory_courses) || 0 - existingTheory.length);
//       const practicalToAdd = Math.max(0, parseInt(firstItem.practical_courses) || 0 - existingPractical.length);
      
//       if (theoryToAdd <= 0 && practicalToAdd <= 0) {
//         // No new courses needed
//         continue;
//       }
      
//       // Create new theory courses (only add if needed)
//       const theoryRows = Array.from(
//         { length: theoryToAdd },
//         (_, i) => ({
//           course_name: `T-${comboId}-${existingTheory.length + i + 1}`, // Unique course_name
//           sem_no: sem_no,
//           category: "theory",
//           serial_no: existingTheory.length + i + 1,
//           degree: degree,
//           department: department
//         })
//       );

//       // Create new practical courses (only add if needed)
//       const practicalRows = Array.from(
//         { length: practicalToAdd },
//         (_, i) => ({
//           course_name: `P-${comboId}-${existingPractical.length + i + 1}`, // Unique course_name
//           sem_no: sem_no,
//           category: "practical",
//           serial_no: existingTheory.length + theoryToAdd + existingPractical.length + i + 1,
//           degree: degree,
//           department: department
//         })
//       );
      
//       // Add new rows to processed data
//       processedCreditsData = [...processedCreditsData, ...theoryRows, ...practicalRows];
//     }

//     // Insert new data only, no deletion
//     if (processedCreditsData.length > 0) {
//       const { error: insertError } = await supabase
//         .from("credits")
//         .insert(processedCreditsData);
        
//       if (insertError) {
//         console.error("Supabase insert error for credits:", insertError);
//         return res.status(500).json({
//           success: false,
//           message: "Failed to update credits information.",
//           error: insertError.message,
//         });
//       }
//     }

//     res.status(200).json({
//       success: true,
//       message: "Credits information updated successfully.",
//     });
//   } catch (error) {
//     console.error("Unexpected error while updating Credits:", error);
//     res.status(500).json({
//       success: false,
//       message: "Unexpected error occurred.",
//       error: error.message,
//     });
//   }
// };

module.exports = { getSemInfo, updateSemInfo };