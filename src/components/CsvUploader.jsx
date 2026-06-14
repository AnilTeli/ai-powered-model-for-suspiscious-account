import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Parses a CSV string into an array of objects.
 * Handles quoted fields (including commas and newlines inside quotes).
 */
function normalizeCsvValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (trimmed === '' || ['NA', 'NaN', 'nan'].includes(trimmed)) return null;

  const num = Number(trimmed);
  return !Number.isNaN(num) ? num : trimmed;
}

function parseCsv(text) {
  const rows = [];
  let i = 0;
  const len = text.length;

  function parseField() {
    if (i >= len || text[i] === '\n' || text[i] === '\r') return '';

    // Quoted field
    if (text[i] === '"') {
      i++; // skip opening quote
      let val = '';
      while (i < len) {
        if (text[i] === '"') {
          if (i + 1 < len && text[i + 1] === '"') {
            val += '"';
            i += 2;
          } else {
            i++; // skip closing quote
            break;
          }
        } else {
          val += text[i];
          i++;
        }
      }
      return val;
    }

    // Unquoted field
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
      i++; // skip comma
      fields.push(parseField());
    }
    // Skip line ending
    if (i < len && text[i] === '\r') i++;
    if (i < len && text[i] === '\n') i++;
    return fields;
  }

  // Parse header
  if (i >= len) return [];
  const headers = parseLine();

  // Parse data rows
  while (i < len) {
    // Skip blank lines
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
        row[key] = normalizeCsvValue(raw);
      }
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Picks the best columns to preview in the table.
 * Priority: account identifiers first, then first few remaining columns.
 */
function pickPreviewColumns(rows, maxCols = 5) {
  if (!rows.length) return [];
  const allCols = Object.keys(rows[0]);

  // Try to find an account/ID column
  const idPatterns = [/^account/i, /^id$/i, /^customer/i, /^name/i, /^acct/i, /^user/i, /^client/i];
  const idCols = [];
  const otherCols = [];

  for (const col of allCols) {
    if (idPatterns.some((p) => p.test(col))) {
      idCols.push(col);
    } else {
      otherCols.push(col);
    }
  }

  const picked = [...idCols.slice(0, 2), ...otherCols.slice(0, maxCols - idCols.slice(0, 2).length)];
  return picked.slice(0, maxCols);
}

const ROWS_PER_PAGE = 8;

export default function CsvUploader({ onRowsLoaded, onSelectRow, selectedRowIdx }) {
  const [fileName, setFileName] = useState(null);
  const [rows, setRows] = useState([]);
  const [previewCols, setPreviewCols] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const fileRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a .csv file');
      return;
    }
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseCsv(e.target.result);
        if (!parsed.length) {
          setError('CSV file is empty or could not be parsed');
          return;
        }
        setRows(parsed);
        setFileName(file.name);
        setPreviewCols(pickPreviewColumns(parsed));
        setPage(0);
        onRowsLoaded(parsed);
      } catch (err) {
        setError(`Parse error: ${err.message}`);
      }
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  }, [onRowsLoaded]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClear = () => {
    setRows([]);
    setFileName(null);
    setPreviewCols([]);
    setError(null);
    setPage(0);
    if (fileRef.current) fileRef.current.value = '';
    onRowsLoaded([]);
    onSelectRow(null);
  };

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const pagedRows = rows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  // ─── No file uploaded: show the drop zone ────────────────────────
  if (!rows.length) {
    return (
      <div className="bg-white rounded-xl border border-dashboard-border p-6 shadow-sm">
        {/* Step badge + title */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-blue text-white text-xs font-bold">
            1
          </div>
          <span
            className="font-semibold text-[15px] text-dashboard-text tracking-tight"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            Upload Customer CSV
          </span>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-3 py-12 px-6 rounded-xl cursor-pointer
            border-2 border-dashed transition-all duration-200
            ${isDragging
              ? 'border-primary-blue bg-blue-50/60 scale-[1.01]'
              : 'border-slate-200 hover:border-primary-blue/50 hover:bg-slate-50/50'
            }
          `}
        >
          <div className={`
            w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-200
            ${isDragging ? 'bg-primary-blue/10' : 'bg-slate-100'}
          `}>
            <Upload
              size={26}
              className={`transition-colors duration-200 stroke-[2] ${isDragging ? 'text-primary-blue' : 'text-slate-400'}`}
            />
          </div>

          <div className="text-center">
            <p className="text-[14px] font-semibold text-slate-600">
              {isDragging ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
            </p>
            <p className="text-[12px] text-slate-400 mt-1">
              or <span className="text-primary-blue font-semibold">click to browse</span>
            </p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-500 text-[13px] font-medium">
            <X size={14} className="stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // ─── File uploaded: show rows table ──────────────────────────────
  return (
    <div className="bg-white rounded-xl border border-dashboard-border p-6 shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-blue text-white text-xs font-bold">
            1
          </div>
          <span
            className="font-semibold text-[15px] text-dashboard-text tracking-tight"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            Select Account to Analyze
          </span>
        </div>

        {/* File badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-green-50 text-green-700 text-[12px] font-semibold px-3 py-1.5 rounded-lg">
            <FileSpreadsheet size={14} className="stroke-[2]" />
            <span>{fileName}</span>
            <span className="text-green-500 font-normal">
              — {rows.length} row{rows.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={handleClear}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            title="Clear CSV"
          >
            <X size={15} className="stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-dashboard-border">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-slate-50 border-b border-dashboard-border">
              <th className="text-left px-4 py-2.5 text-slate-400 font-bold tracking-wider text-[11px] w-8">
                
              </th>
              <th className="text-left px-4 py-2.5 text-slate-400 font-bold tracking-wider text-[11px]">
                ROW
              </th>
              {previewCols.map((col) => (
                <th
                  key={col}
                  className="text-left px-4 py-2.5 text-slate-400 font-bold tracking-wider text-[11px] max-w-[160px] truncate"
                >
                  {col.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row, i) => {
              const globalIdx = page * ROWS_PER_PAGE + i;
              const isSelected = selectedRowIdx === globalIdx;
              return (
                <tr
                  key={globalIdx}
                  onClick={() => onSelectRow(globalIdx)}
                  className={`
                    cursor-pointer transition-colors duration-100 border-b border-slate-50 last:border-0
                    ${isSelected
                      ? 'bg-blue-50/70 hover:bg-blue-50'
                      : 'hover:bg-slate-50/70'
                    }
                  `}
                >
                  {/* Radio indicator */}
                  <td className="px-4 py-2.5">
                    <div className={`
                      w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                      ${isSelected ? 'border-primary-blue' : 'border-slate-300'}
                    `}>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary-blue" />
                      )}
                    </div>
                  </td>
                  {/* Row number */}
                  <td className="px-4 py-2.5 font-semibold text-slate-500">
                    {globalIdx + 1}
                  </td>
                  {/* Preview columns */}
                  {previewCols.map((col) => (
                    <td
                      key={col}
                      className="px-4 py-2.5 text-slate-600 font-medium max-w-[160px] truncate"
                      title={String(row[col] ?? '')}
                    >
                      {row[col] !== undefined && row[col] !== null
                        ? typeof row[col] === 'number'
                          ? Number.isInteger(row[col]) ? row[col] : row[col].toFixed(4)
                          : String(row[col])
                        : '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination + selection status */}
      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        {/* Selected row indicator */}
        <div className="text-[12px] text-slate-400 font-medium">
          {selectedRowIdx !== null ? (
            <span className="flex items-center gap-1.5 text-primary-blue font-semibold">
              <CheckCircle2 size={14} className="stroke-[2.5]" />
              Row {selectedRowIdx + 1} selected
            </span>
          ) : (
            <span>Click a row to select it for analysis</span>
          )}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-primary-blue hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} className="stroke-[2.5]" />
            </button>
            <span className="text-[12px] font-semibold text-slate-400 px-2">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-primary-blue hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight size={16} className="stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
