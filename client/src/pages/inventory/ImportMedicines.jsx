import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import {
  FiUploadCloud,
  FiFile,
  FiX,
  FiDownload,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiLoader,
  FiArrowRight,
} from 'react-icons/fi';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { importMedicines } from '../../services/medicineService';

const REQUIRED_FIELDS = [
  'medicineName',
  'manufacturer',
  'category',
  'batchNumber',
  'expiryDate',
  'quantity',
  'purchasePrice',
  'sellingPrice',
];
const PREVIEW_LIMIT = 50;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // must match server/middleware/uploadMiddleware.js

const SAMPLE_CSV = `medicineName,genericName,category,manufacturer,batchNumber,expiryDate,quantity,purchasePrice,sellingPrice,reorderLevel,description
Paracetamol 500mg,Acetaminophen,Tablet,Pfizer Inc,BATCH-2026-001,2027-06-30,500,1.20,2.50,50,Pain reliever and fever reducer
Amoxicillin 250mg,Amoxicillin,Capsule,Cipla Ltd,BATCH-2026-002,2026-12-31,300,3.00,5.75,30,Broad-spectrum antibiotic
Cetirizine 10mg,Cetirizine Hydrochloride,Tablet,Sun Pharma,BATCH-2026-003,2027-03-15,800,0.50,1.20,100,Antihistamine for allergy relief
`;

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

// Best-effort client-side mirror of the server's validation, used only to build
// the preview. The backend re-validates everything - this is a UX convenience.
const validateRow = (row, seenKeys) => {
  const errors = [];

  REQUIRED_FIELDS.forEach((field) => {
    if (isBlank(row[field])) errors.push(`${field} is required`);
  });

  ['quantity', 'purchasePrice', 'sellingPrice', 'reorderLevel'].forEach((field) => {
    if (!isBlank(row[field]) && (Number.isNaN(Number(row[field])) || Number(row[field]) < 0)) {
      errors.push(`${field} must be a non-negative number`);
    }
  });

  if (!isBlank(row.expiryDate) && Number.isNaN(new Date(row.expiryDate).getTime())) {
    errors.push('expiryDate is not a valid date');
  }

  if (!isBlank(row.medicineName) && !isBlank(row.batchNumber)) {
    const key = `${row.medicineName.trim().toLowerCase()}|${row.batchNumber.trim().toLowerCase()}`;
    if (seenKeys.has(key)) {
      errors.push('duplicate medicineName + batchNumber within this file');
    } else {
      seenKeys.add(key);
    }
  }

  return errors;
};

const ImportMedicines = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const resetState = () => {
    setFile(null);
    setRows([]);
    setParseError('');
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseFile = useCallback((selectedFile) => {
    setResult(null);
    setParseError('');
    setRows([]);
    setParsing(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        if (results.data.length === 0) {
          setParseError('The CSV file has no data rows');
          setParsing(false);
          return;
        }

        const seenKeys = new Set();
        const validated = results.data.map((row, idx) => ({
          rowNumber: idx + 2,
          data: row,
          errors: validateRow(row, seenKeys),
        }));

        setRows(validated);
        setParsing(false);
      },
      error: (err) => {
        setParseError(err.message || 'Could not parse this CSV file');
        setParsing(false);
      },
    });
  }, []);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a .csv file');
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      toast.error('File is too large. Maximum size is 5MB.');
      return;
    }
    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setProgress(0);
    setResult(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await importMedicines(formData, {
        signal: controller.signal,
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      setResult(data.data);
      toast.success(data.message || 'Import completed');
    } catch (error) {
      if (error.code === 'ERR_CANCELED') {
        toast('Import cancelled');
      } else {
        toast.error(error.response?.data?.message || 'Failed to import medicines');
      }
    } finally {
      setImporting(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelImport = () => {
    abortControllerRef.current?.abort();
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'medicine_import_sample.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Medicine Database"
        description="Bulk-upload thousands of medicines at once from a prepared CSV file."
        action={
          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-2xl border border-white/10 transition-colors"
          >
            <FiDownload size={16} />
            Sample CSV
          </button>
        }
      />

      {!result && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-1">1. Choose a CSV file</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Required columns: <span className="font-mono">medicineName, manufacturer, category, batchNumber,
              expiryDate, quantity, purchasePrice, sellingPrice</span>. Optional:{' '}
              <span className="font-mono">genericName, reorderLevel, description</span>.
            </p>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
              isDragging ? 'border-[#346560] bg-[#346560]/5' : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            {!file ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#346560]/10 text-[#346560] flex items-center justify-center mx-auto mb-4">
                  <FiUploadCloud size={26} />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">Drag and drop your CSV file here</p>
                <p className="text-xs text-slate-400 mb-4">or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#346560] hover:bg-[#2b5450] text-white text-sm font-medium px-6 py-3 rounded-2xl shadow-lg shadow-[#346560]/20 transition-all"
                >
                  Choose CSV File
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#346560]/10 text-[#346560] flex items-center justify-center shrink-0">
                  <FiFile size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={resetState}
                  disabled={importing}
                  className="ml-2 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
                  title="Remove file"
                >
                  <FiX size={18} />
                </button>
              </div>
            )}
          </div>

          {parsing && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FiLoader className="animate-spin" size={16} /> Reading CSV file...
            </div>
          )}

          {parseError && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl p-4">
              <FiXCircle size={18} className="shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          {rows.length > 0 && !parsing && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-800 mb-3">2. Review before importing</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard
                    icon={FiFile}
                    label="Total Rows"
                    value={rows.length}
                    bgTint="bg-slate-100"
                    iconColor="text-slate-600"
                    borderColor="border-slate-200"
                  />
                  <StatCard
                    icon={FiCheckCircle}
                    label="Ready to Import"
                    value={validRows.length}
                    bgTint="bg-emerald-500/10"
                    iconColor="text-emerald-600"
                    borderColor="border-emerald-500/20"
                  />
                  <StatCard
                    icon={FiAlertTriangle}
                    label="Rows with Issues"
                    value={invalidRows.length}
                    bgTint="bg-amber-500/10"
                    iconColor="text-amber-600"
                    borderColor="border-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">
                  Preview {rows.length > PREVIEW_LIMIT && `(first ${PREVIEW_LIMIT} of ${rows.length} rows)`}
                </h3>
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                  <div className="overflow-auto max-h-96">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Row</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Medicine</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Batch</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Expiry</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.slice(0, PREVIEW_LIMIT).map((r) => (
                          <tr key={r.rowNumber} className={r.errors.length ? 'bg-rose-50/50' : ''}>
                            <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{r.rowNumber}</td>
                            <td className="px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap">
                              {r.data.medicineName || '—'}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">
                              {r.data.batchNumber || '—'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{r.data.quantity || '—'}</td>
                            <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{r.data.expiryDate || '—'}</td>
                            <td className="px-4 py-2.5">
                              {r.errors.length ? (
                                <span className="text-rose-600 font-medium">{r.errors.join(', ')}</span>
                              ) : (
                                <span className="text-emerald-600 font-medium">Valid</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {invalidRows.length > 0 && (
                  <p className="text-xs text-amber-600 mt-2">
                    Rows with issues will be skipped automatically during import - fix and re-upload if you want them included.
                  </p>
                )}
              </div>

              {importing && (
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#346560] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  onClick={resetState}
                  disabled={importing}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <div className="w-full sm:w-auto flex items-center gap-3">
                  {importing && (
                    <button
                      onClick={handleCancelImport}
                      className="px-4 py-3 rounded-2xl border border-rose-200 text-rose-600 text-sm font-medium hover:bg-rose-50 transition-colors whitespace-nowrap"
                    >
                      Cancel Import
                    </button>
                  )}
                  <button
                    onClick={handleImport}
                    disabled={importing || validRows.length === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#346560] hover:bg-[#2b5450] disabled:opacity-50 text-white text-sm font-medium px-6 py-3 rounded-2xl shadow-lg shadow-[#346560]/20 transition-all whitespace-nowrap"
                  >
                    {importing ? (
                      <>
                        <FiLoader className="animate-spin" size={16} /> Importing... {progress}%
                      </>
                    ) : (
                      <>Import {validRows.length} Medicine{validRows.length === 1 ? '' : 's'}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={FiCheckCircle}
              label="Successfully Imported"
              value={result.summary.imported}
              bgTint="bg-emerald-500/10"
              iconColor="text-emerald-600"
              borderColor="border-emerald-500/20"
            />
            <StatCard
              icon={FiAlertTriangle}
              label="Skipped Duplicates"
              value={result.summary.skippedDuplicates}
              bgTint="bg-amber-500/10"
              iconColor="text-amber-600"
              borderColor="border-amber-500/20"
            />
            <StatCard
              icon={FiXCircle}
              label="Failed / Invalid"
              value={result.summary.failed}
              bgTint="bg-rose-500/10"
              iconColor="text-rose-600"
              borderColor="border-rose-500/20"
            />
          </div>

          {result.duplicates?.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Skipped Duplicates ({result.duplicates.length})</h3>
              <div className="max-h-60 overflow-y-auto space-y-1.5">
                {result.duplicates.map((d, i) => (
                  <div key={i} className="text-xs text-slate-600 flex flex-wrap items-center gap-2 py-2 px-3 bg-amber-50 rounded-xl">
                    <span className="text-slate-400">Row {d.row}</span>
                    <span className="font-medium">{d.medicineName}</span>
                    <span className="text-slate-400">batch {d.batchNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.errors?.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Failed Records ({result.errors.length})</h3>
              <div className="max-h-60 overflow-y-auto space-y-1.5">
                {result.errors.map((e, i) => (
                  <div key={i} className="text-xs bg-rose-50 rounded-xl py-2 px-3">
                    <span className="text-slate-400 mr-2">Row {e.row ?? '—'}</span>
                    <span className="font-medium text-slate-700">{e.medicineName}</span>
                    <div className="text-rose-600 mt-0.5">{e.errors.join('; ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              onClick={resetState}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Import Another File
            </button>
            <button
              onClick={() => navigate('/medicines')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#346560] hover:bg-[#2b5450] text-white text-sm font-medium px-6 py-3 rounded-2xl shadow-lg shadow-[#346560]/20 transition-all"
            >
              View Medicine Inventory <FiArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportMedicines;
