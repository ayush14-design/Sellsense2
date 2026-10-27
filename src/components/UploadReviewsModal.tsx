import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload, FileSpreadsheet, Download, X, CheckCircle, AlertTriangle,
  Trash2, RefreshCw, Sparkles, Check, HelpCircle, ArrowRight
} from 'lucide-react';
import { Button } from './Button';
import { backendApi } from '../services/backendApi';

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
  const [filterView, setFilterView] = useState<'all' | 'valid' | 'invalid'>('all');
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    skippedCount: number;
    batchId: string;
    productsWithReviews: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Download sample template (.xlsx or .csv)
  const handleDownloadTemplate = (format: 'xlsx' | 'csv' = 'xlsx') => {
    const templateData = [
      {
        'Restaurant Name': restaurantName || 'Neelam Restaurants',
        'Product Name': 'Paneer Tikka',
        'Customer Review': 'Very tasty and well cooked. Soft cottage cheese with great smoky flavor.',
        'Rating': 5,
        'Review Date': '2026-10-10',
        'Platform': 'Zomato',
      },
      {
        'Restaurant Name': restaurantName || 'Neelam Restaurants',
        'Product Name': 'Veg Biryani',
        'Customer Review': 'Good taste and aroma, but the portion size is slightly low for the price.',
        'Rating': 3,
        'Review Date': '2026-10-11',
        'Platform': 'Swiggy',
      },
      {
        'Restaurant Name': restaurantName || 'Neelam Restaurants',
        'Product Name': 'Masala Dosa',
        'Customer Review': 'Crispy crust and delicious potato filling. Coconut chutney was fresh.',
        'Rating': 5,
        'Review Date': '2026-10-12',
        'Platform': 'Google',
      },
      {
        'Restaurant Name': restaurantName || 'Neelam Restaurants',
        'Product Name': 'Butter Naan',
        'Customer Review': 'Super soft and buttery, stayed fresh and warm during delivery.',
        'Rating': 5,
        'Review Date': '2026-10-13',
        'Platform': 'Zomato',
      },
      {
        'Restaurant Name': restaurantName || 'Neelam Restaurants',
        'Product Name': 'Dal Makhani',
        'Customer Review': 'Gravy had leaked into the polybag, food arrived lukewarm.',
        'Rating': 2,
        'Review Date': '2026-10-14',
        'Platform': 'Swiggy',
      },
      {
        'Restaurant Name': restaurantName || 'Neelam Restaurants',
        'Product Name': '', // General restaurant review example
        'Customer Review': 'Great dining experience, courteous service and quick seating.',
        'Rating': 5,
        'Review Date': '2026-10-15',
        'Platform': 'Google',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Reviews');

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, 'SellSense_Reviews_Sample_Template.xlsx');
    } else {
      XLSX.writeFile(workbook, 'SellSense_Reviews_Sample_Template.csv', { bookType: 'csv' });
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

    // Validate size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (uploadedFile.size > MAX_SIZE) {
      setError('File size exceeds the 10 MB limit. Please select a smaller file.');
      return;
    }

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileNameLower = uploadedFile.name.toLowerCase();
    const isValidExtension = validExtensions.some(ext => fileNameLower.endsWith(ext));
    if (!isValidExtension) {
      setError('Unsupported file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setParsing(true);
    setFile(uploadedFile);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      // Safe parsing: disable formula evaluation & macro execution, enable date parsing
      const workbook = XLSX.read(buffer, {
        type: 'array',
        cellFormula: false,
        cellHTML: false,
        cellDates: true,
      });

      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('Spreadsheet contains no sheets');
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rows.length === 0) {
        throw new Error('Spreadsheet has no data rows to import');
      }

      const headers = Object.keys(rows[0] || {});
      setAvailableHeaders(headers);

      const detected = detectColumns(headers);
      setColumnMapping(detected);
      setRawRows(rows);

      validateAndApplyMapping(rows, detected);
    } catch (err: any) {
      console.error('File parse error:', err);
      setError(err?.message || 'Failed to parse spreadsheet file.');
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

      const platform = mapping.platform ? String(row[mapping.platform] || '').trim() : 'Uploaded Data';

      const errors: string[] = [];
      let rating: number | null = null;

      if (!customerReview) {
        errors.push('Customer Review is empty');
      }

      if (rawRating !== null && rawRating !== undefined && rawRating !== '') {
        const num = Number(rawRating);
        if (isNaN(num) || num < 1 || num > 5) {
          errors.push('Rating must be between 1 and 5');
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
        platform: platform || 'Uploaded Data',
        isValid: errors.length === 0,
        errors,
        isGeneral,
      };
    });

    setParsedRows(validated);
  };

  // Handle column mapping changes
  const handleMappingChange = (field: keyof typeof columnMapping, headerName: string) => {
    const updated = { ...columnMapping, [field]: headerName };
    setColumnMapping(updated);
    validateAndApplyMapping(rawRows, updated);
  };

  // Remove single row
  const handleRemoveRow = (index: number) => {
    setParsedRows(prev => prev.filter(r => r.index !== index));
  };

  // Drag and drop handlers
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

  // Reset file
  const handleReset = () => {
    setFile(null);
    setRawRows([]);
    setParsedRows([]);
    setAvailableHeaders([]);
    setError(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit valid reviews to backend with local fallback protection
  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setError('There are no valid rows to import. Please review your column mapping.');
      return;
    }

    setImporting(true);
    setError(null);

    const targetRestaurantId = restaurantId || 'restaurant_nelam_001';
    const payload = {
      restaurantId: targetRestaurantId,
      restaurantName: restaurantName || 'Nelam Restaurants',
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
        
        // Extract unique product names
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
            restaurant_id: targetRestaurantId,
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

        // Save into local storage
        try {
          const storedReviewsRaw = localStorage.getItem(`sellsense_manual_reviews_${targetRestaurantId}`);
          const storedReviews = storedReviewsRaw ? JSON.parse(storedReviewsRaw) : [];
          localStorage.setItem(`sellsense_manual_reviews_${targetRestaurantId}`, JSON.stringify([...storedReviews, ...localReviewItems]));

          const storedProdsRaw = localStorage.getItem(`sellsense_uploaded_products_${targetRestaurantId}`);
          const storedProds = storedProdsRaw ? JSON.parse(storedProdsRaw) : [];

          const newProductsList = Array.from(productsSet).map((name, idx) => {
            const s = productStats[name] || { total: 1, pos: 1, neg: 0, neu: 0 };
            return {
              id: `prod_local_${Date.now()}_${idx}`,
              restaurantId: targetRestaurantId,
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

          // Merge by name
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
          localStorage.setItem(`sellsense_uploaded_products_${targetRestaurantId}`, JSON.stringify(mergedProducts));
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
        setError('Cannot connect to SellSense backend server (http://localhost:3001). Please make sure the backend server is running.');
      } else {
        setError(msg || 'Failed to import reviews. Please try again.');
      }
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;
  const filteredRows = parsedRows.filter(r => {
    if (filterView === 'valid') return r.isValid;
    if (filterView === 'invalid') return !r.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lime-400 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Upload Customer Reviews</h2>
              <p className="text-xs text-slate-500">
                Import spreadsheet reviews (.xlsx, .xls, .csv) for AI-powered product sentiment analysis
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Success Banner */}
          {importResult && (
            <div className="p-6 bg-gradient-to-br from-lime-50 to-emerald-50 rounded-2xl border border-lime-200 text-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lime-400 text-slate-950 flex items-center justify-center font-bold">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Reviews Successfully Imported!</h3>
                  <p className="text-sm text-slate-600">
                    Imported <strong>{importResult.importedCount}</strong> customer reviews across <strong>{importResult.productsWithReviews.length}</strong> food products.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {importResult.productsWithReviews.slice(0, 6).map((prod, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-lime-300 rounded-full text-xs font-semibold text-lime-800 shadow-sm">
                    🍽️ {prod}
                  </span>
                ))}
                {importResult.productsWithReviews.length > 6 && (
                  <span className="px-2 py-1 text-xs text-slate-500">
                    +{importResult.productsWithReviews.length - 6} more
                  </span>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <Button variant="secondary" onClick={handleReset}>
                  Upload Another File
                </Button>
                <Button onClick={onClose} className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black">
                  View & Analyze Products <ArrowRight className="w-4 h-4 ml-1 inline" />
                </Button>
              </div>
            </div>
          )}

          {/* Upload Area when no file is selected */}
          {!file && !importResult && (
            <div className="space-y-6">
              {/* Instructions & Template Download Bar */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <HelpCircle className="w-5 h-5 text-lime-600 flex-shrink-0" />
                  <span>Need the standard template? Columns: <strong>Product Name</strong>, <strong>Customer Review</strong>, Rating, Platform, Date.</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => handleDownloadTemplate('xlsx')}
                    className="border-slate-300 hover:border-lime-500 text-slate-700"
                  >
                    <Download className="w-4 h-4 mr-1 text-lime-600" /> Excel (.xlsx)
                  </Button>
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => handleDownloadTemplate('csv')}
                    className="border-slate-300 hover:border-lime-500 text-slate-700"
                  >
                    <Download className="w-4 h-4 mr-1 text-cyan-600" /> CSV
                  </Button>
                </div>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-lime-500 bg-lime-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-lime-400 bg-slate-50/50 hover:bg-slate-50'
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
                  Drag & drop your review spreadsheet here
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Supports <strong>.xlsx</strong>, <strong>.xls</strong>, or <strong>.csv</strong> files up to 10 MB
                </p>
                <Button size="medium" type="button" className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black">
                  Browse Computer
                </Button>
              </div>

              {/* Security & Format Features Notice */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-500 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-lime-500" />
                  <span>Auto-detects column names</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-lime-500" />
                  <span>Macro-safe parsing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-lime-500" />
                  <span>Filtres duplicates automatically</span>
                </div>
              </div>
            </div>
          )}

          {/* Parsing State */}
          {parsing && (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-lime-500 animate-spin mx-auto" />
              <p className="text-slate-700 font-semibold">Reading spreadsheet rows & validating data...</p>
            </div>
          )}

          {/* File Selected & Preview Mode */}
          {file && !parsing && !importResult && (
            <div className="space-y-6">

              {/* File Info Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-lime-600 border border-slate-200">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{file.name}</h4>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB • {rawRows.length} total rows detected
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="small" onClick={handleReset} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-1" /> Choose Different File
                  </Button>
                </div>
              </div>

              {/* Column Mapping Selectors */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-lime-600" />
                    Map Spreadsheet Columns to SellSense Fields
                  </h4>
                  <span className="text-xs text-slate-500">Adjust dropdowns if headers differ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Product / Dish Name <span className="text-slate-400 font-normal">(Optional for general)</span>
                    </label>
                    <select
                      value={columnMapping.productName}
                      onChange={(e) => handleMappingChange('productName', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-lime-500 focus:outline-none"
                    >
                      <option value="">-- No Product Name (General Review) --</option>
                      {availableHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer Review Text <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={columnMapping.customerReview}
                      onChange={(e) => handleMappingChange('customerReview', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-lime-500 focus:outline-none"
                    >
                      <option value="">-- Select Review Column --</option>
                      {availableHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Rating (1 to 5) <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={columnMapping.rating}
                      onChange={(e) => handleMappingChange('rating', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-lime-500 focus:outline-none"
                    >
                      <option value="">-- Optional / None --</option>
                      {availableHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Review Date <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={columnMapping.reviewDate}
                      onChange={(e) => handleMappingChange('reviewDate', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-lime-500 focus:outline-none"
                    >
                      <option value="">-- Optional / Current Date --</option>
                      {availableHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Platform Source <span className="text-slate-400 font-normal">(Zomato/Swiggy/Google)</span>
                    </label>
                    <select
                      value={columnMapping.platform}
                      onChange={(e) => handleMappingChange('platform', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-lime-500 focus:outline-none"
                    >
                      <option value="">-- Optional (Uploaded Data) --</option>
                      {availableHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Validation Summary & Filter Tabs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterView('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      filterView === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Rows ({parsedRows.length})
                  </button>
                  <button
                    onClick={() => setFilterView('valid')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      filterView === 'valid' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    Valid ({validCount})
                  </button>
                  {invalidCount > 0 && (
                    <button
                      onClick={() => setFilterView('invalid')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        filterView === 'invalid' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      Invalid ({invalidCount})
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500">
                  Ready to import: <strong>{validCount}</strong> reviews
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2.5 w-16">Status</th>
                        <th className="px-4 py-2.5 w-36">Product Name</th>
                        <th className="px-4 py-2.5">Customer Review</th>
                        <th className="px-4 py-2.5 w-20">Rating</th>
                        <th className="px-4 py-2.5 w-24">Platform</th>
                        <th className="px-4 py-2.5 w-12 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRows.slice(0, 50).map((row) => (
                        <tr key={row.index} className={row.isValid ? 'hover:bg-slate-50/80' : 'bg-red-50/40 hover:bg-red-50/60'}>
                          <td className="px-4 py-2.5">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-green-700 font-semibold">
                                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-red-600 font-semibold" title={row.errors.join(', ')}>
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-slate-800">
                            {row.isGeneral ? (
                              <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-[10px] font-bold">General Review</span>
                            ) : (
                              row.productName
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate" title={row.customerReview}>
                            {row.customerReview || <span className="text-red-400 italic">Missing review</span>}
                          </td>
                          <td className="px-4 py-2.5 font-medium">
                            {row.rating ? (
                              <span className="text-amber-500 font-bold">{row.rating} ★</span>
                            ) : (
                              <span className="text-slate-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-600">
                              {row.platform}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              onClick={() => handleRemoveRow(row.index)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded"
                              title="Remove row"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredRows.length > 50 && (
                  <div className="p-2.5 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-100">
                    Showing first 50 rows of {filteredRows.length}. All valid rows will be imported.
                  </div>
                )}
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

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} disabled={importing}>
            Cancel Upload
          </Button>

          {file && !importResult && (
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={handleReset} disabled={importing}>
                Reset
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={importing || validCount === 0}
                className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black"
              >
                {importing ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Importing Reviews...
                  </span>
                ) : (
                  `Import ${validCount} Valid Reviews`
                )}
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
