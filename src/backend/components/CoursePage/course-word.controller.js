const supabase = require("../../supabaseClient");
const docx = require("docx");
const { Document, Paragraph, Table, TableRow, TableCell, HeadingLevel, BorderStyle, AlignmentType, TextRun, WidthType, TableLayoutType, VerticalAlign } = docx;
const fs = require("fs");
const path = require("path");


// Get data for all semesters
const getAllSemestersData = async (req, res) => {
  try {
    const allSemestersData = [];
    
    // Fetch data for each semester (1-8)
    for (let semNo = 1; semNo <= 8; semNo++) {
      // Get semester info
      const { data: semInfo, error: semInfoError } = await supabase
        .from("seminfo")
        .select("*")
        .eq("sem_no", semNo)
        .single();
      
      if (semInfoError) throw semInfoError;
      
      // Get courses for this semester
      const { data: courses, error: coursesError } = await supabase
        .from("credits")
        .select("*")
        .eq("sem_no", semNo)
        .order("serial_no");
      
      if (coursesError) throw coursesError;
      
      allSemestersData.push({
        semNo,
        semInfo: {
          ...semInfo,
          mandatory_courses: semInfo.mandatory_courses || 0
        },
        courses
      });
    }
    
    res.json(allSemestersData);
  } catch (error) {
    console.error("Error fetching all semesters data:", error);
    res.status(500).json({ error: "Failed to fetch all semesters data" });
  }
};

// Export all courses data to Word document
const exportToWord = async (req, res) => {
  try {
    // Fetch all semesters data
    const allSemestersData = [];
    
    for (let semNo = 1; semNo <= 8; semNo++) {
      // Get semester info
      const { data: semInfo, error: semInfoError } = await supabase
        .from("seminfo")
        .select("*")
        .eq("sem_no", semNo)
        .single();
      
      if (semInfoError) throw semInfoError;
      
      // Get courses for this semester
      const { data: courses, error: coursesError } = await supabase
        .from("credits")
        .select("*")
        .eq("sem_no", semNo)
        .order("category", {ascending: true})
        .order("serial_no");
      
      if (coursesError) throw coursesError;
      
      allSemestersData.push({
        semNo,
        semInfo,
        courses
      });
    }
    
    // Create new Word document
    const doc = new Document({
      sections: [{
        properties: {},
        children: generateWordContent(allSemestersData),
      }],
      styles: {
        paragraphStyles: [
          {
            id: "courseTitle",
            name: "Course Title",
            basedOn: "Normal",
            run: {
              size: 24,
              bold: true,
            },
            paragraph: {
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 200 },
            },
          },
          {
            id: "semesterHeading",
            name: "Semester Heading",
            basedOn: "Normal",
            run: {
              size: 22,
              bold: true,
            },
            paragraph: {
              spacing: { before: 200, after: 100 },
            },
          },
          {
            id: "footnote",
            name: "Footnote",
            basedOn: "Normal",
            run: {
              size: 16,
              italics: true,
            },
            paragraph: {
              spacing: { before: 100, after: 100 },
            },
          },
        ],
      },
    });
    
    // Create temp file path
    const tempFilePath = path.join(__dirname, 'temp_course_structure.docx');
    
    // Write document to file
    const buffer = await docx.Packer.toBuffer(doc);
    fs.writeFileSync(tempFilePath, buffer);
    
    // Send file to client
    res.download(tempFilePath, 'Course_Structure.docx', (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).send("Error generating Word document");
      }
      
      // Delete temp file after sending
      fs.unlinkSync(tempFilePath);
    });
  } catch (error) {
    console.error("Error exporting to Word:", error);
    res.status(500).json({ error: "Failed to export data to Word" });
  }
};

// Helper function to generate Word document content
function generateWordContent(allSemestersData) {
  const docElements = [];
  
  // Add title
  docElements.push(
    new Paragraph({
      text: "BE COMPUTER SCIENCE AND ENGINEERING",
      style: "courseTitle",
    })
  );
  
  docElements.push(
    new Paragraph({
      text: "Courses of Study and Scheme of Assessment",
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 200,
      },
    })
  );
  
  // For each semester
  allSemestersData.forEach((semester) => {
    addSemesterContent(docElements, semester);
    
    // Add page break after each semester
    if (semester.semNo < 8) {
      docElements.push(new Paragraph({
        text: "",
        pageBreakBefore: true,
      }));
    }
  });
  
  return docElements;
}

// Helper function to add semester content to document
function addSemesterContent(docElements, semesterData) {
  // Add semester heading
  docElements.push(
    new Paragraph({
      text: `SEMESTER ${semesterData.semNo}`,
      style: "semesterHeading",
    })
  );
  
  // Create one unified table for the semester
  const tableRows = [];
  
  // Create header rows
  tableRows.push(
    new TableRow({
      tableHeader: true,
      height: {
        value: 400,
        rule: docx.HeightRule.EXACT,
      },
      children: [
        createTableCell("S.No", { rowSpan: 2, verticalAlign: VerticalAlign.CENTER }),
        createTableCell("Course Code", { rowSpan: 2, verticalAlign: VerticalAlign.CENTER }),
        createTableCell("Course Title", { rowSpan: 2, verticalAlign: VerticalAlign.CENTER }),
        createTableCell("Hours / Week", { colSpan: 3 }),
        createTableCell("Credits", { rowSpan: 2, verticalAlign: VerticalAlign.CENTER }),
        createTableCell("Maximum Marks", { colSpan: 3 }),
        createTableCell("CAT", { rowSpan: 2, verticalAlign: VerticalAlign.CENTER }),
      ],
    })
  );
  
  tableRows.push(
    new TableRow({
      tableHeader: true,
      height: {
        value: 400,
        rule: docx.HeightRule.EXACT,
      },
      children: [
        // These cells are for the second row under "Hours / Week"
        createTableCell("Lecture"),
        createTableCell("Tutorial"),
        createTableCell("Practical"),
        // These cells are for the second row under "Maximum Marks"
        createTableCell("CA"),
        createTableCell("FE"),
        createTableCell("Total"),
      ],
    })
  );
  
  // Process each category: Theory, Practical, Mandatory
  let serialNo = 0;
  
  // Add THEORY section
  tableRows.push(
    new TableRow({
      children: [
        createTableCell("THEORY", { colSpan: 11, shading: { fill: "E6E6E6" } }),
      ],
    })
  );
  
  // Add Theory courses
  const theoryCourses = semesterData.courses.filter(course => 
    course.category?.toLowerCase() === "theory"
  );
  
  theoryCourses.forEach(course => {
    serialNo++;
    tableRows.push(createCourseRow(course, serialNo));
  });
  
  // Add PRACTICALS section
  tableRows.push(
    new TableRow({
      children: [
        createTableCell("PRACTICALS", { colSpan: 11, shading: { fill: "E6E6E6" } }),
      ],
    })
  );
  
  // Add Practical courses
  const practicalCourses = semesterData.courses.filter(course => 
    course.category?.toLowerCase() === "practical"
  );
  
  practicalCourses.forEach(course => {
    serialNo++;
    tableRows.push(createCourseRow(course, serialNo));
  });
  
  // Add MANDATORY COURSES section
  tableRows.push(
    new TableRow({
      children: [
        createTableCell("MANDATORY COURSES", { colSpan: 11, shading: { fill: "E6E6E6" } }),
      ],
    })
  );
  
  // Add Mandatory courses
  const mandatoryCourses = semesterData.courses.filter(course => 
    course.category?.toLowerCase() === "mandatory"
  );
  
  mandatoryCourses.forEach(course => {
    serialNo++;
    tableRows.push(createCourseRow(course, serialNo));
  });
  
  // Calculate semester totals
  const totalLecture = semesterData.courses.reduce((sum, course) => sum + (course.lecture || 0), 0);
  const totalTutorial = semesterData.courses.reduce((sum, course) => sum + (course.tutorial || 0), 0);
  const totalPractical = semesterData.courses.reduce((sum, course) => sum + (course.practical || 0), 0);
  const totalCredits = semesterData.courses.reduce((sum, course) => sum + (course.credits || 0), 0);
  const totalCA = semesterData.courses.reduce((sum, course) => sum + (course.ca_marks || 0), 0);
  const totalFE = semesterData.courses.reduce((sum, course) => sum + (course.fe_marks || 0), 0);
  const totalMarks = semesterData.courses.reduce((sum, course) => sum + (course.total_marks || 0), 0);
  
  // Add totals row
  tableRows.push(
    new TableRow({
      children: [
        createTableCell(`Total ${semesterData.semInfo?.hours || ''} hrs`, { colSpan: 2, shading: { fill: "F2F2F2" } }),
        createTableCell("", { shading: { fill: "F2F2F2" } }),
        createTableCell(String(totalLecture), { shading: { fill: "F2F2F2" } }),
        createTableCell(String(totalTutorial), { shading: { fill: "F2F2F2" } }),
        createTableCell(String(totalPractical), { shading: { fill: "F2F2F2" } }),
        createTableCell(String(totalCredits), { shading: { fill: "F2F2F2" } }),
        createTableCell(String(totalCA), { shading: { fill: "F2F2F2" } }),
        createTableCell(String(totalFE), { shading: { fill: "F2F2F2" } }),
        createTableCell(String(totalMarks), { shading: { fill: "F2F2F2" } }),
        createTableCell("", { shading: { fill: "F2F2F2" } }),
      ],
    })
  );
  
  // Create and add table to document
  const table = new Table({
    rows: tableRows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      all: {
        style: BorderStyle.SINGLE,
        size: 1,
      },
    },
    layout: TableLayoutType.FIXED,
  });
  
  docElements.push(table);
  
  // Add legend
  docElements.push(
    new Paragraph({
      text: "CAT - Category; BS - Basic Science; HS - Humanities and Social Sciences; ES - Engineering Sciences; PC - Professional Core; PE - Professional Elective; OE - Open Elective; EEC - Employability Enhancement Course; MC - Mandatory Course",
      style: "footnote",
    })
  );
}

// Helper function to create a table cell
function createTableCell(text, options = {}) {
  const cellOptions = {
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text,
            bold: options.bold || false,
          }),
        ],
        alignment: options.alignment || AlignmentType.CENTER,
      }),
    ],
    verticalAlign: options.verticalAlign || VerticalAlign.CENTER,
  };
  
  // Add shading if provided
  if (options.shading) {
    cellOptions.shading = options.shading;
  }
  
  // Add colSpan if provided
  if (options.colSpan) {
    cellOptions.columnSpan = options.colSpan;
  }
  
  // Add rowSpan if provided
  if (options.rowSpan) {
    cellOptions.rowSpan = options.rowSpan;
  }
  
  return new TableCell(cellOptions);
}

// Helper function to create a row for a course
function createCourseRow(course, serialNo) {
  return new TableRow({
    children: [
      createTableCell(String(serialNo)),
      createTableCell(course.course_code || ""),
      createTableCell(course.course_name || "", { alignment: AlignmentType.LEFT }),
      createTableCell(String(course.lecture || (course.category?.toLowerCase() === "mandatory" ? "-" : "0"))),
      createTableCell(String(course.tutorial || (course.category?.toLowerCase() === "mandatory" ? "-" : "0"))),
      createTableCell(String(course.practical || (course.category?.toLowerCase() === "mandatory" ? "-" : "0"))),
      createTableCell(course.category?.toLowerCase() === "mandatory" && !course.credits ? "Grade" : String(course.credits || "0")),
      createTableCell(String(course.ca_marks || (course.category?.toLowerCase() === "mandatory" ? "-" : "0"))),
      createTableCell(String(course.fe_marks || (course.category?.toLowerCase() === "mandatory" ? "-" : "0"))),
      createTableCell(String(course.total_marks || (course.category?.toLowerCase() === "mandatory" ? "-" : "0"))),
      createTableCell(course.type || ""),
    ],
  });
}


// const courseDetailsInfo = async (req, res) => {
//   try {
//     const { department, degree } = req.query;
    
//     if (!department || !degree) {
//       return res.status(400).json({ error: "Department and degree parameters are required" });
//     }
    
//     // Query regular courses
//     const { data, error } = await supabase
//       .from("credits")
//       .select(`
//         sem_no,
//         serial_no,
//         course_name,
//         course_details:course_details(*),
//         textbooks:textbooks(*),
//         references:refs(*)
//       `)
//       .eq("department", department)
//       .eq("degree", degree)
//       .order("sem_no", { ascending: true })
//       .order("serial_no", { ascending: true });
    
//     if (error) {
//       console.error("Error fetching filtered courses:", error);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }
    
//     // Query lab courses
//     const { data: labData, error: labError } = await supabase
//       .from("labcourse_details")
//       .select("*")
//       .eq("department", department)
//       .eq("degree", degree);
//     // console.log(labData);
      
//     if (labError) {
//       console.error("Error fetching lab courses:", labError);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }
    
//     // Process regular course data
//     const courseDetailsMap = {};
    
//     for (const course of data) {
//       // Fetch timing data
//       const { data: timingData, error: timingError } = await supabase
//         .from("timings")
//         .select("*")
//         .eq("course_name", course.course_name)
//         .single();
      
//       if (timingError && timingError.code !== "PGRST116") {
//         console.error(`Error fetching timing data for ${course.course_name}:`, timingError);
//       }
      
//       courseDetailsMap[course.course_name] = {
//         co: course.course_details || [],
//         hours: timingData
//           ? {
//               lecture: [
//                 timingData.hour1_1, 
//                 timingData.hour1_2, 
//                 timingData.hour1_3, 
//                 timingData.hour1_4, 
//                 timingData.hour1_5
//               ],
//               tutorial: [
//                 timingData.hour2_1, 
//                 timingData.hour2_2, 
//                 timingData.hour2_3, 
//                 timingData.hour2_4, 
//                 timingData.hour2_5
//               ],
//               outcomes: [
//                 timingData.outcome1,
//                 timingData.outcome2,
//                 timingData.outcome3,
//                 timingData.outcome4,
//                 timingData.outcome5
//               ],
//               total: timingData.total_hours
//             }
//           : null,
//         textbooks: course.textbooks || [],
//         references: course.references || [],
//         isLabCourse: false
//       };
//     }
    
//     // Add lab courses to the map
//     for (const labCourse of labData) {
//       courseDetailsMap[labCourse.course_name] = {
//         description: labCourse.description,
//         isLabCourse: true,
//         // Add any other lab-specific fields here
//       };
//     }
//     // console.log(courseDetailsMap)
//     res.json(courseDetailsMap);
//   } catch (err) {
//     console.error("Unexpected error:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };


const courseDetailsInfo = async (req, res) => {
  try {
    const { department, degree } = req.query;

    if (!department || !degree) {
      return res.status(400).json({ error: "Department and degree parameters are required" });
    }

    // Query regular courses
    const { data, error } = await supabase
      .from("credits")
      .select(`
        sem_no,
        serial_no,
        course_name,
        course_details:course_details(*),
        textbooks:textbooks(*),
        references:refs(*)
      `)
      .eq("department", department)
      .eq("degree", degree)
      .order("sem_no", { ascending: true })
      .order("serial_no", { ascending: true });

    if (error) {
      console.error("Error fetching filtered courses:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Query lab courses
    const { data: labData, error: labError } = await supabase
      .from("labcourse_details")
      .select("*")
      .eq("department", department)
      .eq("degree", degree);

    if (labError) {
      console.error("Error fetching lab courses:", labError);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const courseDetailsMap = {};

    // Process regular course data
    for (const course of data) {
      // Fetch timing data
      const { data: timingData, error: timingError } = await supabase
        .from("timings")
        .select("*")
        .eq("course_name", course.course_name)
        .single();

      if (timingError && timingError.code !== "PGRST116") {
        console.error(`Error fetching timing data for ${course.course_name}:`, timingError);
      }

      courseDetailsMap[course.course_name] = {
        co: course.course_details || [],
        hours: timingData
          ? {
              lecture: [
                timingData.hour1_1,
                timingData.hour1_2,
                timingData.hour1_3,
                timingData.hour1_4,
                timingData.hour1_5
              ],
              tutorial: [
                timingData.hour2_1,
                timingData.hour2_2,
                timingData.hour2_3,
                timingData.hour2_4,
                timingData.hour2_5
              ],
              outcomes: [
                timingData.outcome1,
                timingData.outcome2,
                timingData.outcome3,
                timingData.outcome4,
                timingData.outcome5
              ],
              total: timingData.total_hours
            }
          : null,
        textbooks: course.textbooks || [],
        references: course.references || [],
        isLabCourse: false
      };
    }

    // Add lab courses to the map along with references
    for (const labCourse of labData) {
      // Fetch references for lab courses
      const { data: labReferences, error: labRefError } = await supabase
        .from("refs")
        .select("*")
        .eq("course_name", labCourse.course_name)
        .eq("degree", labCourse.degree)
        .eq("department", labCourse.department);

      if (labRefError) {
        console.error(`Error fetching references for lab course ${labCourse.course_name}:`, labRefError);
      }

      courseDetailsMap[labCourse.course_name] = {
        description: labCourse.description,
        references: labReferences || [], // Adding references
        isLabCourse: true
      };
    }

    // console.log(courseDetailsMap);
    res.json(courseDetailsMap);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};




module.exports = {
  getAllSemestersData,
  exportToWord,
  courseDetailsInfo
};