import jsPDF from 'jspdf';
import 'jspdf-autotable';

const exportToPDF = () => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Set default font
    doc.setFont('helvetica');

    // Title page
    doc.setFontSize(16);
    doc.text('BE COMPUTER SCIENCE AND ENGINEERING', doc.internal.pageSize.width / 2, 30, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Courses of Study and Scheme of Assessment', doc.internal.pageSize.width / 2, 40, { align: 'center' });

    // Iterate through semesters
    for (let i = 0; i < semestersData.length; i += 2) {
      // Prepare data for two semesters (or less for the last iteration)
      const semestersToRender = [
        semestersData[i],
        semestersData[i + 1] // might be undefined, which is fine
      ].filter(Boolean);

      semestersToRender.forEach((semester, index) => {
        const totals = calculateSemesterTotals(semester.courses);
        
        // Vertical position for this semester's table
        const verticalOffset = index === 0 ? 60 : 180;
        
        // Semester title
        doc.setFontSize(12);
        doc.text(`SEMESTER ${semester.semNo}`, doc.internal.pageSize.width / 2, verticalOffset - 10, { align: 'center' });

        // Prepare table data
        const theoryCourses = semester.courses
          .filter((course) => course.category?.toLowerCase() === "theory")
          .map((course, index) => [
            index + 1,
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

        const practicalCourses = semester.courses
          .filter((course) => course.category?.toLowerCase() === "practical")
          .map((course, index) => [
            theoryCourses.length + index + 1,
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

        const mandatoryCourses = semester.courses
          .filter((course) => course.category?.toLowerCase() === "mandatory")
          .map((course, index) => [
            theoryCourses.length + practicalCourses.length + index + 1,
            course.course_code,
            course.course_name,
            course.lecture || "-",
            course.tutorial || "-",
            course.practical || "-",
            course.credits || "Grade",
            course.ca_marks || "-",
            course.fe_marks || "-",
            course.total_marks || "-",
            course.type
          ]);

        // Render tables
        doc.autoTable({
          startY: verticalOffset,
          head: [
            [
              'S.No', 'Course Code', 'Course Title', 
              'Lecture', 'Tutorial', 'Practical', 
              'Credits', 'CA', 'FE', 'Total', 'CAT'
            ]
          ],
          body: [
            // Theory header
            [{ content: 'THEORY', colSpan: 11, styles: { halign: 'left', fontStyle: 'bold' } }],
            ...theoryCourses,
            
            // Practical header
            [{ content: 'PRACTICALS', colSpan: 11, styles: { halign: 'left', fontStyle: 'bold' } }],
            ...practicalCourses,
            
            // Mandatory header
            [{ content: 'MANDATORY COURSES', colSpan: 11, styles: { halign: 'left', fontStyle: 'bold' } }],
            ...mandatoryCourses,
            
            // Semester total
            [{
              content: `Total ${totals.totalHours} hrs`, 
              colSpan: 3
            }, '', '', 
             totals.totalLecture, 
             totals.totalTutorial, 
             totals.totalPractical, 
             totals.totalCredits, 
             totals.totalCAMarks, 
             totals.totalFEMarks, 
             totals.totalMarks, 
             '']
          ],
          theme: 'grid',
          styles: { 
            fontSize: 8,
            cellPadding: 1,
            valign: 'middle'
          },
          columnStyles: {
            0: { cellWidth: 10 },  // S.No
            1: { cellWidth: 20 },  // Course Code
            2: { cellWidth: 50 },  // Course Title
            3: { cellWidth: 15 },  // Lecture
            4: { cellWidth: 15 },  // Tutorial
            5: { cellWidth: 15 },  // Practical
            6: { cellWidth: 15 },  // Credits
            7: { cellWidth: 15 },  // CA
            8: { cellWidth: 15 },  // FE
            9: { cellWidth: 15 },  // Total
            10: { cellWidth: 15 }  // CAT
          }
        });
      });

      // Add new page if not the last iteration
      if (i + 2 < semestersData.length) {
        doc.addPage();
      }
    }

    // Summary section on a new page
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Summary of Credit Distribution', doc.internal.pageSize.width / 2, 20, { align: 'center' });

    const summaryTableData = summaryData.map((row, index) => [
      index + 1,
      row.type,
      ...semesters.map(sem => row.credits[sem] || 0),
      calculateRowTotal(row.credits)
    ]);

    doc.autoTable({
      startY: 30,
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
      }
    });

    // Save the document
    doc.save('Course_Structure.pdf');
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    // setError('Failed to export data to PDF. Please try again later.');
  }
};

export default exportToPDF;