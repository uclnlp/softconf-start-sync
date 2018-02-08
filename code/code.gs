function onInstall(e) {
  onOpen(e);
}

// add the menu on spreadsheet open
function onOpen(e) {
  SpreadsheetApp.getUi()
  .createAddonMenu()
  .addItem('Setup', 'showSidebar')
  .addSeparator()
  .addItem('Sync with START', 'syncWithSTART')
  .addToUi();  
}

// open the sidebar
function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setTitle('Setup')
      .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

// the main workhorse
function syncWithSTART() {  
  // load and check URLs
  var URLs = loadURLs();
  var softconf_url = URLs[0];
  var base_url = URLs[1];
  var url_columns = ["%Paper_URL%", "%PDF_URL%", "%Discussion_URL%", "%Reviews_URL%"];

  if (softconf_url == null || softconf_url.length == 0) {
    SpreadsheetApp.getUi().alert("ERROR: Report URL not defined.\n\nPlease enter it in Setup.");
    showSidebar();
    return;
  }
  if (base_url == null || softconf_url.length == 0) {
    SpreadsheetApp.getUi().alert("ERROR: Base URL not defined.\n\nPlease enter it in Setup.");
    showSidebar();
    return;
  }

  // get the range
  var sheetIdColName = "%Submission ID";
  var sheet = SpreadsheetApp.getActiveSheet();
  var range = sheet.getDataRange();
  
  // running for the first time (if there's nothing in the sheet)
  var first_run = false;
  if (range.getLastRow() == 1 && range.getLastColumn() == 1) {
    SpreadsheetApp.getUi().alert("Running the script for the first time.\n\nI'll import all the data from the reports URL...");
    first_run = true;
    var parsed = fetchAndParse(softconf_url);
    Logger.log(parsed[0].length);
    Logger.log(parsed[0]);
    // write the header
    range = sheet.getRange(1, 1, 1, parsed[0].length + 4);
    Logger.log(range.getLastColumn());
    Logger.log(range.getLastRow());
    for (var i = 0; i < parsed[0].length; ++i) {
      Logger.log(i);
      range.getCell(1, i+1)
           .setNumberFormat('@STRING@')
           .setValue("%" + parsed[0][i]);
    }
    for (var i = 0; i < url_columns.length; ++i)
      range.getCell(1, parsed[0].length + i)
           .setNumberFormat('@STRING@')
           .setValue(url_columns[i]);
    SpreadsheetApp.getActiveSheet().setFrozenRows(1);
  }
  
  // pre-load the whole table (this is THE speedup)
  var data = range.getValues();
  var header = data[0];
  Logger.log('Spreadsheet data header: ' + header);
  // check for %Submission_ID%
  var idColumn = header.indexOf(sheetIdColName) + 1;
  if (idColumn == 0) {
    SpreadsheetApp.getUi().alert('ERROR: Cannot find "%Submission ID" field.\n\nPlease make sure you included it in the sheet, and check for possible mistypes.');
    return;
  }
  Logger.log('%Submission_ID% position: ' + idColumn);
  
  if (!first_run) {
    var parsed = fetchAndParse(softconf_url);
    // exit upon a fetchAndParse error
    if (parsed == null) {
      return;
    }
  }
  
  // put the url construction functions into an array
  var url_functions = [paper_url, pdf_url, discussion_url, reviews_url];
  

  var columnValues = new Array(sheet.getLastRow() - 1)
  for (var i = 1; i < data.length; i++)
    columnValues[i - 1] = data[i][idColumn - 1];
      
  var id2Row = {};
  for(var i = 0; i <  columnValues.length; i++)
    id2Row[columnValues[i]] = i + 2;
  
  // pre-scan columns
  var foundColumns = [];
  for (var j = 1; j < parsed[0].length; j++) {
    var colName = "%" + parsed[0][j];
    var colIndex = header.indexOf(colName) + 1;
    if (colIndex != 0)
      foundColumns.push([colIndex, j]);
  }
  Logger.log(foundColumns);
  
  var foundURLColumns = [];
  var maxColumn = 0;
  for (var j = 0; j < url_columns.length; j++) {
    var colIndex = header.indexOf(url_columns[j]) + 1
    if (colIndex != 0) {
      foundURLColumns.push([colIndex, j]);
      if (colIndex > maxColumn)
        maxColumn = colIndex;
    }
    
  }
  Logger.log(foundURLColumns);
  
  
  
  var overflow = 0
  
  var updates = [];
  var newRow = columnValues.length + 1;
  // find what to update
  for(var i = 1; i < parsed.length; i++) {
    var id = parsed[i][0];
    var rowForId = id2Row[id] || (++newRow);
    for (var j = 0; j < foundColumns.length; j++) {
      var new_value = parsed[i][foundColumns[j][1]];
      var old_value = ""
      if (rowForId - 1 < data.length)
        old_value = data[rowForId - 1][foundColumns[j][0] - 1];
      if (old_value == new_value)
        continue
      
      updates.push([rowForId, foundColumns[j][0], new_value]);
      // also need to add the id since it's not there in this case!
      if (rowForId > columnValues.length + 1)
        updates.push([rowForId, idColumn, parsed[i][0]]);
    }

    // add generated URLs
    for (var j = 0; j < foundURLColumns.length; j++) {
      var new_value = url_functions[parseInt(foundURLColumns[j][1])](base_url, id);
      var old_value = ""
      if (rowForId - 1 < data.length)
        old_value = data[rowForId - 1][foundURLColumns[j][0] - 1];
      if (old_value == new_value)
        continue
      updates.push([rowForId, foundURLColumns[j][0], new_value]);
    }    
  }
  
  if (maxColumn < range.getLastColumn())
    maxColumn = range.getLastColumn();

  Logger.log('range.getLastRow()', range.getLastRow());
  Logger.log(newRow);
  
  // having all the updates...execute them
  range = sheet.getRange(1, 1, newRow, maxColumn);
  var lastRow = sheet.getLastRow();
  for (var i = 0; i < updates.length; ++i) {
    var font_color = first_run ? 'black' : 'blue';
    range.getCell(updates[i][0], updates[i][1])
           .setNumberFormat('@STRING@')
           .setValue(updates[i][2])
           .setFontColor(font_color);
    Logger.log(updates[i]);
  }
  
  // go over each row r
  // find the submission id column in current sheet
  // find a row with the submission id of the loaded row 
  // if existent, update its columns based on columns that match the name of
  // the loaded columns
  // if not existent, create new row
  // names of sheet columns need to have magic "__" prefix
  
}

Array.prototype.findIndex = function(search){
  if(search == "") return false;
  for (var i=0; i<this.length; i++)
    if (this[i] == search) return i;

  return -1;
} 



// download and parse variables
function fetchAndParse(url) {
  // WARNING: no way to check whether this is a valid/existing url!!
  // partially done through type="url" in Sidebar.html
  try {
    var response = UrlFetchApp.fetch(url);
  } catch (e) {
    SpreadsheetApp.getUi().alert("ERROR: Cannot fetch the report URL.\n\nPlease check the URL for validity.");
    showSidebar();
    return;
  }
  try {
    var parsed = Utilities.parseCsv(response.getContentText());
  } catch (e) {
    SpreadsheetApp.getUi().alert("ERROR: Cannot parse the report CSV. Please check the report URL.");
    showSidebar();
    return;
  }
  Logger.log('CSV data header: ' + parsed[0]);
  return parsed;
}


// load and store the service and th base URLs from user PropertiesService

function loadURLs() {
  var scriptProperties = PropertiesService.getUserProperties();
  var softconf_url = scriptProperties.getProperty('softconf_url');
  var base_url = scriptProperties.getProperty('base_url');
  return [softconf_url, base_url];
}

function storeURLs(formObject) {
  var scriptProperties = PropertiesService.getUserProperties();
  var ui = SpreadsheetApp.getUi();
  
  var base_url = formObject.base_url;
  if (base_url[base_url.length - 1] != '/')
    base_url += "/";
  scriptProperties.setProperty('softconf_url', formObject.softconf_url);
  scriptProperties.setProperty('base_url', base_url);
}


// url construction functions

function paper_url(base_url, paper_id) {
  return base_url + "manager/scmd.cgi?scmd=makeAbstract&paperID=" + paper_id;
}
function pdf_url(base_url, paper_id) {
  return base_url + "manager/scmd.cgi?scmd=getPaper&paperID=" + paper_id + "&filename=" + paper_id + "_file_Paper.pdf";
}
function discussion_url(base_url, paper_id) {
  return base_url + "scmd.cgi?scmd=getMessageBoard&paperID=" + paper_id;
}
function reviews_url(base_url, paper_id) {
  return base_url + "scmd.cgi?scmd=getReport&SelReport=reviewSummary&paperID=" + paper_id;
}
