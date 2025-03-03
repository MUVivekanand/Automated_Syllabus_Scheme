import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/CourseWord.css";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, BorderStyle, WidthType, 
         AlignmentType, HeadingLevel, TextRun, convertInchesToTwip, PageOrientation, 
         Footer, Header, ShadingType } from "docx";
import { saveAs } from "file-saver";

function CourseWord() {
  const [semestersData, setSemestersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const [summaryData, setSummaryData] = useState([]);
  const [totalCreditsInfo, setTotalCreditsInfo] = useState(null);
  const courseTypes = ["HS", "BS", "ES", "PC", "PE", "OE", "EEC", "MC"];
  const semesters = Array.from({ length: 8 }, (_, i) => i + 1);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllSemestersData();
    fetchAllData();
  }, []);

  const fetchAllSemestersData = async () => {
    try {
      setLoading(true);
      const semestersData = [];
      
      // Fetch data for all 8 semesters
      for (let semNo = 1; semNo <= 8; semNo++) {
        const semInfoResponse = await axios.get(`http://localhost:4000/api/course/seminfo/${semNo}`);
        const coursesResponse = await axios.get(`http://localhost:4000/api/course/courses/${semNo}`);
        
        semestersData.push({
          semNo,
          semInfo: semInfoResponse.data,
          courses: coursesResponse.data
        });
      }
      
      setSemestersData(semestersData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching all semesters data:", error);
      setError("Failed to fetch semesters data. Please try again later.");
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const semestersData = [];
      
      // Fetch data for all 8 semesters
      for (let semNo = 1; semNo <= 8; semNo++) {
        const semInfoResponse = await axios.get(`http://localhost:4000/api/course/seminfo/${semNo}`);
        const coursesResponse = await axios.get(`http://localhost:4000/api/course/courses/${semNo}`);
        
        semestersData.push({
          semNo,
          semInfo: semInfoResponse.data,
          courses: coursesResponse.data
        });
      }
      
      // Fetch credit summary data
      const [creditsSummaryResponse, totalCreditsResponse] = await Promise.all([
        axios.get("http://localhost:4000/api/summary/creditsSummary"),
        axios.get("http://localhost:4000/api/summary/getTotalCredits")
      ]);
  
      const backendSummaryData = creditsSummaryResponse.data;
      const storedTotalCredits = totalCreditsResponse.data.total_credits;
  
      // Process summary data
      const processedSummaryData = courseTypes.map((type) => {
        const typeData = { type, credits: {} };
  
        semesters.forEach((sem) => {
          const semesterCredits = backendSummaryData
            .filter((course) => course.type === type && course.sem_no === sem)
            .reduce((total, course) => total + (Number(course.credits) || 0), 0);
  
          typeData.credits[sem] = semesterCredits;
        });
  
        return typeData;
      });
      
      setSemestersData(semestersData);
      setSummaryData(processedSummaryData);
      setTotalCreditsInfo({
        expected: Number(storedTotalCredits),
        calculated: processedSummaryData.reduce(
          (sum, row) => sum + calculateRowTotal(row.credits), 
          0
        )
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data. Please try again later.");
      setLoading(false);
    }
  };
  
  // 4. Add helper functions for summary calculations
  const calculateRowTotal = (credits) => {
    return Object.values(credits).reduce((sum, credit) => sum + credit, 0);
  };
  
  const calculateColumnTotal = (semesterNum) => {
    return summaryData.reduce((sum, row) => sum + (row.credits[semesterNum] || 0), 0);
  };

  // Function to create Word document from frontend data
  const exportToWord = async () => {
    try {
      setExportLoading(true);
      
      // Create document with landscape orientation for better table display
      const doc = new Document({
        styles: {
          paragraphStyles: [
            {
              id: "Heading1",
              name: "Heading 1",
              run: {
                size: 28,
                bold: true,
                color: "000000",
                font: "Arial",
              },
              paragraph: {
                spacing: {
                  after: 120,
                },
                alignment: AlignmentType.CENTER,
              },
            },
            {
              id: "Heading2",
              name: "Heading 2",
              run: {
                size: 24,
                bold: true,
                color: "000000",
                font: "Arial",
              },
              paragraph: {
                spacing: {
                  after: 120,
                },
                alignment: AlignmentType.CENTER,
              },
            },
            {
              id: "Heading3",
              name: "Heading 3",
              run: {
                size: 20,
                bold: true,
                color: "000000",
                font: "Arial",
              },
              paragraph: {
                spacing: {
                  after: 120,
                },
              },
            },
            {
              id: "Legend",
              name: "Legend",
              run: {
                size: 16,
                font: "Arial",
              },
              paragraph: {
                spacing: {
                  before: 120,
                  after: 120,
                },
              },
            },
          ],
        },
        sections: [],
      });

      // Create one page per semester for better spacing and accurate reproduction
      for (let i = 0; i < semestersData.length; i++) {
        const semester = semestersData[i];
        const totals = calculateSemesterTotals(semester.courses);
        
        // Modified title section to match the image exactly
        const docChildren = [
          new Paragraph({
            text: "BE COMPUTER SCIENCE AND ENGINEERING",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: "Courses of Study and Scheme of Assessment",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 200,
            },
          }),
        ];
        
        // Add semester heading
        docChildren.push(
          new Paragraph({
            text: `SEMESTER ${semester.semNo}`,
            heading: HeadingLevel.HEADING_3,
            spacing: {
              before: 200,
              after: 200,
            },
          })
        );
        
        // Create table
        const tableRows = [];
        
        // Header rows
        tableRows.push(
          new TableRow({
            tableHeader: true,
            height: {
              value: 400,
              rule: "atLeast",
            },
            // children: [
            //   createTableCell("S.No", { rowSpan: 2, bold: true, shading: true, width: 100 }),
            //   createTableCell("Course Code", { rowSpan: 2, bold: true, shading: true }),
            //   createTableCell("Course Title", { rowSpan: 2, bold: true, shading: true }),
            //   createTableCell("Hours / Week", { colSpan: 3, bold: true, alignment: AlignmentType.CENTER, shading: true }),
            //   createTableCell("Credits", { rowSpan: 2, bold: true, shading: true }),
            //   createTableCell("Maximum Marks", { colSpan: 3, bold: true, alignment: AlignmentType.CENTER, shading: true }),
            //   createTableCell("CAT", { rowSpan: 2, bold: true, shading: true }),
            // ],

            children: [
              createTableCell("S.No", {bold: true, shading: true, width: 100 }),
              createTableCell("Course Code", {bold: true, shading: true }),
              createTableCell("Course Title", {bold: true, shading: true }),
              // createTableCell("Hours / Week", { colSpan: 3, bold: true, alignment: AlignmentType.CENTER, shading: true }),
              
              createTableCell("Lecture", { bold: true, shading: true }),
              createTableCell("Tutorial", { bold: true, shading: true }),
              createTableCell("Practical", { bold: true, shading: true }),

              createTableCell("Credits", {bold: true, shading: true }),
              // createTableCell("Maximum Marks", { colSpan: 3, bold: true, alignment: AlignmentType.CENTER, shading: true }),
              
              createTableCell("CA", { bold: true, shading: true }),
              createTableCell("FE", { bold: true, shading: true }),
              createTableCell("Total", { bold: true, shading: true }),

              createTableCell("CAT", {bold: true, shading: true }),
            ],
          })
        );
        
        // tableRows.push(
        //   new TableRow({
        //     tableHeader: true,
        //     height: {
        //       value: 400,
        //       rule: "atLeast",
        //     },
        //     children: [
        //       createTableCell("Lecture", { bold: true, shading: true }),
        //       createTableCell("Tutorial", { bold: true, shading: true }),
        //       createTableCell("Practical", { bold: true, shading: true }),
        //       createTableCell("CA", { bold: true, shading: true }),
        //       createTableCell("FE", { bold: true, shading: true }),
        //       createTableCell("Total", { bold: true, shading: true }),
        //     ],
        //   })
        // );
         

        
        // THEORY COURSES
        tableRows.push(
          new TableRow({
            height: {
              value: 400,
              rule: "atLeast",
            },
            children: [
              createTableCell("THEORY", { 
                colSpan: 11, 
                bold: true, 
                alignment: AlignmentType.LEFT,
                shading: false
              }),
            ],
          })
        );
        
        const theoryCourses = semester.courses.filter(
          (course) => course.category?.toLowerCase() === "theory"
        );
        
        theoryCourses.forEach((course, index) => {
          tableRows.push(
            new TableRow({
              height: {
                value: 400,
                rule: "atLeast",
              },
              children: [
                createTableCell(`${index + 1}`),
                createTableCell(course.course_code),
                createTableCell(course.course_name),
                createTableCell(`${course.lecture}`),
                createTableCell(`${course.tutorial}`),
                createTableCell(`${course.practical}`),
                createTableCell(`${course.credits}`),
                createTableCell(`${course.ca_marks}`),
                createTableCell(`${course.fe_marks}`),
                createTableCell(`${course.total_marks}`),
                createTableCell(course.type),
              ],
            })
          );
        });
        
        // PRACTICAL COURSES
        tableRows.push(
          new TableRow({
            height: {
              value: 400,
              rule: "atLeast",
            },
            children: [
              createTableCell("PRACTICALS", { 
                colSpan: 11, 
                bold: true, 
                alignment: AlignmentType.LEFT,
                shading: false
              }),
            ],
          })
        );
        
        const practicalCourses = semester.courses.filter(
          (course) => course.category?.toLowerCase() === "practical"
        );
        
        practicalCourses.forEach((course, index) => {
          tableRows.push(
            new TableRow({
              height: {
                value: 400,
                rule: "atLeast",
              },
              children: [
                createTableCell(`${theoryCourses.length + index + 1}`),
                createTableCell(course.course_code),
                createTableCell(course.course_name),
                createTableCell(`${course.lecture}`),
                createTableCell(`${course.tutorial}`),
                createTableCell(`${course.practical}`),
                createTableCell(`${course.credits}`),
                createTableCell(`${course.ca_marks}`),
                createTableCell(`${course.fe_marks}`),
                createTableCell(`${course.total_marks}`),
                createTableCell(course.type),
              ],
            })
          );
        });
        
        // MANDATORY COURSES
        tableRows.push(
          new TableRow({
            height: {
              value: 400,
              rule: "atLeast",
            },
            children: [
              createTableCell("MANDATORY COURSES", { 
                colSpan: 11, 
                bold: true, 
                alignment: AlignmentType.LEFT,
                shading: false
              }),
            ],
          })
        );
        
        const mandatoryCourses = semester.courses.filter(
          (course) => course.category?.toLowerCase() === "mandatory"
        );
        
        mandatoryCourses.forEach((course, index) => {
          tableRows.push(
            new TableRow({
              height: {
                value: 400,
                rule: "atLeast",
              },
              children: [
                createTableCell(`${theoryCourses.length + practicalCourses.length + index + 1}`),
                createTableCell(course.course_code),
                createTableCell(course.course_name),
                createTableCell(course.lecture ? `${course.lecture}` : "-"),
                createTableCell(course.tutorial ? `${course.tutorial}` : "-"),
                createTableCell(course.practical ? `${course.practical}` : "-"),
                createTableCell(course.credits ? `${course.credits}` : "Grade"),
                createTableCell(course.ca_marks ? `${course.ca_marks}` : "-"),
                createTableCell(course.fe_marks ? `${course.fe_marks}` : "-"),
                createTableCell(course.total_marks ? `${course.total_marks}` : "-"),
                createTableCell(course.type),
              ],
            })
          );
        });
        
        // SEMESTER TOTAL
        tableRows.push(
          new TableRow({
            height: {
              value: 400,
              rule: "atLeast",
            },
            children: [
              createTableCell(`Total ${totals.totalHours} hrs`, { 
                colSpan: 2, 
                bold: true,
                shading: false
              }),
              createTableCell(""),
              createTableCell(""),
              createTableCell(`${totals.totalLecture}`, { bold: true }),
              createTableCell(`${totals.totalTutorial}`, { bold: true }),
              createTableCell(`${totals.totalPractical}`, { bold: true }),
              createTableCell(`${totals.totalCredits}`, { bold: true }),
              createTableCell(`${totals.totalCAMarks}`, { bold: true }),
              createTableCell(`${totals.totalFEMarks}`, { bold: true }),
              createTableCell(`${totals.totalMarks}`, { bold: true }),
              createTableCell(""),
            ],
          })
        );
        
        // Add the table to the document
        docChildren.push(
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              all: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "000000",
              },

              insideHorizontal: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "000000",
              },
              insideVertical: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "000000",
              },

              
            },
            rows: tableRows,
          })
        );
        
        doc.addSection({
          properties: {
            page: {
              size: {
                orientation: PageOrientation.LANDSCAPE,
              },
              margin: {
                top: convertInchesToTwip(0.5),
                right: convertInchesToTwip(0.5),
                bottom: convertInchesToTwip(0.5),
                left: convertInchesToTwip(0.5),
              },
            },
          },
          children: docChildren,
        });
      }




      const summaryDocChildren = [
        new Paragraph({
          text: "Summary of Credit Distribution",
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 400,
            after: 200,
          },
        })
      ];
      
      // Create summary table
      const summaryTableRows = [];
      
      // Header row
      summaryTableRows.push(
        new TableRow({
          tableHeader: true,
          height: {
            value: 400,
            rule: "atLeast",
          },
          children: [
            createTableCell("S. No", { bold: true, shading: true }),
            createTableCell("Course Category", { bold: true, shading: true }),
            ...semesters.map(sem => createTableCell(`Sem ${sem}`, { bold: true, shading: true })),
            createTableCell("Total Credits", { bold: true, shading: true }),
          ],
        })
      );
      
      // Data rows
      summaryData.forEach((row, index) => {
        summaryTableRows.push(
          new TableRow({
            height: {
              value: 400,
              rule: "atLeast",
            },
            children: [
              createTableCell(`${index + 1}`),
              createTableCell(row.type),
              ...semesters.map(sem => createTableCell(`${row.credits[sem] || 0}`)),
              createTableCell(`${calculateRowTotal(row.credits)}`),
            ],
          })
        );
      });
      
      // Total row
      summaryTableRows.push(
        new TableRow({
          height: {
            value: 400,
            rule: "atLeast",
          },
          children: [
            createTableCell(""),
            createTableCell("TOTAL", { colSpan: 2, bold: true }),
            ...semesters.map(sem => createTableCell(`${calculateColumnTotal(sem)}`, { bold: true })),
            createTableCell(`${totalCreditsInfo.calculated}`, { bold: true }),
          ],
        })
      );
      
      // Add the summary table to the document
      summaryDocChildren.push(
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          borders: {
            all: {
              style: BorderStyle.SINGLE,
              size: 1,
              color: "000000",
            },
          },
          rows: summaryTableRows,
        })
      );
      
      // Add this as the last section to the document 
      doc.addSection({
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.5),
            },
          },
        },
        children: summaryDocChildren,
      });









      // Generate the document and save it
      Packer.toBlob(doc).then((blob) => {
        saveAs(blob, "Course_Structure.docx");
        setExportLoading(false);
      });
    } catch (error) {
      console.error("Error exporting to Word:", error);
      setError("Failed to export data to Word. Please try again later.");
      setExportLoading(false);
    }
  };

  // Helper function to create a table cell with formatting options
  const createTableCell = (text, options = {}) => {
    const cellOptions = {
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: text || "",
              bold: options.bold || false,
              size: 18,
              font: "Arial",
            }),
          ],
          alignment: options.alignment || AlignmentType.CENTER,
        }),
      ],
      rowSpan: options.rowSpan,
      colSpan: options.colSpan,
      margins: {
        top: 70,
        bottom: 70,
        left: 70,
        right: 70,
      },
      verticalAlign: options.verticalAlign || "center",
    };

    // Add width if specified
    if (options.width) {
      cellOptions.width = {
        size: options.width,
        type: WidthType.DXA, // or WidthType.PERCENTAGE for relative width
      };
    }
    
    // Add shading if specified
    if (options.shading) {
      cellOptions.shading = {
        type: ShadingType.CLEAR,
        color: "F2F2F2",
        fill: "F2F2F2",
      };
    }
    
    return new TableCell(cellOptions);
  };

  const navigateBack = () => {
    navigate('/syllabus');
  };

  if (loading) {
    return <div className="loading">Loading semesters data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Calculate totals for each semester
  const calculateSemesterTotals = (courses) => {
    const totalCredits = courses.reduce((acc, course) => acc + (course.credits || 0), 0);
    const totalLecture = courses.reduce((acc, course) => acc + (course.lecture || 0), 0);
    const totalTutorial = courses.reduce((acc, course) => acc + (course.tutorial || 0), 0);
    const totalPractical = courses.reduce((acc, course) => acc + (course.practical || 0), 0);
    const totalCAMarks = courses.reduce((acc, course) => acc + (course.ca_marks || 0), 0);
    const totalFEMarks = courses.reduce((acc, course) => acc + (course.fe_marks || 0), 0);
    const totalMarks = courses.reduce((acc, course) => acc + (course.total_marks || 0), 0);
    const totalHours = totalLecture + totalTutorial + totalPractical;
    
    return {
      totalCredits,
      totalLecture,
      totalTutorial,
      totalPractical,
      totalCAMarks,
      totalFEMarks,
      totalMarks,
      totalHours
    };
  };

  return (
    <div className="course-word-container">
      <h1>BE COMPUTER SCIENCE AND ENGINEERING</h1>
      <h2>Courses of Study and Scheme of Assessment</h2>
      <div className="action-buttons">
        <button onClick={exportToWord} disabled={exportLoading}>
          {exportLoading ? "Exporting..." : "Export to Word"}
        </button>
        <button onClick={navigateBack}>Back to Course Page</button>
      </div>

      {semestersData.map((semester) => {
        const totals = calculateSemesterTotals(semester.courses);
        
        return (
          <div key={semester.semNo} className="semester-section">
            <h3>SEMESTER {semester.semNo}</h3>
            
            <table className="courses-table">
              <thead>
                <tr>
                  <th rowSpan="2">S.No</th>
                  <th rowSpan="2">Course Code</th>
                  <th rowSpan="2">Course Title</th>
                  <th colSpan="3">Hours / Week</th>
                  <th rowSpan="2">Credits</th>
                  <th colSpan="3">Maximum Marks</th>
                  <th rowSpan="2">CAT</th>
                </tr>
                <tr>
                  <th>Lecture</th>
                  <th>Tutorial</th>
                  <th>Practical</th>
                  <th>CA</th>
                  <th>FE</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {/* THEORY COURSES */}
                <tr className="category-header">
                  <td colSpan="11">THEORY</td>
                </tr>
                {semester.courses
                  .filter((course) => course.category?.toLowerCase() === "theory")
                  .map((course, index) => (
                    <tr key={`theory-${index}`}>
                      <td>{index + 1}</td>
                      <td>{course.course_code}</td>
                      <td>{course.course_name}</td>
                      <td>{course.lecture}</td>
                      <td>{course.tutorial}</td>
                      <td>{course.practical}</td>
                      <td>{course.credits}</td>
                      <td>{course.ca_marks}</td>
                      <td>{course.fe_marks}</td>
                      <td>{course.total_marks}</td>
                      <td>{course.type}</td>
                    </tr>
                  ))}

                {/* PRACTICAL COURSES */}
                <tr className="category-header">
                  <td colSpan="11">PRACTICALS</td>
                </tr>
                {semester.courses
                  .filter((course) => course.category?.toLowerCase() === "practical")
                  .map((course, index) => (
                    <tr key={`practical-${index}`}>
                      <td>{semester.courses.filter(c => c.category?.toLowerCase() === "theory").length + index + 1}</td>
                      <td>{course.course_code}</td>
                      <td>{course.course_name}</td>
                      <td>{course.lecture}</td>
                      <td>{course.tutorial}</td>
                      <td>{course.practical}</td>
                      <td>{course.credits}</td>
                      <td>{course.ca_marks}</td>
                      <td>{course.fe_marks}</td>
                      <td>{course.total_marks}</td>
                      <td>{course.type}</td>
                    </tr>
                  ))}

                {/* MANDATORY COURSES */}
                <tr className="category-header">
                  <td colSpan="11">MANDATORY COURSES</td>
                </tr>
                {semester.courses
                  .filter((course) => course.category?.toLowerCase() === "mandatory")
                  .map((course, index) => (
                    <tr key={`mandatory-${index}`}>
                      <td>
                        {semester.courses.filter(c => c.category?.toLowerCase() === "theory" || c.category?.toLowerCase() === "practical").length + index + 1}
                      </td>
                      <td>{course.course_code}</td>
                      <td>{course.course_name}</td>
                      <td>{course.lecture || "-"}</td>
                      <td>{course.tutorial || "-"}</td>
                      <td>{course.practical || "-"}</td>
                      <td>{course.credits || "Grade"}</td>
                      <td>{course.ca_marks || "-"}</td>
                      <td>{course.fe_marks || "-"}</td>
                      <td>{course.total_marks || "-"}</td>
                      <td>{course.type}</td>
                    </tr>
                  ))}

                {/* SEMESTER TOTAL */}
                <tr className="semester-total">
                  <td colSpan="2">Total {totals.totalHours} hrs</td>
                  <td></td>
                  <td>{totals.totalLecture}</td>
                  <td>{totals.totalTutorial}</td>
                  <td>{totals.totalPractical}</td>
                  <td>{totals.totalCredits}</td>
                  <td>{totals.totalCAMarks}</td>
                  <td>{totals.totalFEMarks}</td>
                  <td>{totals.totalMarks}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            
            {/* <div className="category-legend">
              <p>
                CAT - Category; BS - Basic Science; HS - Humanities and Social Sciences; ES - Engineering Sciences; PC - Professional Core; 
                PE - Professional Elective; OE - Open Elective; EEC - Employability Enhancement Course; MC - Mandatory Course
              </p>
            </div> */}
          </div>
        );
      })}

{totalCreditsInfo && (
  <div className="summary-section">
    <h2>Summary of Credit Distribution</h2>
    {totalCreditsInfo.expected !== totalCreditsInfo.calculated && (
      <div className="error-banner">
        Warning: Total credits mismatch! 
        Expected: {totalCreditsInfo.expected}, 
        Calculated: {totalCreditsInfo.calculated}
      </div>
    )}
    <table className="summary-table">
      <thead>
        <tr>
          <th>S. No</th>
          <th>Course Category</th>
          {semesters.map((sem) => (
            <th key={sem}>Sem {sem}</th>
          ))}
          <th>Total Credits</th>
        </tr>
      </thead>
      <tbody>
        {summaryData.map((row, index) => (
          <tr key={row.type}>
            <td>{index + 1}</td>
            <td>{row.type}</td>
            {semesters.map((sem) => (
              <td key={sem}>{row.credits[sem] || 0}</td>
            ))}
            <td>{calculateRowTotal(row.credits)}</td>
          </tr>
        ))}
        <tr className="total-row">
          <td colSpan="2">Total Credits per Semester</td>
          {semesters.map((sem) => (
            <td key={sem}>{calculateColumnTotal(sem)}</td>
          ))}
          <td>
            {summaryData.reduce((sum, row) => sum + calculateRowTotal(row.credits), 0)}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
)}

    </div>

    
  );
}

export default CourseWord;