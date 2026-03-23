import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/CoPo.css";

function CoPo() {
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(true); // always show table
  const [tableData, setTableData] = useState([
    { co: "CO1", pos: Array(12).fill(""), pso: ["", ""] },
    { co: "CO2", pos: Array(12).fill(""), pso: ["", ""] },
    { co: "CO3", pos: Array(12).fill(""), pso: ["", ""] },
    { co: "CO4", pos: Array(12).fill(""), pso: ["", ""] },
    { co: "CO5", pos: Array(12).fill(""), pso: ["", ""] },
  ]);
  const location = useLocation();
  const { degree, department, facultyName, selectedCourse, outcomes } =
    location.state || {};

  const handleTableInputChange = (rowIndex, key, subIndex, value) => {
    const updatedData = [...tableData];
    updatedData[rowIndex][key][subIndex] = value;
    setTableData(updatedData);
  };

 const generateAllMappingsExcel = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/faculty/getAllMappings`,
        {
          params: {
            degree,
            department,
          },
        }
      );

      if (!response.data.success) {
        alert("Failed to fetch mapping data.");
        return;
      }

      const mappings = response.data.mappings;

      // Group by course_code
      const grouped = {};
      for (const row of mappings) {
        if (!grouped[row.course_code]) {
          grouped[row.course_code] = {
            course_name: row.course_name,
            faculty: row.faculty,
            rows: [],
          };
        }

        grouped[row.course_code].rows.push({
          outcome: row.outcome,
          pos: [
            row.po1,
            row.po2,
            row.po3,
            row.po4,
            row.po5,
            row.po6,
            row.po7,
            row.po8,
            row.po9,
            row.po10,
            row.po11,
            row.po12,
          ],
          pso: [row.pso1, row.pso2],
        });
      }

      // ---------------- SHEET 1 (ALL DATA) ----------------
      const headers = [
        "Course Code",
        "Course Name",
        "Faculty Name",
        "COs/Outcomes",
        "PO1",
        "PO2",
        "PO3",
        "PO4",
        "PO5",
        "PO6",
        "PO7",
        "PO8",
        "PO9",
        "PO10",
        "PO11",
        "PO12",
        "PSO1",
        "PSO2",
      ];

      const sheetData = [headers];

      for (const [courseCode, data] of Object.entries(grouped)) {
        const { course_name, faculty, rows } = data;

        // Course header row
        sheetData.push([
          courseCode,
          course_name,
          faculty,
          "",
          ...Array(14).fill(""),
        ]);

        // CO rows
        rows.forEach((entry, index) => {
          sheetData.push([
            "",
            "",
            "",
            `CO${index + 1}: ${entry.outcome || "N/A"}`,
            ...entry.pos,
            ...entry.pso,
          ]);
        });

        sheetData.push([]);
      }

      // ---------------- SHEET 2 (AVERAGES) ----------------
const avgSheet = [headers];

for (const [courseCode, data] of Object.entries(grouped)) {
  const { course_name, faculty, rows } = data;

  const poSum = Array(12).fill(0);
  const poCount = Array(12).fill(0);

  const psoSum = Array(2).fill(0);
  const psoCount = Array(2).fill(0);

  rows.forEach((row) => {
    row.pos.forEach((val, i) => {
      const num = parseFloat(val);
      if (!isNaN(num) && num !== 0) {
        poSum[i] += num;
        poCount[i] += 1;
      }
    });

    row.pso.forEach((val, i) => {
      const num = parseFloat(val);
      if (!isNaN(num) && num !== 0) {
        psoSum[i] += num;
        psoCount[i] += 1;
      }
    });
  });

  const poAvg = poSum.map((sum, i) =>
    poCount[i] ? (sum / poCount[i]).toFixed(2) : ""
  );

  const psoAvg = psoSum.map((sum, i) =>
    psoCount[i] ? (sum / psoCount[i]).toFixed(2) : ""
  );

  avgSheet.push([
    courseCode,
    course_name,
    faculty,
    "AVERAGE",
    ...poAvg,
    ...psoAvg,
  ]);

  avgSheet.push([]);
}

      // ---------------- CREATE EXCEL ----------------
      const ws1 = XLSX.utils.aoa_to_sheet(sheetData);
      const ws2 = XLSX.utils.aoa_to_sheet(avgSheet);

      ws1["!cols"] = [
        { wch: 15 },
        { wch: 35 },
        { wch: 25 },
        { wch: 60 },
        ...Array(14).fill({ wch: 8 }),
      ];
      ws2["!cols"] = ws1["!cols"];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws1, "All Mappings");
      XLSX.utils.book_append_sheet(wb, ws2, "PO Averages");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const dataBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(dataBlob, `All_CoPo_Mappings.xlsx`);
    } catch (err) {
      console.error("Excel generation failed:", err);
      alert("Error generating Excel file.");
    }
  };

  const handleSaveToSupabase = async () => {
    if (!selectedCourse || !facultyName || !outcomes) {
      alert("Missing course, faculty, or outcome data.");
      return;
    }

    const [course_code, course_name] = selectedCourse.split(" - ");

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/faculty/addMapping`,
        {
          course_code,
          course_name,
          faculty: facultyName,
          degree,
          department,
          mappingData: tableData,
          outcomes,
        }
      );

      if (response.data.success) {
        alert("Mapping saved successfully!");
      } else {
        alert("Failed to save mapping: " + response.data.message);
      }
    } catch (error) {
      console.error("Error saving mapping:", error);
      alert(
        error.response?.data?.message ||
          "An unexpected error occurred while saving mapping."
      );
    }
  };

  return (
    <div className="copo-container">
      <h2>CO/PO Mapping Table</h2>

      <button className="back-button" onClick={() => navigate("/faculty")}>
        ← Back to Faculty
      </button>

      {expanded && (
        <div className="table-section">
          <table border="1">
            <thead>
              <tr>
                <th>COs/POs</th>
                {[...Array(12).keys()].map((i) => (
                  <th key={i}>{`PO${String.fromCharCode(
                    97 + i
                  ).toUpperCase()}`}</th>
                ))}
                <th>PSO1</th>
                <th>PSO2</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td>{row.co}</td>
                  {row.pos.map((po, i) => (
                    <td key={i}>
                      <input
                        type="text"
                        value={po}
                        onChange={(e) =>
                          handleTableInputChange(
                            rowIndex,
                            "pos",
                            i,
                            e.target.value
                          )
                        }
                      />
                    </td>
                  ))}
                  {row.pso.map((pso, i) => (
                    <td key={i}>
                      <input
                        type="text"
                        value={pso}
                        onChange={(e) =>
                          handleTableInputChange(
                            rowIndex,
                            "pso",
                            i,
                            e.target.value
                          )
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button className="save-button" onClick={handleSaveToSupabase}>
            Save Mapping
          </button>
          <button className="save-button" onClick={generateAllMappingsExcel}>
            Download All CO/PO Mappings
          </button>
        </div>
      )}
    </div>
  );
}

export default CoPo;
