const supabase = require("../../supabaseClient");

const updateSemInfo = async(req,res) => {
    const { semData } = req.body;

  try {
    for (const row of semData) {
      const updates = {};

      if (row.theory_courses !== null && row.theory_courses !== "")
        updates.theory_courses = row.theory_courses;
      if (row.practical_courses !== null && row.practical_courses !== "")
        updates.practical_courses = row.practical_courses;
      if (row.mandatory_courses !== null && row.mandatory_courses !== "")
        updates.mandatory_courses = row.mandatory_courses; // New update
      if (row.total_credits !== null && row.total_credits !== "")
        updates.total_credits = row.total_credits;

      if (Object.keys(updates).length > 0) {
        const { data, error } = await supabase
          .from("seminfo")
          .update(updates)
          .eq("sem_no", row.sem_no)
          .select();

        if (error) {
          console.error("Supabase update error:", error);
          return res.status(500).json({
            success: false,
            message: "Failed to update semester information.",
            error: error.message,
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
}

const updateCredits = async(req,res) =>{
    const { creditsData } = req.body;

  if (!creditsData || creditsData.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No credits data provided. Existing data remains unchanged.",
    });
  }

  try {
    // First, delete existing credits for the semesters being updated
    const semesterNumbers = [...new Set(creditsData.map((item) => item.sem_no))];

    const { error: deleteError } = await supabase
      .from("credits")
      .delete()
      .in("sem_no", semesterNumbers);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return res.status(500).json({
        success: false,
        message: "Failed to prepare credits information.",
        error: deleteError.message,
      });
    }

    // Modify creditsData to ensure unique serial_no across all entries
    let globalSerialNo = 1;
    const processedCreditsData = creditsData.flatMap((semester) => {
      const theoryRows = Array.from(
        { length: parseInt(semester.theory_courses) || 0 },
        () => ({
          sem_no: semester.sem_no,
          category: "theory",
          serial_no: globalSerialNo++,
        })
      );

      const practicalRows = Array.from(
        { length: parseInt(semester.practical_courses) || 0 },
        () => ({
          sem_no: semester.sem_no,
          category: "practical",
          serial_no: globalSerialNo++,
        })
      );

      return [...theoryRows, ...practicalRows];
    });

    // Insert processed credits data
    const { error: insertError } = await supabase
      .from("credits")
      .insert(processedCreditsData);

    if (insertError) {
      console.error("Supabase credits insert error:", insertError);
      return res.status(500).json({
        success: false,
        message: "Failed to insert credits information.",
        error: insertError.message,
      });
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
}

module.exports = {updateSemInfo, updateCredits}