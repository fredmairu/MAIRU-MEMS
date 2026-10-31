/* Bulk CSV import for MEMS. Files are processed in the browser and are not stored. */
(function () {
  const aliases = {
    actions: {
      id: ['id', 'action id'], workstream: ['workstream'], action: ['action', 'action / deliverable', 'deliverable'],
      owner: ['owner', 'responsible', 'responsible / lead'], deadline: ['deadline', 'due date'],
      status: ['status'], source: ['source', 'source log / notes'], notes: ['notes', 'additional notes']
    },
    correspondence: {
      id: ['id', 'correspondence id'], dateReceived: ['date received', 'datereceived'], reference: ['reference', 'reference number'],
      letterDate: ['letter date', 'letterdate'], sender: ['sender'], category: ['category'], subject: ['subject'], summary: ['summary', 'key action points / summary'],
      assignedName: ['assigned officer name', 'assignedname', 'assigned to'], assignedTitle: ['assigned officer title', 'assignedtitle'],
      dateAssigned: ['date assigned', 'dateassigned'], deadline: ['deadline', 'response deadline'], eventDate: ['event date', 'eventdate'],
      rsvpDeadline: ['rsvp deadline', 'rsvp / response deadline'], invitationResponse: ['invitation response'], attendanceStatus: ['attendance status'],
      escalationLevel: ['escalation level'], escalatedTo: ['escalated to'], status: ['status'], closureStatus: ['closure status'],
      feedback: ['feedback', 'latest feedback'], notes: ['notes']
    }
  };

  const normalize = value => String(value || '').trim().toLowerCase().replace(/[ _-]+/g, ' ');
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function parseCsv(text) {
    const rows = []; let row = []; let value = ''; let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i], next = text[i + 1];
      if (quoted && ch === '"' && next === '"') { value += '"'; i++; }
      else if (ch === '"') quoted = !quoted;
      else if (ch === ',' && !quoted) { row.push(value); value = ''; }
      else if ((ch === '\n' || ch === '\r') && !quoted) {
        if (ch === '\r' && next === '\n') i++;
        row.push(value); if (row.some(cell => cell.trim())) rows.push(row); row = []; value = '';
      } else value += ch;
    }
    row.push(value); if (row.some(cell => cell.trim())) rows.push(row);
    if (quoted) throw new Error('The CSV has an unfinished quoted value.');
    return rows;
  }

  function fieldMap(headers, which) {
    const mapped = {};
    Object.entries(aliases[which]).forEach(([field, names]) => {
      const index = headers.findIndex(header => names.includes(normalize(header)));
      if (index >= 0) mapped[field] = index;
    });
    return mapped;
  }

  function requiredFields(which) { return which === 'actions' ? ['action', 'owner'] : ['sender', 'subject']; }

  function isIsoDate(value) { return !value || /^\d{4}-\d{2}-\d{2}$/.test(value); }

  function makeId(which, used) {
    const prefix = which === 'actions' ? 'ACT' : 'COR';
    let highest = 0;
    used.forEach(id => { const match = String(id).match(/(\d+)$/); if (match) highest = Math.max(highest, Number(match[1])); });
    let id;
    do { id = prefix + '-' + String(++highest).padStart(4, '0'); } while (used.has(id));
    return id;
  }

  function validateRows(rows, which) {
    if (rows.length < 2) throw new Error('The CSV needs a heading row and at least one record.');
    const map = fieldMap(rows[0], which);
    const missingHeadings = requiredFields(which).filter(field => map[field] === undefined);
    if (missingHeadings.length) throw new Error('Missing required heading' + (missingHeadings.length > 1 ? 's' : '') + ': ' + missingHeadings.join(', ') + '.');
    const existing = new Set((which === 'actions' ? actions : correspondence).map(record => record.id));
    const valid = [], problems = [];
    rows.slice(1).forEach((cells, rowIndex) => {
      const record = {};
      Object.entries(map).forEach(([field, index]) => record[field] = String(cells[index] || '').trim());
      const rowNumber = rowIndex + 2;
      const absent = requiredFields(which).filter(field => !record[field]);
      const dateProblem = ['dateReceived','letterDate','dateAssigned','deadline','eventDate','rsvpDeadline'].find(field => !isIsoDate(record[field]));
      if (absent.length) { problems.push('Row ' + rowNumber + ': missing ' + absent.join(' and ') + '.'); return; }
      if (dateProblem) { problems.push('Row ' + rowNumber + ': ' + dateProblem + ' must use YYYY-MM-DD.'); return; }
      record.id = record.id || makeId(which, existing);
      if (existing.has(record.id)) { problems.push('Row ' + rowNumber + ': ID ' + record.id + ' already exists.'); return; }
      existing.add(record.id);
      valid.push(record);
    });
    return { valid, problems, headings: rows[0] };
  }

  window.openBulkImport = function (which) {
    const title = which === 'actions' ? 'actions' : 'correspondence';
    $('modalHost').innerHTML = `<div class="modalback" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modalhead"><h3>Import ${title} from CSV</h3><button type="button" class="btn small" onclick="closeModal()">✕</button></div><div class="modalbody"><p>Select a CSV file. MEMS checks the rows and lets you review them before anything is saved.</p><p class="secondary">Required columns: <b>${which === 'actions' ? 'action, owner' : 'sender, subject'}</b>. Dates must be written as YYYY-MM-DD.</p><div class="formfield"><label>CSV file</label><input id="bulkImportFile" type="file" accept=".csv,text/csv"></div><div id="bulkImportResult" class="notice hidden" style="margin-top:14px"></div></div><div class="modalfoot"><button type="button" class="btn" onclick="closeModal()">Cancel</button><div style="display:flex;gap:8px"><button class="btn" type="button" onclick="downloadImportTemplate('${which}')">Download template</button><button id="bulkImportReview" class="btn primary" type="button">Review file</button></div></div></div></div>`;
    $('bulkImportReview').onclick = () => readImportFile(which);
  };

  window.downloadImportTemplate = function (which) {
    const rows = which === 'actions'
      ? [['id','workstream','action','owner','deadline','status','source','notes'], ['ACT-0001','MANAGEMENT','Example action','Officer name','2026-11-07','Open','','']]
      : [['id','date received','reference','sender','category','subject','assigned officer name','assigned officer title','response deadline','status','closure status','notes'], ['COR-0001','2026-11-01','REF-001','Example sender','General','Example subject','Officer name','Officer title','2026-11-07','Received','No','']];
    const csv = rows.map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const file = new Blob(['\ufeff' + csv], {type: 'text/csv;charset=utf-8;'});
    const link = document.createElement('a'); link.href = URL.createObjectURL(file); link.download = which + '-import-template.csv'; link.click(); URL.revokeObjectURL(link.href);
  };

  function readImportFile(which) {
    const file = $('bulkImportFile').files[0], result = $('bulkImportResult');
    if (!file) { toast('Choose a CSV file first.'); return; }
    const reader = new FileReader();
    reader.onerror = () => toast('MEMS could not read that file.');
    reader.onload = () => {
      try { showImportReview(which, validateRows(parseCsv(String(reader.result || '')), which)); }
      catch (error) { result.textContent = error.message; result.className = 'notice'; }
    };
    reader.readAsText(file);
  }

  function showImportReview(which, result) {
    const preview = result.valid.slice(0, 8);
    const label = which === 'actions' ? 'actions' : 'correspondence records';
    const summary = result.problems.length ? `${result.problems.length} row(s) will be skipped.` : 'All rows passed the checks.';
    $('modalHost').innerHTML = `<div class="modalback" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modalhead"><h3>Review import</h3><button type="button" class="btn small" onclick="closeModal()">✕</button></div><div class="modalbody"><div class="notice success"><b>${result.valid.length}</b> ${label} ready to import. ${escapeHtml(summary)}</div>${result.problems.length ? `<div class="notice"><b>Rows not imported:</b><br>${result.problems.slice(0,10).map(escapeHtml).join('<br>')}${result.problems.length > 10 ? '<br>Additional rows have also been skipped.' : ''}</div>` : ''}<div class="tablewrap"><table class="table" style="min-width:540px"><thead><tr>${which === 'actions' ? '<th>ID</th><th>Action</th><th>Responsible</th><th>Deadline</th>' : '<th>ID</th><th>Sender</th><th>Subject</th><th>Deadline</th>'}</tr></thead><tbody>${preview.map(record => which === 'actions' ? `<tr><td>${escapeHtml(record.id)}</td><td>${escapeHtml(record.action)}</td><td>${escapeHtml(record.owner)}</td><td>${escapeHtml(record.deadline || '—')}</td></tr>` : `<tr><td>${escapeHtml(record.id)}</td><td>${escapeHtml(record.sender)}</td><td>${escapeHtml(record.subject)}</td><td>${escapeHtml(record.deadline || '—')}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">No valid rows to import.</td></tr>'}</tbody></table></div>${result.valid.length > preview.length ? `<p class="secondary">Previewing the first ${preview.length} records.</p>` : ''}</div><div class="modalfoot"><button type="button" class="btn" onclick="closeModal()">Cancel</button>${result.valid.length ? '<button id="confirmBulkImport" class="btn primary" type="button">Import ' + result.valid.length + ' record(s)</button>' : ''}</div></div></div>`;
    if (result.valid.length) $('confirmBulkImport').onclick = () => commitImport(which, result.valid);
  }

  async function commitImport(which, records) {
    const button = $('confirmBulkImport'); button.disabled = true; button.textContent = 'Importing…';
    const target = which === 'actions' ? actions : correspondence;
    const before = target.slice(); target.push(...records);
    try {
      if (cloud) {
        await syncCloud(which);
        updateCounts();
      } else {
        saveLocal();
      }
      closeModal(); updateCounts(); renderDashboard(); renderStanleyDashboard(); renderCorrespondenceDashboard(); renderOverdue();
      if (which === 'actions') renderActions(); else renderCorr();
      toast(records.length + ' record(s) imported successfully.');
    } catch (error) {
      target.splice(0, target.length, ...before);
      toast('Import failed: ' + (error.message || 'please try again.'));
      button.disabled = false; button.textContent = 'Try import again';
    }
  }
})();
