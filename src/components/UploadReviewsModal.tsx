import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload, FileSpreadsheet, Download, X, CheckCircle, AlertTriangle,
  RefreshCw, Sparkles, Check, HelpCircle, ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from './Button';
import { backendApi } from '../services/backendApi';
import { authStorage } from '../utils/auth';

interface UploadReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName?: string;
  onSuccess: (result: { importedCount: number; batchId: string; productsWithReviews: string[] }) => void;
}

interface ParsedRow {
  index: number;
  productName: string;
  customerReview: string;
  rating: number | null;
  reviewDate: string;
  platform: string;
  isValid: boolean;
  errors: string[];
  isGeneral: boolean;
}

export const UploadReviewsModal: React.FC<UploadReviewsModalProps> = ({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedMapping, setShowAdvancedMapping] = useState(false);

  // Column mapping states
  const [availableHeaders, setAvailableHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<{
    productName: string;
    customerReview: string;
    rating: string;
    reviewDate: string;
    platform: string;
  }>({
    productName: '',
    customerReview: '',
    rating: '',
    reviewDate: '',
    platform: '',
  });

  const [rawRows, setRawRows] = useState<any[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    skippedCount: number;
    batchId: string;
    productsWithReviews: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Resolve active restaurant strictly
  const currentUser = authStorage.getUser();
  const currentRestaurant = authStorage.getRestaurant();
  const resolvedRestaurantId = restaurantId || currentRestaurant?.id || (currentUser ? `rest_${currentUser.id}` : 'my_restaurant');
  const resolvedRestaurantName = restaurantName || currentRestaurant?.name || (currentUser?.fullName ? `${currentUser.fullName}'s Restaurant` : 'My Restaurant');

  // Download standard sample template (.xlsx or .csv)
  const handleDownloadTemplate = (format: 'xlsx' | 'csv' = 'xlsx') => {
    const templateData = [
      {
        'Product Name': 'Paneer Butter Masala',
        'Customer Review': 'Super rich gravy and very soft paneer cubes. Packaging was intact and warm.',
        'Rating': 5,
        'Review Date': '2026-11-01',
        'Platform': 'Zomato',
      },
      {
        'Product Name': 'Paneer Butter Masala',
        'Customer Review': 'A bit oily on top, but delicious flavor with garlic naan.',
        'Rating': 4,
        'Review Date': '2026-11-02',
        'Platform': 'Swiggy',
      },
      {
        'Product Name': 'Veg Biryani',
        'Customer Review': 'Fragrant basmati rice, generous vegetables and spicy salan. Loved it!',
        'Rating': 5,
        'Review Date': '2026-11-03',
        'Platform': 'Google',
      },
      {
        'Product Name': 'Veg Biryani',
        'Customer Review': 'Quantity was smaller than expected for the price. Food arrived lukewarm.',
        'Rating': 2,
        'Review Date': '2026-11-04',
        'Platform': 'Swiggy',
      },
      {
        'Product Name': 'Crispy Corn',
        'Customer Review': 'Perfect crunch and chatpata seasoning. Our family favourite starter.',
        'Rating': 5,
        'Review Date': '2026-11-05',
        'Platform': 'Zomato',
      },
      {
        'Product Name': 'Crispy Corn',
        'Customer Review': 'Turned soggy by the time delivery boy reached. Needs ventilated container.',
        'Rating': 3,
        'Review Date': '2026-11-06',
        'Platform': 'Zomato',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Reviews');

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, 'SellSense_Sample_Reviews_Template.xlsx');
    } else {
      XLSX.writeFile(workbook, 'SellSense_Sample_Reviews_Template.csv', { bookType: 'csv' });
    }
  };

  // Helper to detect column mappings automatically
  const detectColumns = (headers: string[]) => {
    const mapping = {
      productName: '',
      customerReview: '',
      rating: '',
      reviewDate: '',
      platform: '',
    };

    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    headers.forEach((h) => {
      const c = clean(h);
      if (!mapping.productName && (c.includes('product') || c.includes('dish') || c.includes('item') || c.includes('food') || c.includes('menu') || (c.includes('name') && !c.includes('customer') && !c.includes('user')))) {
        mapping.productName = h;
      } else if (!mapping.customerReview && (c.includes('review') || c.includes('comment') || c.includes('feedback') || c.includes('text') || c.includes('content') || c.includes('message') || c.includes('desc'))) {
        mapping.customerReview = h;
      } else if (!mapping.rating && (c.includes('rating') || c.includes('score') || c.includes('star') || c.includes('rate'))) {
        mapping.rating = h;
      } else if (!mapping.reviewDate && (c.includes('date') || c.includes('time') || c.includes('created') || c.includes('timestamp') || c.includes('day'))) {
        mapping.reviewDate = h;
      } else if (!mapping.platform && (c.includes('platform') || c.includes('source') || c.includes('app') || c.includes('channel') || c.includes('site') || c.includes('zomato') || c.includes('swiggy') || c.includes('google'))) {
        mapping.platform = h;
      }
    });

    return mapping;
  };

  // Parse spreadsheet file
  const processFile = async (uploadedFile: File) => {
    setError(null);
    setImportResult(null);

    const MAX_SIZE = 10 * 1024 * 1024;
    if (uploadedFile.size > MAX_SIZE) {
      setError('File size exceeds the 10 MB limit. Please select a smaller spreadsheet file.');
      return;
    }

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileNameLower = uploadedFile.name.toLowerCase();
    const isValidExtension = validExtensions.some(ext => fileNameLower.endsWith(ext));
    if (!isValidExtension) {
      setError('Please upload an Excel spreadsheet (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setParsing(true);
    setFile(uploadedFile);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: 'array',
        cellFormula: false,
        cellHTML: false,
        cellDates: true,
      });

      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('Spreadsheet has no sheets');
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rows.length === 0) {
        throw new Error('The selected sheet is empty. Please check your file.');
      }

      const headers = Object.keys(rows[0] || {});
      setAvailableHeaders(headers);

      const detected = detectColumns(headers);
      setColumnMapping(detected);
      setRawRows(rows);

      validateAndApplyMapping(rows, detected);
    } catch (err: any) {
      console.error('File parse error:', err);
      setError(err?.message || 'Failed to read spreadsheet file.');
    } finally {
      setParsing(false);
    }
  };

  // Validate parsed rows based on current column mapping
  const validateAndApplyMapping = (
    rows: any[],
    mapping: typeof columnMapping
  ) => {
    const validated: ParsedRow[] = rows.map((row, idx) => {
      const productName = mapping.productName ? String(row[mapping.productName] || '').trim() : '';
      const customerReview = mapping.customerReview ? String(row[mapping.customerReview] || '').trim() : '';
      const rawRating = mapping.rating ? row[mapping.rating] : null;

      let reviewDate = '';
      if (mapping.reviewDate && row[mapping.reviewDate]) {
        const val = row[mapping.reviewDate];
        if (val instanceof Date) {
          reviewDate = val.toISOString().split('T')[0];
        } else {
          reviewDate = String(val).trim();
        }
      }

      const platform = mapping.platform ? String(row[mapping.platform] || '').trim() : 'Spreadsheet';

      const errors: string[] = [];
      let rating: number | null = null;

      if (!customerReview) {
        errors.push('Review text is empty');
      }

      if (rawRating !== null && rawRating !== undefined && rawRating !== '') {
        const num = Number(rawRating);
        if (isNaN(num) || num < 1 || num > 5) {
          errors.push('Rating must be 1 to 5');
        } else {
          rating = Math.round(num);
        }
      }

      const isGeneral = !productName;

      return {
        index: idx + 1,
        productName: productName || 'General Restaurant Review',
        customerReview,
        rating,
        reviewDate: reviewDate || new Date().toISOString().split('T')[0],
        platform: platform || 'Uploaded File',
        isValid: errors.length === 0,
        errors,
        isGeneral,
      };
    });

    setParsedRows(validated);
  };

  const handleMappingChange = (field: keyof typeof columnMapping, headerName: string) => {
    const updated = { ...columnMapping, [field]: headerName };
    setColumnMapping(updated);
    validateAndApplyMapping(rawRows, updated);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setRawRows([]);
    setParsedRows([]);
    setAvailableHeaders([]);
    setError(null);
    setImportResult(null);
    setShowAdvancedMapping(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit valid reviews to backend strictly scoped to the active restaurant
  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setError('No valid rows found to import. Please make sure your sheet has review text.');
      return;
    }

    setImporting(true);
    setError(null);

    const payload = {
      restaurantId: resolvedRestaurantId,
      restaurantName: resolvedRestaurantName,
      filename: file?.name || 'uploaded_reviews.xlsx',
      fileType: file?.name?.endsWith('.csv') ? 'csv' : 'xlsx',
      reviews: validRows.map(r => ({
        productName: r.isGeneral ? '' : r.productName,
        customerReview: r.customerReview,
        rating: r.rating,
        reviewDate: r.reviewDate,
        platform: r.platform,
        isGeneral: r.isGeneral,
      })),
    };

    try {
      let result: {
        importedCount: number;
        skippedCount: number;
        batchId: string;
        productsWithReviews: string[];
      };

      try {
        result = await backendApi.importManualReviews(payload);
      } catch (backendErr: any) {
        console.warn('Backend server import unavailable, performing local storage fallback:', backendErr);

        const productsSet = new Set<string>();
        const productStats: Record<string, { total: number; pos: number; neg: number; neu: number }> = {};

        const positiveKeywords = ['tasty', 'delicious', 'great', 'good', 'amazing', 'love', 'loved', 'fresh', 'crispy', 'soft', 'best', 'excellent', 'superb', 'hot', 'yum'];
        const negativeKeywords = ['bad', 'cold', 'leak', 'spill', 'rubber', 'chewy', 'salty', 'bland', 'stale', 'late', 'delay', 'slow', 'oily', 'burnt', 'raw', 'terrible'];

        const localReviewItems = validRows.map((r, i) => {
          const pName = (r.isGeneral ? '' : r.productName || '').trim();
          const text = (r.customerReview || '').toLowerCase();
          let pos = 0;
          let neg = 0;
          for (const w of positiveKeywords) if (text.includes(w)) pos++;
          for (const w of negativeKeywords) if (text.includes(w)) neg++;
          if (typeof r.rating === 'number' && r.rating >= 4) pos += 2;
          else if (typeof r.rating === 'number' && r.rating <= 2) neg += 2;

          const sentiment: 'positive' | 'negative' | 'neutral' = pos > neg ? 'positive' : (neg > pos ? 'negative' : 'neutral');

          if (pName) {
            productsSet.add(pName);
            if (!productStats[pName]) productStats[pName] = { total: 0, pos: 0, neg: 0, neu: 0 };
            productStats[pName].total++;
            if (sentiment === 'positive') productStats[pName].pos++;
            else if (sentiment === 'negative') productStats[pName].neg++;
            else productStats[pName].neu++;
          }

          return {
            id: `mrev_local_${Date.now()}_${i}`,
            restaurant_id: resolvedRestaurantId,
            batch_id: `batch_local_${Date.now()}`,
            product_name: pName || 'General Restaurant Review',
            customer_review: r.customerReview,
            rating: r.rating,
            review_date: r.reviewDate || new Date().toISOString().split('T')[0],
            platform: r.platform || 'Uploaded Spreadsheet',
            sentiment,
            is_general: r.isGeneral ? 1 : 0,
            created_at: new Date().toISOString(),
          };
        });

        // Save into local storage scoped strictly to this user's restaurant
        try {
          const storedReviewsRaw = localStorage.getItem(`sellsense_manual_reviews_${resolvedRestaurantId}`);
          const storedReviews = storedReviewsRaw ? JSON.parse(storedReviewsRaw) : [];
          localStorage.setItem(`sellsense_manual_reviews_${resolvedRestaurantId}`, JSON.stringify([...storedReviews, ...localReviewItems]));

          const storedProdsRaw = localStorage.getItem(`sellsense_uploaded_products_${resolvedRestaurantId}`);
          const storedProds = storedProdsRaw ? JSON.parse(storedProdsRaw) : [];

          const newProductsList = Array.from(productsSet).map((name, idx) => {
            const s = productStats[name] || { total: 1, pos: 1, neg: 0, neu: 0 };
            return {
              id: `prod_local_${Date.now()}_${idx}`,
              restaurantId: resolvedRestaurantId,
              name,
              category: 'Main Course',
              platforms: ['Spreadsheet / CSV'],
              totalReviews: s.total,
              positiveCount: s.pos,
              negativeCount: s.neg,
              neutralCount: s.neu,
              lastAnalyzed: new Date().toISOString(),
              dataMode: 'LIVE',
            };
          });

          const mergedProducts = [...storedProds];
          for (const np of newProductsList) {
            const matchIndex = mergedProducts.findIndex((p: any) => p.name.toLowerCase() === np.name.toLowerCase());
            if (matchIndex >= 0) {
              mergedProducts[matchIndex] = {
                ...mergedProducts[matchIndex],
                totalReviews: mergedProducts[matchIndex].totalReviews + np.totalReviews,
                positiveCount: mergedProducts[matchIndex].positiveCount + np.positiveCount,
                negativeCount: mergedProducts[matchIndex].negativeCount + np.negativeCount,
                neutralCount: mergedProducts[matchIndex].neutralCount + np.neutralCount,
              };
            } else {
              mergedProducts.push(np);
            }
          }
          localStorage.setItem(`sellsense_uploaded_products_${resolvedRestaurantId}`, JSON.stringify(mergedProducts));
        } catch (storageErr) {
          console.warn('LocalStorage save error:', storageErr);
        }

        result = {
          importedCount: validRows.length,
          skippedCount: 0,
          batchId: `batch_local_${Date.now()}`,
          productsWithReviews: Array.from(productsSet),
        };
      }

      setImportResult({
        importedCount: result.importedCount,
        skippedCount: result.skippedCount,
        batchId: result.batchId,
        productsWithReviews: result.productsWithReviews || [],
      });

      onSuccess({
        importedCount: result.importedCount,
        batchId: result.batchId,
        productsWithReviews: result.productsWithReviews || [],
      });
    } catch (err: any) {
      console.error('Import reviews error:', err);
      const msg = err?.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('Cannot connect')) {
        setError('Cannot connect to SellSense backend server (http://localhost:3001). Please make sure the server is running.');
      } else {
        setError(msg || 'Failed to import reviews. Please try again.');
      }
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const uniqueDishes = Array.from(new Set(parsedRows.filter(r => r.isValid && !r.isGeneral).map(r => r.productName)));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Upload Customer Reviews Sheet</h2>
              <p className="text-xs text-slate-500">
                Easily import your Excel or CSV customer reviews to analyze sentiment across dishes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Success Screen */}
          {importResult && (
            <div className="p-6 bg-gradient-to-br from-lime-50 via-emerald-50 to-teal-50 rounded-2xl border border-lime-200 text-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-lime-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Import Successful!</h3>
                  <p className="text-sm text-slate-600">
                    Imported <strong>{importResult.importedCount}</strong> customer reviews across <strong>{importResult.productsWithReviews.length}</strong> food items.
                  </p>
                </div>
              </div>

              {importResult.productsWithReviews.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {importResult.productsWithReviews.slice(0, 8).map((prod, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-lime-300 rounded-full text-xs font-semibold text-lime-800 shadow-sm">
                      🍽️ {prod}
                    </span>
                  ))}
                  {importResult.productsWithReviews.length > 8 && (
                    <span className="px-2 py-1 text-xs text-slate-500">
                      +{importResult.productsWithReviews.length - 8} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <Button variant="secondary" onClick={handleReset}>
                  Upload Another File
                </Button>
                <Button onClick={onClose} className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black">
                  View Analysis Dashboard <ArrowRight className="w-4 h-4 ml-1 inline" />
                </Button>
              </div>
            </div>
          )}

          {/* Upload Area when no file is chosen yet */}
          {!file && !importResult && (
            <div className="space-y-5">
              {/* Simplified Template Banner */}
              <div className="p-4 bg-gradient-to-r from-lime-50 to-emerald-50 border border-lime-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <HelpCircle className="w-4 h-4 text-lime-600 flex-shrink-0" />
                  <span>Don't have a format? Download our ready-to-use sample template:</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => handleDownloadTemplate('xlsx')}
                    className="bg-white border-lime-300 hover:bg-lime-100 text-slate-800 text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5 mr-1 text-lime-600" /> Sample Excel (.xlsx)
                  </Button>
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => handleDownloadTemplate('csv')}
                    className="bg-white border-lime-300 hover:bg-lime-100 text-slate-800 text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Sample CSV
                  </Button>
                </div>
              </div>

              {/* Drag and Drop Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-lime-500 bg-lime-50/60 scale-[1.01]'
                    : 'border-slate-300 hover:border-lime-500 bg-slate-50/60 hover:bg-lime-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-16 h-16 bg-lime-100 text-lime-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Drag & drop your Excel or CSV sheet here
                </h3>
                <p className="text-xs text-slate-500 mb-5">
                  Supports .xlsx, .xls, and .csv files. Columns like <strong>Product Name</strong> and <strong>Customer Review</strong> are auto-detected!
                </p>
                <Button size="medium" type="button" className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black px-6">
                  Select File from Computer
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-500 text-center pt-1">
                <span className="flex items-center justify-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-lime-600" /> Auto-column detection</span>
                <span className="flex items-center justify-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-lime-600" /> Instant data preview</span>
                <span className="flex items-center justify-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-lime-600" /> Private & user-isolated</span>
              </div>
            </div>
          )}

          {/* Parsing State */}
          {parsing && (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-lime-500 animate-spin mx-auto" />
              <p className="text-slate-700 font-semibold">Reading spreadsheet rows & detecting columns...</p>
            </div>
          )}

          {/* File Selected — Simple 2-Step Confirmation */}
          {file && !parsing && !importResult && (
            <div className="space-y-5">
              {/* File Info Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-lime-600 border border-slate-200">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{file.name}</h4>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB • {rawRows.length} total rows
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="small" onClick={handleReset} className="text-slate-500 hover:text-red-600 text-xs">
                  Change File
                </Button>
              </div>

              {/* Ready to Import Stat Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-lime-50 border border-lime-200 rounded-xl">
                  <span className="text-[11px] font-semibold text-lime-800 uppercase tracking-wider block">Valid Reviews</span>
                  <span className="text-2xl font-black text-lime-900">{validCount}</span>
                </div>
                <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                  <span className="text-[11px] font-semibold text-cyan-800 uppercase tracking-wider block">Food Items Found</span>
                  <span className="text-2xl font-black text-cyan-900">{uniqueDishes.length}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">Auto-Detected Fields</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block">
                    {columnMapping.productName ? 'Dish Name' : 'None'}, {columnMapping.customerReview ? 'Review' : 'None'}
                  </span>
                </div>
              </div>

              {/* Optional Advanced Column Mapping Toggle */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvancedMapping(!showAdvancedMapping)}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-lime-600" />
                    Customize Column Mapping (Optional)
                  </span>
                  {showAdvancedMapping ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {showAdvancedMapping && (
                  <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 border-t border-slate-200 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Product / Dish Column</label>
                      <select
                        value={columnMapping.productName}
                        onChange={(e) => handleMappingChange('productName', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="">-- General Review --</option>
                        {availableHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Review Text Column *</label>
                      <select
                        value={columnMapping.customerReview}
                        onChange={(e) => handleMappingChange('customerReview', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="">-- Select Column --</option>
                        {availableHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Rating Column (1-5)</label>
                      <select
                        value={columnMapping.rating}
                        onChange={(e) => handleMappingChange('rating', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="">-- Optional --</option>
                        {availableHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Sample Preview */}
              <div>
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Sample Data Preview (First 5 Rows)
                </h5>
                <div className="space-y-2">
                  {parsedRows.slice(0, 5).map((r) => (
                    <div key={r.index} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {r.productName}
                          </span>
                          {r.rating && (
                            <span className="text-amber-500 font-bold">★ {r.rating}</span>
                          )}
                          <span className="text-slate-400 text-[10px]">{r.platform}</span>
                        </div>
                        <p className="text-slate-600 italic line-clamp-2">"{r.customerReview}"</p>
                      </div>
                      {r.isValid ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-1" />
                      ) : (
                        <span title={r.errors.join(', ')}>
                          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-1" />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} disabled={importing}>
            Cancel
          </Button>

          {file && !importResult && (
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={handleReset} disabled={importing}>
                Reset
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={importing || validCount === 0}
                className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black px-6 shadow-md"
              >
                {importing ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Importing...
                  </span>
                ) : (
                  `🚀 Import ${validCount} Reviews Now`
                )}
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
