/**
 * EvalAI Safety System - Google Sheets Sync Script
 * 
 * INSTRUCCIONES:
 * 1. Crea una nueva hoja de cálculo en Google Sheets (sheets.google.com).
 * 2. Ve a la pestaña "Extensiones" > "Apps Script".
 * 3. Borra cualquier código existente y pega todo este código allí.
 * 4. Guarda el proyecto (Ctrl+S o Cmd+S).
 * 5. Haz clic en "Implementar" (arriba a la derecha) > "Nueva implementación".
 * 6. En "Seleccionar tipo", haz clic en el engranaje y elige "Aplicación web".
 * 7. En "Acceso", selecciona "Cualquier persona" (IMPORTANTE para que la app web pueda enviar los datos).
 * 8. Haz clic en "Implementar" y autoriza los permisos si te lo pide.
 * 9. Copia la "URL de la aplicación web" que te da Google.
 * 10. En la herramienta web de EvalAI, ingresa esa URL para sincronizar tus proyectos.
 */

const SHEET_NAME_PROJECTS = "Proyectos";
const SHEET_NAME_EVALS = "Evaluaciones";
const SHEET_NAME_FINDINGS = "Hallazgos";

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Setup Projects
  let pSheet = ss.getSheetByName(SHEET_NAME_PROJECTS);
  if (!pSheet) {
    pSheet = ss.insertSheet(SHEET_NAME_PROJECTS);
    pSheet.appendRow(["Project ID", "Name", "Client", "Author", "Type", "Doc Num", "Status", "Last Sync"]);
    pSheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#f3f4f6");
  }

  // Setup Evaluations
  let eSheet = ss.getSheetByName(SHEET_NAME_EVALS);
  if (!eSheet) {
    eSheet = ss.insertSheet(SHEET_NAME_EVALS);
    eSheet.appendRow(["Project ID", "Eval ID", "Version", "Date", "Label", "Status", "Findings Count"]);
    eSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#f3f4f6");
  }

  // Setup Findings
  let fSheet = ss.getSheetByName(SHEET_NAME_FINDINGS);
  if (!fSheet) {
    fSheet = ss.insertSheet(SHEET_NAME_FINDINGS);
    fSheet.appendRow(["Eval ID", "Finding ID", "Title", "Task Type", "Activity", "Location", "PHR", "Measures Count"]);
    fSheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#f3f4f6");
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Webhook actions
    if (data.action === 'sync_project' && data.payload) {
      updateProjectInSheet(data.payload);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action or payload' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateProjectInSheet(project) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSheets();
  
  const pSheet = ss.getSheetByName(SHEET_NAME_PROJECTS);
  const pData = pSheet.getDataRange().getValues();
  let pFound = false;
  
  const nowStr = new Date().toLocaleString();

  for (let i = 1; i < pData.length; i++) {
    if (pData[i][0] === project.id) {
      pSheet.getRange(i + 1, 1, 1, 8).setValues([[
        project.id, 
        project.name, 
        project.client || "-", 
        project.author || "-", 
        project.type || "-", 
        project.docNum || "-",
        project.status || "Activo",
        nowStr
      ]]);
      pFound = true;
      break;
    }
  }
  
  if (!pFound) {
    pSheet.appendRow([
      project.id, 
      project.name, 
      project.client || "-", 
      project.author || "-", 
      project.type || "-", 
      project.docNum || "-",
      project.status || "Activo",
      nowStr
    ]);
  }
  
  updateEvaluationsInSheet(ss, project.id, project.evaluations || []);
}

function updateEvaluationsInSheet(ss, projectId, evaluations) {
  const eSheet = ss.getSheetByName(SHEET_NAME_EVALS);
  const fSheet = ss.getSheetByName(SHEET_NAME_FINDINGS);
  
  // Clean existing evals for this project
  const eData = eSheet.getDataRange().getValues();
  for (let i = eData.length - 1; i >= 1; i--) {
    if (eData[i][0] === projectId) {
      eSheet.deleteRow(i + 1);
    }
  }
  
  evaluations.forEach(ev => {
    eSheet.appendRow([
      projectId,
      ev.id,
      ev.version,
      ev.date ? new Date(ev.date).toLocaleDateString() : "-",
      ev.label,
      ev.status || "-",
      ev.findings ? ev.findings.length : 0
    ]);
    
    updateFindingsInSheet(fSheet, ev.id, ev.findings || []);
  });
}

function updateFindingsInSheet(fSheet, evalId, findings) {
  // Clean existing findings for this eval
  const fData = fSheet.getDataRange().getValues();
  for (let i = fData.length - 1; i >= 1; i--) {
    if (fData[i][0] === evalId) {
      fSheet.deleteRow(i + 1);
    }
  }
  
  findings.forEach(f => {
    fSheet.appendRow([
      evalId,
      f.id,
      f.title,
      f.taskType || "-",
      f.activity || "-",
      f.location || "-",
      f.phr || "-",
      f.measures ? f.measures.length : 0
    ]);
  });
  
  // Optional: Auto resize columns for better visibility
  try {
     SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_PROJECTS).autoResizeColumns(1, 8);
     SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_EVALS).autoResizeColumns(1, 7);
  } catch(e) {}
}

// Needed for CORS preflight
function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}
