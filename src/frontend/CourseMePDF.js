import React, { useState, useEffect} from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/CourseWord.css";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, BorderStyle, WidthType, 
         AlignmentType, HeadingLevel, TextRun, convertInchesToTwip, PageOrientation, 
         Footer, Header, ShadingType } from "docx";
import { saveAs } from "file-saver";

function CourseMePDF() {

  // Add this at the top of your state declarations in CourseMe.js
  const API_BASE_URL = "http://localhost:4000/api/proelective";

  const [semestersData, setSemestersData] = useState([]);
  const [coursesData, setCoursesData] = useState({}); // Added missing state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const [professionalElectives, setProfessionalElectives] = useState([]);

  const [summaryData, setSummaryData] = useState([]);
  const [totalCreditsInfo, setTotalCreditsInfo] = useState(null);
  const courseTypes = ["HS", "BS", "ES", "PC", "PE", "OE", "EEC", "MC"];
  const semesters = Array.from({ length: 4 }, (_, i) => i + 1);
  
  const navigate = useNavigate();
  
  // Get URL parameters
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const degree = searchParams.get('degree');
  const department = searchParams.get('department');

  // In your useEffect hook, replace the fetchData function with:
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (degree && department) {
        // Fetch semester data
        const semData = await fetchAllSemestersData(degree, department);
        
        // Fetch course details
        const response = await axios.get("http://localhost:4000/api/course/courseDetailsInfo", {
          params: { degree, department }
        });
        const courseDetailsData = response.data;
        
        // Attach course details to semester data
        const enhancedSemestersData = semData.map(semester => {
          const semesterCourses = semester.courses.map(course => {
            // Find course details for this course
            const details = courseDetailsData[course.course_name] || null;
            return { ...course, courseDetails: details };
          });
          return { ...semester, courses: semesterCourses };
        });
        
        setSemestersData(enhancedSemestersData);
        console.log(enhancedSemestersData)
        
        // Fetch credit summary data
        const [creditsSummaryResponse, totalCreditsResponse] = await Promise.all([
          axios.get("http://localhost:4000/api/summary/creditsSummary", {
            params: { degree, department }
          }),
          axios.get("http://localhost:4000/api/summary/getTotalCredits", {
            params: { degree, department }
          })
        ]);
        
        const backendSummaryData = creditsSummaryResponse.data;
        const storedTotalCredits = totalCreditsResponse.data.total_credits || 0;
        
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
        
        setSummaryData(processedSummaryData);
        setTotalCreditsInfo({
          expected: Number(storedTotalCredits),
          calculated: processedSummaryData.reduce(
            (sum, row) => sum + calculateRowTotal(row.credits), 
            0
          )
        });
      } else {
        // Handle the case where params are missing
        setError("Department and degree parameters are missing");
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data. Please try again later.");
      setLoading(false);
    }
  };
  
  fetchData();
  fetchProfessionalElectives();
}, [degree, department]);

const fetchProfessionalElectives = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/getproelective`, {
      params: { degree, department }
    });
    setProfessionalElectives(response.data);
  } catch (err) {
    console.error("Error fetching professional electives:", err);
  }
};
  

  const fetchAllSemestersData = async (degree, department) => {
    try {
      const semestersData = [];
      
      // Fetch data for all 8 semesters
      for (let semNo = 1; semNo <= 4; semNo++) {
        const semInfoResponse = await axios.get(
          `http://localhost:4000/api/course/seminfo/${semNo}`, 
          { params: { degree, department } }
        );
        
        const coursesResponse = await axios.get(
          `http://localhost:4000/api/course/courses/${semNo}`, 
          { params: { degree, department } }
        );
        
        semestersData.push({
          semNo,
          semInfo: semInfoResponse.data,
          courses: coursesResponse.data
        });
      }
      
      setSemestersData(semestersData);
      return semestersData;
    } catch (error) {
      console.error("Error fetching all semesters data:", error);
      throw error;
    }
  };

  const fetchCourseDetailsForAllSemesters = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/course/courseDetailsInfo");
      return response.data;
    } catch (error) {
      console.error("Error fetching course details:", error);
      throw error;
    }
  };

  const transformCourseDetails = (courseDetailsData) => {
    const transformedData = {};
  
    Object.keys(courseDetailsData).forEach(courseName => {
      const course = courseDetailsData[courseName];
      const transformedCourse = { ...course };
  
      // Transform CO data if it exists
      if (course.co && course.co.length > 0) {
        const coData = course.co[0];
        const transformedCO = [];
        
        // Find all CO numbers by looking at co1_name, co2_name, etc.
        const coNumbers = new Set(
          Object.keys(coData)
            .filter(key => key.match(/co\d+_name/))
            .map(key => key.match(/co(\d+)_name/)[1])
        );
  
        // Create structured CO objects with hours
        Array.from(coNumbers).forEach(num => {
          transformedCO.push({
            name: `CO${num}: ${coData[`co${num}_name`]}`,
            desc: coData[`co${num}_desc`] || ""
          });
        });
  
        transformedCourse.co = transformedCO;
      } else {
        transformedCourse.co = [];
      }
  
      // Make sure hours data is properly structured
      if (course.hours) {
        transformedCourse.hours = [];
        // Assuming 5 outcomes max based on your backend data
        for (let i = 0; i < 5; i++) {
          if (course.hours.lecture[i] || course.hours.tutorial[i]) {
            transformedCourse.hours.push({
              hour1: course.hours.lecture[i] || 0,
              hour2: course.hours.tutorial[i] || 0
            });
          }
        }
      }

      transformedData[courseName] = transformedCourse;
    });
  
    return transformedData;
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
      const courseDetailsData = await fetchCourseDetailsForAllSemesters();
      const transformedCourseDetails = transformCourseDetails(courseDetailsData);

  
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

      setSemestersData(semestersData.map(semester => {
        const semesterCourses = semester.courses.map(course => {
          // Find course details for this course
          const details = transformedCourseDetails[course.course_name] || null;
          return { ...course, courseDetails: details };
        });
        return { ...semester, courses: semesterCourses };
      }));

      // console.log(semestersData);




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





const exportToPDF = async () => {
  try {
    setExportLoading(true);
    
    // Import libraries dynamically to reduce initial load time
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Define consistent margins
    const pageMargin = 10;
    const effectiveWidth = doc.internal.pageSize.width - (pageMargin * 2);
    
    // Set default font
    doc.setFont('helvetica');
    
    // Title and header for first page
    doc.setFontSize(10);
    
    doc.setFontSize(11);
    doc.text('Courses of Study and Scheme of Assessment', 20, 20);
    doc.text('ME COMPUTER SCIENCE AND ENGINEERING', 20, 25);
    
    // Add 2023 REGULATIONS text and credits info
    doc.setFontSize(9);
    doc.text('[2023 REGULATIONS]', doc.internal.pageSize.width - 20, 20, { align: 'right' });
    
    // MODIFIED: Create a single large table for all semesters
    const createCombinedTable = (startY) => {
      // Prepare table data
      const tableBody = [];
      
      // Loop through all semesters
      for (let semIndex = 0; semIndex < semestersData.length; semIndex++) {
        const semester = semestersData[semIndex];
        
        // Add SEMESTER header
        tableBody.push([{ 
          content: `SEMESTER ${semester.semNo}`, 
          colSpan: 11, 
          styles: { halign: 'left', fontStyle: 'bold' } 
        }]);
        
        // Add courses
        const courses = semester.courses;
        
        // Filter courses by category
        const theoryCourses = courses.filter(course => course.category?.toLowerCase() === "theory");
        const practicalCourses = courses.filter(course => course.category?.toLowerCase() === "practical");
        const mandatoryCourses = courses.filter(course => course.category?.toLowerCase() === "mandatory");
        
        // Add all courses in order
        courses.forEach((course, idx) => {
          tableBody.push([
            idx + 1,
            course.course_code,
            course.course_name,
            course.lecture,
            course.tutorial,
            course.practical,
            course.credits,
            course.ca_marks,
            course.fe_marks,
            course.total_marks,
            course.type
          ]);
        });
        
        // Calculate totals
        const totals = calculateSemesterTotals(courses);
        
        // Add semester total row
        const totalHours = semester.semNo === 1 ? "31" : semester.semNo === 2 ? "31" : 
                           semester.semNo === 3 ? "18" : "24"; // Based on image example
        
        tableBody.push([{
          content: `Total ${totalHours} hrs`, 
          colSpan: 2,
          styles: { fontStyle: 'bold' }
        }, '', 
          totals.totalLecture, 
          totals.totalTutorial, 
          totals.totalPractical, 
          totals.totalCredits, 
          totals.totalCAMarks, 
          totals.totalFEMarks, 
          totals.totalMarks, 
          '']);
        
        // Add spacing between semesters (empty row)
        if (semIndex < semestersData.length - 1) {
          tableBody.push([{ content: '', colSpan: 11, styles: { cellPadding: 0 } }]);
        }
      }
      
      // Create the table
      autoTable(doc, {
        startY: startY,
        head: [[
          { content: 'S.No', styles: { halign: 'center' } },
          { content: 'Course Code', styles: { halign: 'center' } },
          { content: 'Course Title', styles: { halign: 'center' } },
          { content: 'Hours / Week', colSpan: 3, styles: { halign: 'center' } },
          { content: 'Credits', styles: { halign: 'center' } },
          { content: 'Maximum Marks', colSpan: 3, styles: { halign: 'center' } },
          { content: 'CAT', styles: { halign: 'center' } }
        ], [
          '', '', '', 
          'Lecture', 'Tutorial', 'Practical', 
          '', 
          'CA', 'FE', 'Total',
          ''
        ]],
        body: tableBody,
        theme: 'grid',
        styles: { 
          fontSize: 8,
          cellPadding: 1,
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 10 },      // S.No
          1: { cellWidth: 16 },     // Course Code
          2: { cellWidth: 40 },     // Course Title
          3: { cellWidth: 12 },     // Lecture
          4: { cellWidth: 12 },     // Tutorial
          5: { cellWidth: 14 },     // Practical
          6: { cellWidth: 12 },     // Credits
          7: { cellWidth: 9 },      // CA
          8: { cellWidth: 9 },      // FE
          9: { cellWidth: 10 },     // Total
          10: { cellWidth: 10 }     // CAT
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineWidth: 0.1
        },
        willDrawCell: function(data) {
          // Create a slightly different background for each semester
          const rowData = data.row.raw;
          if (rowData && rowData[0] && typeof rowData[0] === 'object' && rowData[0].content) {
            if (rowData[0].content.includes('SEMESTER')) {
              data.cell.styles.fillColor = [240, 240, 240];
            }
          }
        },
        margin: { left: pageMargin, right: pageMargin }
      });
      
      return doc.lastAutoTable.finalY + 10;
    };
    
    // Create the combined table
    let finalY = createCombinedTable(35);
    
    // Add the category legend
    doc.setFontSize(8);
    const legendText = "CAT - Category; BS - Basic Science; HS - Humanities and Social Sciences; ES - Engineering Sciences; PC - Professional Core; PE - Professional Elective; OE - Open Elective; EEC - Employability Enhancement Course; MC - Mandatory Course";
    
    const legendLines = doc.splitTextToSize(legendText, doc.internal.pageSize.width - (pageMargin * 2));
    doc.text(legendLines, pageMargin, finalY);
    
    // Add page number
    doc.setFontSize(9);
    doc.text('103', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });

    if (professionalElectives.length > 0) {
      // Add a new page for Professional Electives
      doc.addPage();
      
      // Title for the Professional Electives section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Professional Electives', doc.internal.pageSize.width / 2, 20, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      
      // Prepare table data for Professional Electives
      const peTableBody = professionalElectives.map((item, idx) => [
        // item.id,
        item.course_code,
        item.course_name,
        item.credits,
        item.lecture,
        item.tutorial,
        item.practical,
        item.ca_marks,
        item.fe_marks,
        item.total_marks
      ]);
      
      // Calculate totals for the Professional Electives
      const peTotals = [
        '',
        'Total',
        professionalElectives.reduce((sum, item) => sum + Number(item.credits || 0), 0),
        professionalElectives.reduce((sum, item) => sum + Number(item.lecture || 0), 0),
        professionalElectives.reduce((sum, item) => sum + Number(item.tutorial || 0), 0),
        professionalElectives.reduce((sum, item) => sum + Number(item.practical || 0), 0),
        professionalElectives.reduce((sum, item) => sum + Number(item.ca_marks || 0), 0),
        professionalElectives.reduce((sum, item) => sum + Number(item.fe_marks || 0), 0),
        professionalElectives.reduce((sum, item) => sum + Number(item.total_marks || 0), 0)
      ];
      
      // Add the Professional Electives table
      autoTable(doc, {
        startY: 30,
        head: [[
          // 'ID',
          'Course Code',
          'Course Name',
          'Credits',
          'Lecture',
          'Tutorial',
          'Practical',
          'CA Marks',
          'FE Marks',
          'Total Marks'
        ]],
        body: [
          ...peTableBody,
          peTotals
        ],
        theme: 'grid',
        styles: { 
          fontSize: 8,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        columnStyles: {
          // 0: { cellWidth: 15 },      // ID
          0: { cellWidth: 20 },      // Course Code
          1: { cellWidth: 50 },      // Course Name
          2: { cellWidth: 15 },      // Credits
          3: { cellWidth: 15 },      // Lecture
          4: { cellWidth: 15 },      // Tutorial
          5: { cellWidth: 15 },      // Practical
          6: { cellWidth: 15 },      // CA Marks
          7: { cellWidth: 15 },      // FE Marks
          8: { cellWidth: 15 }       // Total Marks
        },
        headStyles: {
          fillColor: [220, 220, 220],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineWidth: 0.1
        },
        footStyles: {
          fontStyle: 'bold'
        },
        willDrawCell: function(data) {
          // Format the total row
          if (data.row.index === peTableBody.length) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        },
        margin: { left: pageMargin, right: pageMargin }
      });
      
      // Add page number
      doc.setFontSize(9);
      doc.text(String(doc.internal.getCurrentPageInfo().pageNumber), 
               doc.internal.pageSize.width / 2, 
               doc.internal.pageSize.height - 10, 
               { align: 'center' });
    }
    
    // NEXT ADD SUMMARY TABLE ON A NEW PAGE
    
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Summary of Credit Distribution', doc.internal.pageSize.width / 2, 20, { align: 'center' });
    
    const summaryTableData = summaryData.map((row, index) => [
      index + 1,
      row.type,
      ...semesters.map(sem => row.credits[sem] || 0),
      calculateRowTotal(row.credits)
    ]);
    
    autoTable(doc, {
      startY: 30,
      margin: { left: pageMargin, right: pageMargin },
      head: [
        ['S. No', 'Course Category', ...semesters.map(sem => `Sem ${sem}`), 'Total Credits']
      ],
      body: [
        ...summaryTableData,
        [
          '',
          'TOTAL',
          ...semesters.map(sem => calculateColumnTotal(sem)),
          totalCreditsInfo.calculated
        ]
      ],
      theme: 'grid',
      styles: { 
        fontSize: 9,
        cellPadding: 2 
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      footStyles: {
        fontStyle: 'bold'
      }
    });
    
    //Course Details Section
    for (const semester of semestersData) {
      const coursesWithDetails = semester.courses.filter(course => course.courseDetails);
      
      if (coursesWithDetails.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text(`SEMESTER ${semester.semNo} - COURSE DETAILS`, doc.internal.pageSize.width / 2, 20, { align: 'center' });
        
        let yPosition = 30;
        
        for (const course of coursesWithDetails) {
          // Check if we need a new page
          if (yPosition > doc.internal.pageSize.height - 40) {
            doc.addPage();
            yPosition = 20;
          }
          
          // Add more top margin for each course card
          yPosition += 5;
          
          // Course header - centered
          doc.setFontSize(12);
          doc.setFont('arial', 'bold');
          doc.text(`${course.course_code} - ${course.course_name}`, doc.internal.pageSize.width / 2, yPosition, { align: 'center' });
          
          // Credits info
          doc.setFont('arial', 'normal');
          doc.text(`${course.lecture} ${course.tutorial} ${course.practical} ${course.credits}`, doc.internal.pageSize.width - 40, yPosition);
    
          yPosition += 10;
    
          // Increased border margin around text
          const courseDetailsBorderMargin = 20;
          const effectiveCourseWidth = doc.internal.pageSize.width - (pageMargin * 2) - (courseDetailsBorderMargin * 2);
          
          // Course Outcomes with Arial font size 8
          if (course.courseDetails.co && course.courseDetails.co.length > 0) {
            doc.setFontSize(8);
            
            // Using the first item which contains co1_name, co1_desc format
            const coData = course.courseDetails.co[0];
            
            for (let i = 1; i <= 5; i++) {
              if (coData[`co${i}_name`]) {
                // Get hours info if available
                let hoursText = "";
                if (course.courseDetails.hours && 
                    course.courseDetails.hours.lecture && 
                    course.courseDetails.hours.tutorial) {
                  hoursText = `(${course.courseDetails.hours.lecture[i-1] || 0} + ${course.courseDetails.hours.tutorial[i-1] || 0})`;
                }
                
                // Set the CO name part in bold
                doc.setFont('arial', 'bold');
                const coName = `${coData[`co${i}_name`]}`;
                doc.text(coName, pageMargin + courseDetailsBorderMargin, yPosition);
                
                // Calculate width of the co_name part to position the description properly
                const coNameWidth = doc.getTextWidth(coName);
                
                // Add colon and description in normal font
                doc.setFont('arial', 'normal');
                const coDesc = ` : ${coData[`co${i}_desc`]}`;
                
                // Split long course descriptions into multiple lines
                const fullWidth = doc.internal.pageSize.width - (pageMargin * 2) - (courseDetailsBorderMargin * 2);
                
                // For first line, account for the co_name width
                const firstLineWidth = fullWidth - coNameWidth;
                // Extract just enough text for the first line
                const firstLineText = coDesc;
                const firstLineLines = doc.splitTextToSize(firstLineText, firstLineWidth);
                
                // Position description after the co_name on first line
                doc.text(firstLineLines[0], pageMargin + courseDetailsBorderMargin + coNameWidth, yPosition);
                yPosition += 4; // Decreased line spacing within course outcome
                
                // If there's more text that didn't fit on the first line, handle it separately
                if (firstLineLines.length > 1) {
                  // Get remaining text after what fit on the first line
                  const remainingText = coDesc.substring(firstLineLines[0].length).trim();
                  
                  // If there's remaining text, split it to the full width
                  if (remainingText) {
                    const remainingLines = doc.splitTextToSize(remainingText, fullWidth);
                    
                    // Add all remaining lines except the last
                    for (let j = 0; j < remainingLines.length - 1; j++) {
                      doc.text(remainingLines[j], pageMargin + courseDetailsBorderMargin, yPosition);
                      yPosition += 4; // Decreased line spacing within course outcome
                    }
                    
                    // For the last line, make space for hours text
                    if (remainingLines.length > 0) {
                      doc.text(remainingLines[remainingLines.length - 1], pageMargin + courseDetailsBorderMargin, yPosition);
                      
                      // Right-align hours text on the same line as the last text line
                      if (hoursText) {
                        const hoursX = doc.internal.pageSize.width - pageMargin - courseDetailsBorderMargin - doc.getTextWidth(hoursText);
                        doc.text(hoursText, hoursX, yPosition);
                      }
                      yPosition += 4; // Decreased line spacing within course outcome
                    }
                  } else {
                    // If no remaining text, add hours on the last line
                    if (hoursText) {
                      const hoursX = doc.internal.pageSize.width - pageMargin - courseDetailsBorderMargin - doc.getTextWidth(hoursText);
                      doc.text(hoursText, hoursX, yPosition - 4); // Adjust Y position back to last line
                    }
                  }
                } else {
                  // If first line description fit completely, add hours on same line
                  if (hoursText) {
                    const hoursX = doc.internal.pageSize.width - pageMargin - courseDetailsBorderMargin - doc.getTextWidth(hoursText);
                    doc.text(hoursText, hoursX, yPosition - 4); // Adjust Y position back to first line
                  }
                }
                
                // Increased spacing between different course outcomes
                yPosition += 6;
                
                // Add more space if needed
                if (yPosition > doc.internal.pageSize.height - 40) {
                  doc.addPage();
                  yPosition = 20;
                }
              }
            }
          }
          
          // Add more space after course outcomes
          yPosition += 5;
          
          // Reset font size for subsequent sections
          doc.setFontSize(9);
          
          // Total Hours - Right aligned
          doc.setFont('arial', 'bold');
          
          // Create the total hours text
          const totalHoursText = `L: 45 ${course.credits === 4 ? "+ T: 15 = 60" : ""}`;
          const totalHoursWidth = doc.getTextWidth(totalHoursText);
          const totalHoursX = doc.internal.pageSize.width - pageMargin - courseDetailsBorderMargin - totalHoursWidth;
          
          // Calculate the width of "Total =" text and position it to the left of hours
          const totalText = "Total =";
          const totalTextWidth = doc.getTextWidth(totalText);
          const totalTextX = totalHoursX - totalTextWidth - 5; // 5 is spacing between texts
          
          // Draw the right-aligned texts
          doc.text(totalText, totalTextX, yPosition);
          doc.setFont('arial', 'normal');
          doc.text(totalHoursText, totalHoursX, yPosition);
          
          yPosition += 10;
          
          // Textbooks
          doc.setFont('arial', 'bold');
          doc.text("TEXT BOOKS", pageMargin + courseDetailsBorderMargin, yPosition);
          yPosition += 8;
          doc.setFont('arial', 'normal');
          
          if (course.courseDetails.textbooks && course.courseDetails.textbooks.length > 0) {
            course.courseDetails.textbooks.forEach((book, index) => {
              const bookText = `${index + 1}. ${book.author}, ${book.title}, ${book.publisher}, ${book.place}, ${book.year}.`;
              const bookLines = doc.splitTextToSize(bookText, doc.internal.pageSize.width - (pageMargin * 2) - (courseDetailsBorderMargin * 2));
              
              doc.text(bookLines, pageMargin + courseDetailsBorderMargin, yPosition);
              yPosition += 6 * bookLines.length;
              
              // Add more space or new page if needed
              if (yPosition > doc.internal.pageSize.height - 40) {
                doc.addPage();
                yPosition = 20;
              }
            });
          } else {
            doc.text("No textbooks available.", pageMargin + courseDetailsBorderMargin, yPosition);
            yPosition += 8;
          }
          
          yPosition += 8;
          
          // References
          doc.setFont('arial', 'bold');
          doc.text("REFERENCES", pageMargin + courseDetailsBorderMargin, yPosition);
          yPosition += 8;
          doc.setFont('arial', 'normal');
          
          if (course.courseDetails.references && course.courseDetails.references.length > 0) {
            course.courseDetails.references.forEach((ref, index) => {
              const refText = `${index + 1}. ${ref.author}, ${ref.title}, ${ref.publisher}, ${ref.place}, ${ref.year}.`;
              const refLines = doc.splitTextToSize(refText, doc.internal.pageSize.width - (pageMargin * 2) - (courseDetailsBorderMargin * 2));
              
              doc.text(refLines, pageMargin + courseDetailsBorderMargin, yPosition);
              yPosition += 6 * refLines.length;
              
              // Add more space or new page if needed
              if (yPosition > doc.internal.pageSize.height - 40 && index < course.courseDetails.references.length - 1) {
                doc.addPage();
                yPosition = 20;
              }
            });
          } else {
            doc.text("No references available.", pageMargin + courseDetailsBorderMargin, yPosition);
            yPosition += 8;
          }
          
          // Add more bottom margin between courses
          yPosition += 15;
          
          // Add a separator line between courses
          if (yPosition < doc.internal.pageSize.height - 30) {
            doc.line(pageMargin, yPosition - 5, doc.internal.pageSize.width - pageMargin, yPosition - 5);
          }
          
          // Check if we need a new page for the next course
          if (yPosition > doc.internal.pageSize.height - 40) {
            doc.addPage();
            yPosition = 20;
          }
        }
      }
    }
    
    // Save the document
    doc.save('ME Course_Structure.pdf');
    setExportLoading(false);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    setExportLoading(false);
    setError('Failed to export data to PDF. Please try again later.');
  }
};

  const navigateBack = () => {
    navigate('/syllabus');
  };

  // const handleExport = () => {
  //   exportToPDF(semestersData, summaryData, totalCreditsInfo);
  // };

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
      <h1>ME COMPUTER SCIENCE AND ENGINEERING</h1>
      <h2>Courses of Study and Scheme of Assessment</h2>
      <div className="action-buttons">
        <button onClick={exportToPDF} disabled={exportLoading}>
          {exportLoading ? "Exporting..." : "Export to PDF"}
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
                  {/* <td colSpan="11">THEORY</td> */}
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

      {/* Professional Electives Section */}
{professionalElectives.length > 0 && (
  <div className="professional-electives-container">
    <h2>Professional Electives</h2>
    <table className="data-table">
      <thead>
        <tr>
          {/* <th>ID</th> */}
          <th>Course Code</th>
          <th>Course Name</th>
          <th>Credits</th>
          <th>Lecture</th>
          <th>Tutorial</th>
          <th>Practical</th>
          <th>CA Marks</th>
          <th>FE Marks</th>
          <th>Total Marks</th>
        </tr>
      </thead>
      <tbody>
        {professionalElectives.map((item, idx) => (
          <tr key={`pe-${idx}`}>
            {/* <td>{item.id}</td> */}
            <td>{item.course_code}</td>
            <td>{item.course_name}</td>
            <td>{item.credits}</td>
            <td>{item.lecture}</td>
            <td>{item.tutorial}</td>
            <td>{item.practical}</td>
            <td>{item.ca_marks}</td>
            <td>{item.fe_marks}</td>
            <td>{item.total_marks}</td>
          </tr>
        ))}
      </tbody>
      <tbody>
        <tr className="total-row">
          <td colSpan="2" style={{ textAlign: "center", fontWeight: "bold" }}>Total</td>
          <td style={{ textAlign: "center", fontWeight: "bold" }}>
            {professionalElectives.reduce((sum, item) => sum + Number(item.credits || 0), 0)}
          </td>
          <td style={{ textAlign: "center", fontWeight: "bold" }}>
            {professionalElectives.reduce((sum, item) => sum + Number(item.lecture || 0), 0)}
          </td>
          <td style={{ textAlign: "center", fontWeight: "bold" }}>
            {professionalElectives.reduce((sum, item) => sum + Number(item.tutorial || 0), 0)}
          </td>
          <td style={{ textAlign: "center", fontWeight: "bold" }}>
            {professionalElectives.reduce((sum, item) => sum + Number(item.practical || 0), 0)}
          </td>
          <td style={{ textAlign: "center", fontWeight: "bold" }}>
            {professionalElectives.reduce((sum, item) => sum + Number(item.ca_marks || 0), 0)}
          </td>
          <td style={{ textAlign: "center", fontWeight: "bold" }}>
            {professionalElectives.reduce((sum, item) => sum + Number(item.fe_marks || 0), 0)}
          </td>
          <td style={{ textAlign: "center", fontWeight: "bold" }}>
            {professionalElectives.reduce((sum, item) => sum + Number(item.total_marks || 0), 0)}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
)}

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

{semestersData.map((semester) => {
  const totals = calculateSemesterTotals(semester.courses);
  
  return (
    <div key={semester.semNo} className="semester-section">
      <h3>SEMESTER {semester.semNo}</h3>
      
      {/* Existing course table code */}
      <table className="courses-table">
        {/* ... existing table code ... */}
      </table>
      
      {/* NEW CODE: Course Details Section */}
      <div className="course-details-sections">
        <h3>COURSE DETAILS</h3>

        
        {semester.courses.map((course) => (
          

          course.courseDetails && (
            <div key={`details-${course.course_code}`} className="course-detail-card">
              <div className="course-header">
                <h4 className="course-title">{course.course_code} - {course.course_name}</h4>
                <p className="course-credit-right">
                  {course.lecture} {course.tutorial} {course.practical} {course.credits}
                </p>
              </div>

{/* Course Outcomes */}
{course.courseDetails.co && course.courseDetails.co.length > 0 && (
  <div className="section">
    {/* Find all CO keys and create entries for each */}
    {[1, 2, 3, 4, 5].map(num => {
      const coData = course.courseDetails.co[0];
      if (coData[`co${num}_name`]) {
        return (
          <div key={num} className="course-topic">
            <p className="topic">
              <b>CO{num}: {coData[`co${num}_name`]}</b> {coData[`co${num}_desc`]}
            </p>
            {course.courseDetails.hours && 
             course.courseDetails.hours.lecture && 
             course.courseDetails.hours.tutorial && (
              <span className="hours">
                ({course.courseDetails.hours.lecture[num-1] || 0} + {course.courseDetails.hours.tutorial[num-1] || 0})
              </span>
            )}
          </div>
        );
      }
      return null;
    })}
  </div>
)}










              
              {/* Total Hours */}
              <div className="total-hours">
                <p>
                  <b>Total =</b> L: 45 {course.credits === 4 ? "+ T: 15 = 60" : ""}
                </p>
              </div>
              
              {/* Textbooks */}
              <div className="section">
                <h5 className="section-title">TEXT BOOKS</h5>
                {course.courseDetails.textbooks && course.courseDetails.textbooks.length > 0 ? (
                  <ol className="book-list">
                    {course.courseDetails.textbooks.map((book, i) => (
                      <li key={i} className="book-item">
                        <b>{book.author}</b>, {book.title}, {book.publisher}, {book.place}, {book.year}.
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="no-data">No textbooks available.</p>
                )}
              </div>
              
              {/* References */}
              <div className="section">
                <h5 className="section-title">REFERENCES</h5>
                {course.courseDetails.references && course.courseDetails.references.length > 0 ? (
                  <ol className="book-list">
                    {course.courseDetails.references.map((ref, i) => (
                      <li key={i} className="book-item">
                        <b>{ref.author}</b>, {ref.title}, {ref.publisher}, {ref.place}, {ref.year}.
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="no-data">No references available.</p>
                )}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
})}

    </div>

    
  );
}

export default CourseMePDF;