import React, { useState, useEffect} from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/CourseWord.css";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, BorderStyle, WidthType, 
         AlignmentType, HeadingLevel, TextRun, convertInchesToTwip, PageOrientation, 
         Footer, Header, ShadingType } from "docx";
import { saveAs } from "file-saver";

function CourseWord() {
  const [semestersData, setSemestersData] = useState([]);
  const [coursesData, setCoursesData] = useState({}); // Added missing state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const [coursesElective, setCoursesElective] = useState([]);
  const [groupedElectives, setGroupedElectives] = useState({});
  const [honoursCoursesByVertical, setHonoursCoursesByVertical] = useState({});


  const [summaryData, setSummaryData] = useState([]);
  const [totalCreditsInfo, setTotalCreditsInfo] = useState(null);
  const courseTypes = ["HS", "BS", "ES", "PC", "PE", "OE", "EEC", "MC"];
  const semesters = Array.from({ length: 8 }, (_, i) => i + 1);
  
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

        const { groupedElectives: electives, honoursCoursesByVertical: honoursCourses } = 
        await fetchElectiveCourses(degree, department);

        setGroupedElectives(electives);
        setHonoursCoursesByVertical(honoursCourses);
        
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
        // console.log(enhancedSemestersData)
        
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
}, [degree, department]);


const fetchElectiveCourses = async (degree, department) => {
  try {
    const electivesResponse = await axios.get(
      `http://localhost:4000/api/proelective/courses?degree=${encodeURIComponent(degree)}&department=${encodeURIComponent(department)}`
    );
    const electivesData = electivesResponse.data;
    
    // Group elective courses by type
    const groupedElectives = electivesData.reduce((acc, course) => {
      if (!acc[course.type]) {
        acc[course.type] = [];
      }
      acc[course.type].push(course);
      return acc;
    }, {});
    
    // Sort electives by serial number
    Object.keys(groupedElectives).forEach(type => {
      groupedElectives[type].sort((a, b) => a.serial_number - b.serial_number);
    });
    
    // Group BE Honours courses by vertical
    const honoursCoursesByVertical = electivesData
      .filter(course => course.type === "Professional Electives for BE Honours / BE Honours with specialization in same discipline and BE Minor degree programmes")
      .reduce((acc, course) => {
        const vertical = course.vertical || 0;
        if (!acc[vertical]) {
          acc[vertical] = [];
        }
        acc[vertical].push(course);
        return acc;
      }, {});
    
    // Sort each vertical group by serial number
    Object.keys(honoursCoursesByVertical).forEach(vertical => {
      honoursCoursesByVertical[vertical].sort((a, b) => a.serial_number - b.serial_number);
    });
    console.log(groupedElectives);
    
    return { groupedElectives, honoursCoursesByVertical };
  } catch (error) {
    console.error("Error fetching elective courses:", error);
    throw error;
  }
};

const getVerticalName = (vertical) => {
  const verticalNames = {
    1: "VERTICAL I: Computational Intelligence",
    2: "VERTICAL II: Networking Technologies",
    3: "VERTICAL III: Security and Privacy"
  };
  return verticalNames[vertical] || "";
};

const sectionTypes = {
  LANGUAGE: 'LANGUAGE ELECTIVES',
  BE: 'Professional electives for BE degree programme',
  BE_HONOURS: 'Professional Electives for BE Honours / BE Honours with specialization in same discipline and BE Minor degree programmes',
  OPEN: 'OPEN ELECTIVES',
  SDL: 'SELF DIRECTED LEARNING COURSES'
};
  

  const fetchAllSemestersData = async (degree, department) => {
    try {
      const semestersData = [];
      
      // Fetch data for all 8 semesters
      for (let semNo = 1; semNo <= 8; semNo++) {
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
    
    // FIRST RENDER ALL 8 SEMESTER TABLES (4 PAGES WITH 2 TABLES EACH)
    
    // Title and header for first page
    doc.setFontSize(10);
    
    doc.setFontSize(11);
    doc.text('Courses of Study and Scheme of Assessment', 20, 20);
    doc.text('BE COMPUTER SCIENCE AND ENGINEERING', 20, 25);
    
    // Add 2023 REGULATIONS text and credits info
    doc.setFontSize(9);
    doc.text('[2023 REGULATIONS]', doc.internal.pageSize.width - 20, 20, { align: 'right' });
    
    // Function to create semester table
    const createSemesterTable = (semNo, startY, courses) => {
      // Filter courses by category
      const theoryCourses = courses.filter(course => course.category?.toLowerCase() === "theory");
      const practicalCourses = courses.filter(course => course.category?.toLowerCase() === "practical");
      const mandatoryCourses = courses.filter(course => course.category?.toLowerCase() === "mandatory");
      
      // Calculate totals
      const totals = calculateSemesterTotals(courses);
      
      // Prepare table data
      const tableBody = [];
      
      // Add SEMESTER header
      tableBody.push([{ content: `SEMESTER ${semNo}`, colSpan: 11, styles: { halign: 'left', fontStyle: 'bold' } }]);
      
      // Add THEORY header and courses
      tableBody.push([{ content: 'THEORY', colSpan: 11, styles: { halign: 'left', fontStyle: 'bold' } }]);
      theoryCourses.forEach((course, idx) => {
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
      
      // Add PRACTICALS header and courses
      tableBody.push([{ content: 'PRACTICALS', colSpan: 11, styles: { halign: 'left', fontStyle: 'bold' } }]);
      practicalCourses.forEach((course, idx) => {
        tableBody.push([
          theoryCourses.length + idx + 1,
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
      
      // Add MANDATORY COURSES header and courses if any exist
      if (mandatoryCourses.length > 0) {
        tableBody.push([{ content: 'MANDATORY COURSES', colSpan: 11, styles: { halign: 'left', fontStyle: 'bold' } }]);
        mandatoryCourses.forEach((course, idx) => {
          tableBody.push([
            theoryCourses.length + practicalCourses.length + idx + 1,
            course.course_code,
            course.course_name,
            course.lecture || "-",
            course.tutorial || "-",
            course.practical || "-",
            course.credits || "Grade",
            course.ca_marks || "-",
            course.fe_marks || "-",
            course.total_marks || "",
            course.type
          ]);
        });
      }
      
      // Add semester total row
      const totalHours = semNo === 1 ? "26" : "29"; // Based on image example
      tableBody.push([{
        content: `Total ${totalHours} hrs`, 
        colSpan: 2,
        styles: { fontStyle: 'bold' }
      },'', 
        totals.totalLecture, 
        totals.totalTutorial, 
        totals.totalPractical, 
        totals.totalCredits, 
        totals.totalCAMarks, 
        totals.totalFEMarks, 
        totals.totalMarks, 
        '']);
      
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
        margin: { left: pageMargin, right: pageMargin }
      });
      
      return doc.lastAutoTable.finalY + 10;
    };
    
    // Create semester tables for semester I and II on first page
    let finalY = createSemesterTable(1, 35, semestersData[0].courses);
    finalY = createSemesterTable(2, finalY, semestersData[1].courses);
    
    // Add the category legend
    doc.setFontSize(8);
    const legendText = "CAT - Category; BS - Basic Science; HS - Humanities and Social Sciences; ES - Engineering Sciences; PC - Professional Core; PE - Professional Elective; OE - Open Elective; EEC - Employability Enhancement Course; MC - Mandatory Course";
    
    const legendLines = doc.splitTextToSize(legendText, doc.internal.pageSize.width - (pageMargin * 2));
    doc.text(legendLines, pageMargin, finalY);
    
    // Add page number
    doc.setFontSize(9);
    doc.text('103', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    
    // Add content for remaining semesters (starting from semester 3)
    // Display two tables per page for remaining semesters
    for (let i = 2; i < semestersData.length; i += 2) {
      doc.addPage();
      let currentY = 20;
      
      // Add first semester table on this page
      currentY = createSemesterTable(i + 1, currentY, semestersData[i].courses);
      
      // Check if there's another semester to add
      if (i + 1 < semestersData.length) {
        // Add second semester table on the same page
        currentY = createSemesterTable(i + 2, currentY, semestersData[i + 1].courses);
      }
      
      // Add legend text at the bottom if space allows
      if (currentY < doc.internal.pageSize.height - 20) {
        doc.setFontSize(8);
        const legendLines = doc.splitTextToSize(legendText, doc.internal.pageSize.width - (pageMargin * 2));
        doc.text(legendLines, pageMargin, currentY);
      }
      
      // Add page number
      const pageNum = 103 + Math.floor((i - 1) / 2);
      doc.setFontSize(9);
      doc.text(pageNum.toString(), doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
// After the 8 semester tables and before the summary table
// Add this right after the code that creates the 8 semester tables
// and before the "NEXT ADD SUMMARY TABLE ON A NEW PAGE" comment

// NEXT ADD ELECTIVE SECTIONS ON NEW PAGES BEFORE SUMMARY TABLE
// Add Professional Electives
doc.addPage();
doc.setFontSize(14);
doc.text('Professional Electives for BE Degree Programme', doc.internal.pageSize.width / 2, 20, { align: 'center' });

// Create table for Professional Electives
const professionalElectivesData = groupedElectives[sectionTypes.BE].map(course => [
  course.course_code,
  course.course_title
]);

autoTable(doc, {
  startY: 30,
  margin: { left: pageMargin, right: pageMargin },
  head: [['Course Code', 'Course Title']],
  body: professionalElectivesData,
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
  columnStyles: {
    0: { cellWidth: 30 },
    1: { cellWidth: 'auto' }
  }
});

// Add Honours Electives by vertical
if (Object.keys(honoursCoursesByVertical).length > 0) {
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Professional Electives for BE Honours / BE Honours with specialization', doc.internal.pageSize.width / 2, 20, { align: 'center' });
  doc.text('in same discipline and BE Minor degree programmes', doc.internal.pageSize.width / 2, 30, { align: 'center' });

  let verticalY = 40;
  
  for (const vertical of Object.keys(honoursCoursesByVertical).sort()) {
    // Check if we need a new page
    if (verticalY > doc.internal.pageSize.height - 60) {
      doc.addPage();
      verticalY = 20;
    }
    
    // Add vertical heading
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(getVerticalName(vertical), pageMargin, verticalY);
    verticalY += 10;
    
    // Create table for this vertical
    const verticalData = honoursCoursesByVertical[vertical].map(course => [
      course.course_code,
      course.course_title
    ]);

    autoTable(doc, {
      startY: verticalY,
      margin: { left: pageMargin, right: pageMargin },
      head: [['Course Code', 'Course Title']],
      body: verticalData,
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
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 'auto' }
      }
    });
    
    verticalY = doc.lastAutoTable.finalY + 15;
  }
}

// Add Open Electives
if (groupedElectives[sectionTypes.OPEN] && groupedElectives[sectionTypes.OPEN].length > 0) {
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Open Electives', doc.internal.pageSize.width / 2, 20, { align: 'center' });

  const openElectivesData = groupedElectives[sectionTypes.OPEN].map(course => [
    course.course_code,
    course.course_title
  ]);

  autoTable(doc, {
    startY: 30,
    margin: { left: pageMargin, right: pageMargin },
    head: [['Course Code', 'Course Title']],
    body: openElectivesData,
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
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 'auto' }
    }
  });
}

// Add Language Electives
if (groupedElectives[sectionTypes.LANGUAGE] && groupedElectives[sectionTypes.LANGUAGE].length > 0) {
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Language Electives', doc.internal.pageSize.width / 2, 20, { align: 'center' });

  const languageElectivesData = groupedElectives[sectionTypes.LANGUAGE].map(course => [
    course.course_code,
    course.course_title
  ]);

  autoTable(doc, {
    startY: 30,
    margin: { left: pageMargin, right: pageMargin },
    head: [['Course Code', 'Course Title']],
    body: languageElectivesData,
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
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 'auto' }
    }
  });
}

// Add Self Directed Learning Courses
if (groupedElectives[sectionTypes.SDL] && groupedElectives[sectionTypes.SDL].length > 0) {
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Self Directed Learning Courses', doc.internal.pageSize.width / 2, 20, { align: 'center' });

  const sdlCoursesData = groupedElectives[sectionTypes.SDL].map(course => [
    course.course_code,
    course.course_title
  ]);

  autoTable(doc, {
    startY: 30,
    margin: { left: pageMargin, right: pageMargin },
    head: [['Course Code', 'Course Title']],
    body: sdlCoursesData,
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
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 'auto' }
    }
  });
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
    doc.save('Course_Structure.pdf');
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
      <h1>BE COMPUTER SCIENCE AND ENGINEERING</h1>
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

      {/* Add Elective Courses section here */}
      <div className="courses-display">
      <h2>Elective Courses</h2>
      
      {/* Display Language Electives */}
      {groupedElectives[sectionTypes.LANGUAGE] && groupedElectives[sectionTypes.LANGUAGE].length > 0 && (
        <div className="course-section">
          <h3>LANGUAGE ELECTIVES</h3>
          <table>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Title</th>
              </tr>
            </thead>
            <tbody>
              {groupedElectives[sectionTypes.LANGUAGE].map(course => (
                <tr key={course.course_code}>
                  <td>{course.course_code}</td>
                  <td>{course.course_title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Display BE Degree Programme Courses */}
      {groupedElectives[sectionTypes.BE] && groupedElectives[sectionTypes.BE].length > 0 && (
        <div className="course-section">
          <h3>Professional electives for BE degree programme</h3>
          <table>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Title</th>
              </tr>
            </thead>
            <tbody>
              {groupedElectives[sectionTypes.BE].map(course => (
                <tr key={course.course_code}>
                  <td>{course.course_code}</td>
                  <td>{course.course_title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Display BE Honours Courses by Vertical */}
      {Object.keys(honoursCoursesByVertical).length > 0 && (
        <div className="course-section">
          <h3>Professional Electives for BE Honours / BE Honours with specialization in same discipline and BE Minor degree programmes</h3>
          {Object.keys(honoursCoursesByVertical).sort().map(vertical => (
            <div key={vertical}>
              <h4>{getVerticalName(vertical)}</h4>
              <table>
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Title</th>
                  </tr>
                </thead>
                <tbody>
                  {honoursCoursesByVertical[vertical].map(course => (
                    <tr key={course.course_code}>
                      <td>{course.course_code}</td>
                      <td>{course.course_title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      
      {/* Display Open Electives */}
      {groupedElectives[sectionTypes.OPEN] && groupedElectives[sectionTypes.OPEN].length > 0 && (
        <div className="course-section">
          <h3>OPEN ELECTIVES</h3>
          <table>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Title</th>
              </tr>
            </thead>
            <tbody>
              {groupedElectives[sectionTypes.OPEN].map(course => (
                <tr key={course.course_code}>
                  <td>{course.course_code}</td>
                  <td>{course.course_title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Display Self Directed Learning Courses */}
      {groupedElectives[sectionTypes.SDL] && groupedElectives[sectionTypes.SDL].length > 0 && (
        <div className="course-section">
          <h3>SELF DIRECTED LEARNING COURSES</h3>
          <table>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Title</th>
              </tr>
            </thead>
            <tbody>
              {groupedElectives[sectionTypes.SDL].map(course => (
                <tr key={course.course_code}>
                  <td>{course.course_code}</td>
                  <td>{course.course_title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

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

export default CourseWord;