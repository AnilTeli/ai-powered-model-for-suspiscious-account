const fs = require('fs');

function parseCsv(text) {
  const rows = [];
  let i = 0;
  const len = text.length;

  function parseField() {
    if (i >= len || text[i] === '\n' || text[i] === '\r') return '';
    if (text[i] === '"') {
      i++;
      let val = '';
      while (i < len) {
        if (text[i] === '"') {
          if (i + 1 < len && text[i + 1] === '"') {
            val += '"';
            i += 2;
          } else {
            i++;
            break;
          }
        } else {
          val += text[i];
          i++;
        }
      }
      return val;
    }
    let val = '';
    while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
      val += text[i];
      i++;
    }
    return val;
  }

  function parseLine() {
    const fields = [];
    fields.push(parseField());
    while (i < len && text[i] === ',') {
      i++;
      fields.push(parseField());
    }
    if (i < len && text[i] === '\r') i++;
    if (i < len && text[i] === '\n') i++;
    return fields;
  }

  if (i >= len) return [];
  const headers = parseLine();

  while (i < len) {
    if (text[i] === '\n' || text[i] === '\r') {
      if (text[i] === '\r') i++;
      if (i < len && text[i] === '\n') i++;
      continue;
    }
    const fields = parseLine();
    if (fields.length === 1 && fields[0] === '') continue;
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j]?.trim();
      if (key) {
        const raw = fields[j] ?? '';
        const num = Number(raw);
        row[key] = raw !== '' && !isNaN(num) ? num : raw;
      }
    }
    rows.push(row);
  }
  return rows;
}

const text = fs.readFileSync('backend/DataSet.csv', 'utf-8');
const rows = parseCsv(text);

async function testRows() {
  for (let idx = 0; typeof idx === 'number' && idx < rows.length; idx++) {
    const row = rows[idx];
    const res = await fetch('http://127.0.0.1:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row)
    });
    if (res.status === 422) {
      const json = await res.json();
      console.log(`Row ${idx} returned 422!`);
      console.log(`Error:`, json.detail);
      console.log(`Payload preview:`, JSON.stringify(Object.entries(row).slice(0, 10)));
      break;
    }
  }
}

testRows();
