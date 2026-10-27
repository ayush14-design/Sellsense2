import { Router, Request, Response } from 'express';
import db from '../models/database.js';

export const reviewsRouter = Router();

// Helper to determine sentiment and theme from review text & optional rating
function analyzeReviewText(text: string, rating?: number | null): {
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  theme: string;
} {
  const lower = text.toLowerCase();

  const positiveWords = [
    'tasty', 'delicious', 'great', 'good', 'amazing', 'love', 'loved', 'fresh',
    'crispy', 'soft', 'flavorful', 'flavourful', 'best', 'excellent', 'superb',
    'perfect', 'authentic', 'generous', 'fast', 'quick', 'hot', 'piping hot',
    'hygienic', 'polite', 'courteous', 'awesome', 'recommend', 'nice', 'yum'
  ];

  const negativeWords = [
    'bad', 'cold', 'lukewarm', 'leak', 'leaked', 'spill', 'spilled', 'rubber',
    'chewy', 'salty', 'too salty', 'bland', 'tasteless', 'stale', 'smell',
    'late', 'delay', 'delayed', 'slow', 'less quantity', 'small portion', 'scant',
    'oily', 'greasy', 'burnt', 'raw', 'undercooked', 'overcooked', 'sour',
    'terrible', 'worst', 'disappointing', 'poor', 'hair', 'spoiled', 'unacceptable'
  ];

  let posHits = 0;
  let negHits = 0;

  for (const w of positiveWords) {
    if (lower.includes(w)) posHits++;
  }
  for (const w of negativeWords) {
    if (lower.includes(w)) negHits++;
  }

  // Factor in rating if valid
  if (typeof rating === 'number' && rating >= 1 && rating <= 5) {
    if (rating >= 4) posHits += 2;
    else if (rating <= 2) negHits += 2;
  }

  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  let sentimentScore = 0.5;

  if (posHits > negHits) {
    sentiment = 'positive';
    sentimentScore = Math.min(1.0, 0.6 + (posHits - negHits) * 0.1);
  } else if (negHits > posHits) {
    sentiment = 'negative';
    sentimentScore = Math.max(0.0, 0.4 - (negHits - posHits) * 0.1);
  } else {
    sentiment = 'neutral';
    sentimentScore = 0.5;
  }

  // Determine primary theme
  let theme = 'Taste & Flavor';
  if (lower.includes('leak') || lower.includes('spill') || lower.includes('pack') || lower.includes('container') || lower.includes('box')) {
    theme = 'Packaging & Leakage';
  } else if (lower.includes('portion') || lower.includes('quantity') || lower.includes('size') || lower.includes('less') || lower.includes('generous')) {
    theme = 'Portion & Quantity';
  } else if (lower.includes('cold') || lower.includes('late') || lower.includes('delay') || lower.includes('time') || lower.includes('delivery') || lower.includes('wait') || lower.includes('fast') || lower.includes('quick')) {
    theme = 'Delivery & Temperature';
  } else if (lower.includes('crispy') || lower.includes('soft') || lower.includes('chewy') || lower.includes('rubber') || lower.includes('stale') || lower.includes('fresh')) {
    theme = 'Texture & Freshness';
  } else if (lower.includes('spicy') || lower.includes('chilli') || lower.includes('pepper') || lower.includes('sweet') || lower.includes('salt')) {
    theme = 'Spice & Seasoning';
  } else if (lower.includes('price') || lower.includes('costly') || lower.includes('expensive') || lower.includes('worth') || lower.includes('value')) {
    theme = 'Value for Money';
  } else if (lower.includes('staff') || lower.includes('service') || lower.includes('polite') || lower.includes('rude')) {
    theme = 'Staff & Service';
  }

  return { sentiment, sentimentScore, theme };
}

// Helper to ensure restaurant exists in database so foreign key constraints never fail
function ensureValidRestaurant(restaurantId?: string, restaurantName?: string): string {
  const targetId = (restaurantId && restaurantId.trim()) || 'restaurant_nelam_001';

  // Check if restaurant with targetId exists in restaurants table
  const existing = db.prepare('SELECT id FROM restaurants WHERE id = ?').get(targetId) as { id: string } | undefined;
  if (existing) {
    return existing.id;
  }

  // Ensure fallback user exists in users table so foreign key constraint is guaranteed
  try {
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role, is_active)
      VALUES ('user_demo_001', 'demo@nelamrestaurants.com', '$2a$10$demo', 'Demo Restaurant Owner', 'restaurant_owner', 1)
    `).run();
  } catch (e) {}

  // Find any existing owner user to link as owner_id
  const owner = (db.prepare("SELECT id FROM users WHERE role = 'restaurant_owner' OR id = 'user_demo_001'").get() ||
                 db.prepare("SELECT id FROM users LIMIT 1").get()) as { id: string } | undefined;
  const ownerId = owner?.id || 'user_demo_001';

  try {
    db.prepare(`
      INSERT OR IGNORE INTO restaurants (id, name, owner_name, business_type, city, location, contact_email, description, owner_id)
      VALUES (?, ?, ?, 'Restaurant', 'Pune', 'Koregaon Park, Pune', 'demo@nelamrestaurants.com', 'Restaurant profile', ?)
    `).run(targetId, restaurantName || 'Nelam Restaurants', 'Demo Owner', ownerId);
  } catch (e) {
    console.warn('Could not auto-insert restaurant for manual upload:', e);
  }

  return targetId;
}

// 1. POST /api/reviews/manual-import: Import parsed reviews from spreadsheet
reviewsRouter.post('/manual-import', (req: Request, res: Response) => {
  try {
    const { restaurantId, restaurantName, filename, fileType, reviews } = req.body;

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({ error: 'No reviews found in upload payload' });
    }

    const restId = ensureValidRestaurant(restaurantId, restaurantName);
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fname = filename || 'uploaded_reviews.xlsx';
    const ftype = fileType || (fname.endsWith('.csv') ? 'csv' : 'xlsx');

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const productsSet = new Set<string>();

    const insertBatchStmt = db.prepare(`
      INSERT INTO manual_review_batches (id, restaurant_id, filename, file_type, total_rows, imported_count, skipped_count)
      VALUES (?, ?, ?, ?, ?, 0, 0)
    `);

    const insertReviewStmt = db.prepare(`
      INSERT INTO manual_reviews (
        id, restaurant_id, batch_id, product_name, customer_review,
        rating, review_date, platform, sentiment, sentiment_score, theme, is_general
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Existing review text fingerprint cache to avoid duplicate rows
    const existingReviews = db.prepare(`
      SELECT customer_review, product_name FROM manual_reviews WHERE restaurant_id = ?
    `).all(restId) as Array<{ customer_review?: string | null; product_name?: string | null }>;

    const seenFingerprints = new Set(
      existingReviews.map(r => `${(r.product_name || '').trim().toLowerCase()}|${(r.customer_review || '').trim().toLowerCase()}`)
    );

    // Use transaction for speed and consistency
    const transaction = db.transaction((rows: any[]) => {
      insertBatchStmt.run(batchId, restId, fname, ftype, rows.length);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let reviewText = (row.customerReview || row.reviewText || row.review || '').toString().trim();
        let productName = (row.productName || row.product || row.dish || '').toString().trim();
        let rawRating = row.rating !== undefined && row.rating !== null && row.rating !== '' ? Number(row.rating) : null;
        let reviewDate = (row.reviewDate || row.date || '').toString().trim() || new Date().toISOString().split('T')[0];
        let platform = (row.platform || row.source || 'Uploaded Data').toString().trim();
        const isGeneral = !productName || Boolean(row.isGeneral);

        // Security: strip potential spreadsheet formula injection prefixes
        if (/^[=+\-@]/.test(reviewText)) {
          reviewText = reviewText.replace(/^[=+\-@]+/, '');
        }
        if (/^[=+\-@]/.test(productName)) {
          productName = productName.replace(/^[=+\-@]+/, '');
        }

        // Validation
        if (!reviewText) {
          skippedCount++;
          errors.push(`Row ${i + 1}: Customer review text is empty`);
          continue;
        }

        // Validate rating (1-5 if provided)
        let validRating: number | null = null;
        if (rawRating !== null && !isNaN(rawRating)) {
          if (rawRating >= 1 && rawRating <= 5) {
            validRating = Math.round(rawRating);
          }
        }

        // Duplicate check within batch and database
        const fingerprint = `${productName.toLowerCase()}|${reviewText.toLowerCase()}`;
        if (seenFingerprints.has(fingerprint)) {
          skippedCount++;
          continue; // Skip duplicate without error
        }
        seenFingerprints.add(fingerprint);

        const { sentiment, sentimentScore, theme } = analyzeReviewText(reviewText, validRating);
        const reviewId = `mrev_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;

        insertReviewStmt.run(
          reviewId,
          restId,
          batchId,
          productName || 'General Restaurant Review',
          reviewText,
          validRating,
          reviewDate,
          platform || 'Uploaded Data',
          sentiment,
          sentimentScore,
          theme,
          isGeneral ? 1 : 0
        );

        importedCount++;
        if (productName && !isGeneral) {
          productsSet.add(productName);
        }
      }

      // Update batch summary counts
      db.prepare(`
        UPDATE manual_review_batches
        SET imported_count = ?, skipped_count = ?
        WHERE id = ?
      `).run(importedCount, skippedCount, batchId);
    });

    transaction(reviews);

    res.json({
      success: true,
      batchId,
      filename: fname,
      totalRows: reviews.length,
      importedCount,
      skippedCount,
      productsWithReviews: Array.from(productsSet),
      errors: errors.slice(0, 10), // return first 10 error notes if any
    });
  } catch (error: any) {
    console.error('Manual review import error:', error);
    res.status(500).json({ error: error?.message || 'Failed to import manual reviews' });
  }
});

// 2. GET /api/reviews/manual: Get imported manual reviews with stats
reviewsRouter.get('/manual', (req: Request, res: Response) => {
  try {
    const rawRestId = (req.query.restaurantId as string) || 'restaurant_nelam_001';
    const restaurantId = ensureValidRestaurant(rawRestId);
    const productName = req.query.productName as string | undefined;
    const platform = req.query.platform as string | undefined;
    const batchId = req.query.batchId as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE restaurant_id = ?';
    const params: any[] = [restaurantId];

    if (productName) {
      whereClause += ' AND product_name = ?';
      params.push(productName);
    }
    if (platform) {
      whereClause += ' AND platform = ?';
      params.push(platform);
    }
    if (batchId) {
      whereClause += ' AND batch_id = ?';
      params.push(batchId);
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM manual_reviews ${whereClause}`).get(...params) as any).count;
    const reviews = db.prepare(`SELECT * FROM manual_reviews ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);

    // Compute summary metrics for this restaurant
    const totalReviews = (db.prepare('SELECT COUNT(*) as count FROM manual_reviews WHERE restaurant_id = ?').get(restaurantId) as any).count;
    const distinctProducts = db.prepare('SELECT DISTINCT product_name FROM manual_reviews WHERE restaurant_id = ? AND is_general = 0').all(restaurantId) as Array<{ product_name: string }>;
    const latestBatch = db.prepare('SELECT created_at FROM manual_review_batches WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 1').get(restaurantId) as any;

    const platformDistribution = db.prepare(`
      SELECT platform, COUNT(*) as count
      FROM manual_reviews
      WHERE restaurant_id = ?
      GROUP BY platform
    `).all(restaurantId);

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalImportedReviews: totalReviews,
        productsCount: distinctProducts.length,
        productNames: distinctProducts.map(p => p.product_name),
        latestImportDate: latestBatch?.created_at || null,
        platformDistribution,
      },
    });
  } catch (error: any) {
    console.error('Fetch manual reviews error:', error);
    res.status(500).json({ error: 'Failed to retrieve manual reviews' });
  }
});

// 3. GET /api/reviews/batches: Get list of upload batches
reviewsRouter.get('/batches', (req: Request, res: Response) => {
  try {
    const rawRestId = (req.query.restaurantId as string) || 'restaurant_nelam_001';
    const restaurantId = ensureValidRestaurant(rawRestId);
    const batches = db.prepare(`
      SELECT * FROM manual_review_batches
      WHERE restaurant_id = ?
      ORDER BY created_at DESC
    `).all(restaurantId);

    res.json({ batches });
  } catch (error: any) {
    console.error('Fetch batches error:', error);
    res.status(500).json({ error: 'Failed to retrieve upload batches' });
  }
});

// 4. DELETE /api/reviews/batch/:batchId: Delete an uploaded batch and its reviews
reviewsRouter.delete('/batch/:batchId', (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const rawRestId = (req.query.restaurantId as string) || 'restaurant_nelam_001';
    const restaurantId = ensureValidRestaurant(rawRestId);

    const batch = db.prepare('SELECT * FROM manual_review_batches WHERE id = ? AND restaurant_id = ?').get(batchId, restaurantId);
    if (!batch) {
      return res.status(404).json({ error: 'Upload batch not found' });
    }

    db.transaction(() => {
      db.prepare('DELETE FROM manual_reviews WHERE batch_id = ?').run(batchId);
      db.prepare('DELETE FROM manual_review_batches WHERE id = ?').run(batchId);
    })();

    res.json({ success: true, message: 'Batch and reviews deleted successfully' });
  } catch (error: any) {
    console.error('Delete batch error:', error);
    res.status(500).json({ error: 'Failed to delete upload batch' });
  }
});

// 5. GET /api/reviews/product-analysis: AI-Powered Product Review Analysis
reviewsRouter.get('/product-analysis', (req: Request, res: Response) => {
  try {
    const rawRestId = (req.query.restaurantId as string) || 'restaurant_nelam_001';
    const restaurantId = ensureValidRestaurant(rawRestId);
    const productName = req.query.productName as string;

    if (!productName) {
      return res.status(400).json({ error: 'productName query parameter is required' });
    }

    const reviews = db.prepare(`
      SELECT * FROM manual_reviews
      WHERE restaurant_id = ? AND LOWER(product_name) = LOWER(?)
      ORDER BY created_at DESC
    `).all(restaurantId, productName) as any[];

    if (reviews.length === 0) {
      return res.json({
        productName,
        totalReviews: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        positivePercentage: 0,
        negativePercentage: 0,
        neutralPercentage: 0,
        averageRating: null,
        positiveThemes: [],
        negativeThemes: [],
        customerPreferences: [],
        improvementOpportunities: [],
        aiSummary: `No uploaded spreadsheet reviews found for ${productName} yet. Upload a CSV or Excel file to see AI insights.`,
        sampleReviews: [],
      });
    }

    const total = reviews.length;
    const positiveReviews = reviews.filter(r => r.sentiment === 'positive');
    const negativeReviews = reviews.filter(r => r.sentiment === 'negative');
    const neutralReviews = reviews.filter(r => r.sentiment === 'neutral');

    const ratingsList = reviews.map(r => r.rating).filter((r): r is number => typeof r === 'number' && r > 0);
    const averageRating = ratingsList.length > 0
      ? Number((ratingsList.reduce((acc, curr) => acc + curr, 0) / ratingsList.length).toFixed(1))
      : null;

    // Group positive themes
    const posThemeMap = new Map<string, { count: number; quote: string }>();
    for (const r of positiveReviews) {
      const t = r.theme || 'Taste & Flavor';
      const existing = posThemeMap.get(t) || { count: 0, quote: r.customer_review };
      existing.count++;
      posThemeMap.set(t, existing);
    }
    const positiveThemes = Array.from(posThemeMap.entries()).map(([theme, data]) => ({
      theme,
      count: data.count,
      percentage: Math.round((data.count / total) * 100),
      representativeQuote: data.quote,
    })).sort((a, b) => b.count - a.count);

    // Group negative themes
    const negThemeMap = new Map<string, { count: number; quote: string }>();
    for (const r of negativeReviews) {
      const t = r.theme || 'Quality Concern';
      const existing = negThemeMap.get(t) || { count: 0, quote: r.customer_review };
      existing.count++;
      negThemeMap.set(t, existing);
    }
    const negativeThemes = Array.from(negThemeMap.entries()).map(([theme, data]) => ({
      theme,
      count: data.count,
      percentage: Math.round((data.count / total) * 100),
      representativeQuote: data.quote,
    })).sort((a, b) => b.count - a.count);

    // Derive customer preferences
    const customerPreferences: string[] = [];
    if (positiveThemes.length > 0) {
      positiveThemes.forEach(t => {
        customerPreferences.push(`Customers consistently praise the ${t.theme.toLowerCase()} (${t.percentage}% of reviews)`);
      });
    } else {
      customerPreferences.push('Customers appreciate standard preparation and flavors');
    }

    // Derive actionable improvement opportunities
    const improvementOpportunities: string[] = [];
    if (negativeThemes.length > 0) {
      negativeThemes.forEach(t => {
        if (t.theme.includes('Packaging') || t.theme.includes('Leak')) {
          improvementOpportunities.push(`Upgrade to leak-proof containers to resolve customer packaging complaints (${t.count} reports).`);
        } else if (t.theme.includes('Temperature') || t.theme.includes('Delivery')) {
          improvementOpportunities.push(`Optimize kitchen dispatch and thermal bags to prevent food arriving lukewarm (${t.count} reports).`);
        } else if (t.theme.includes('Portion') || t.theme.includes('Quantity')) {
          improvementOpportunities.push(`Standardize kitchen scoop weights to avoid complaints regarding low portion sizes (${t.count} reports).`);
        } else if (t.theme.includes('Spice') || t.theme.includes('Salt')) {
          improvementOpportunities.push(`Recalibrate spice and salt measurements across kitchen shifts (${t.count} reports).`);
        } else {
          improvementOpportunities.push(`Review kitchen prep guidelines for ${t.theme.toLowerCase()} (${t.count} mentions).`);
        }
      });
    } else {
      improvementOpportunities.push('Maintain current high quality standards and recipe consistency.');
    }

    // ============ 1. PAIRED GOOD & BAD ANALYSIS UNDER SAME TYPE ============
    // Define core aspect categories for restaurant food items
    interface PairedAspect {
      id: string;
      title: string;
      icon: string;
      keywords: string[];
      goodPatterns: { pattern: RegExp; point: string }[];
      badPatterns: { pattern: RegExp; point: string }[];
    }

    const aspectDefinitions: PairedAspect[] = [
      {
        id: 'taste_flavor',
        title: 'Taste & Flavor Profile',
        icon: 'Utensils',
        keywords: ['taste', 'flavor', 'delicious', 'spicy', 'salt', 'sweet', 'gravy', 'curry', 'bland', 'oily', 'oil', 'masala', 'yummy', 'tasty', 'rich', 'authentic'],
        goodPatterns: [
          { pattern: /rich|creamy|authentic|delicious|amazing|loved|best|flavorful|tasty|perfection/i, point: 'Rich, authentic seasoning & creamy texture' },
          { pattern: /tender|soft|fresh|juicy|cooked well|melt/i, point: 'Tender, high quality pieces & ideal softness' },
          { pattern: /spice|balanced|perfect spice/i, point: 'Well-balanced spice and heat level' },
        ],
        badPatterns: [
          { pattern: /salty|too salt|salt/i, point: 'Excessive saltiness reported in certain batches' },
          { pattern: /oil|oily|greasy/i, point: 'Gravy or preparation can feel excessively oily' },
          { pattern: /bland|no taste|flavorless|watery/i, point: 'Under-seasoned or diluted gravy reported' },
          { pattern: /too spicy|chili|burn/i, point: 'Overpowering chili or spice level' },
        ]
      },
      {
        id: 'packaging_presentation',
        title: 'Packaging & Leakage',
        icon: 'Package',
        keywords: ['pack', 'packaging', 'leak', 'lid', 'box', 'spill', 'spilled', 'bag', 'container', 'seal', 'clean', 'wrap'],
        goodPatterns: [
          { pattern: /neat|clean|secure|seal|good packaging|nice pack/i, point: 'Neat, tamper-evident food containers' },
          { pattern: /no leak|spill-proof|sturdy/i, point: 'Spill-resistant containers holding gravy safely' },
        ],
        badPatterns: [
          { pattern: /leak|spill|spilled|loose lid|mess/i, point: 'Containers leaking inside delivery carry bag' },
          { pattern: /crushed|broken|soggy box|poor packaging/i, point: 'Flimsy packaging damaging food presentation' },
        ]
      },
      {
        id: 'temp_freshness',
        title: 'Temperature & Freshness',
        icon: 'Flame',
        keywords: ['hot', 'cold', 'warm', 'temperature', 'fresh', 'stale', 'soggy', 'crisp', 'steaming', 'frozen'],
        goodPatterns: [
          { pattern: /piping hot|steaming|fresh|hot food|served hot/i, point: 'Delivered piping hot and visibly fresh' },
          { pattern: /crisp|warm|freshly cooked/i, point: 'Retained crispness and aroma upon arrival' },
        ],
        badPatterns: [
          { pattern: /cold|lukewarm|not hot/i, point: 'Food arriving lukewarm or cold after delivery' },
          { pattern: /stale|old|soggy|rubbery/i, point: 'Stale texture or items becoming soggy in transit' },
        ]
      },
      {
        id: 'portion_value',
        title: 'Portion Size & Value for Money',
        icon: 'DollarSign',
        keywords: ['portion', 'quantity', 'size', 'price', 'cost', 'expensive', 'worth', 'value', 'small', 'filling', 'less'],
        goodPatterns: [
          { pattern: /worth|value for money|generous|filling|good quantity|enough for 2/i, point: 'Generous serving portion offering great value' },
          { pattern: /ample pieces|good piece/i, point: 'Good number of meat/paneer pieces in the dish' },
        ],
        badPatterns: [
          { pattern: /expensive|costly|overpriced|not worth/i, point: 'Felt overpriced compared to serving volume' },
          { pattern: /small portion|less quantity|too small|hardly any/i, point: 'Smaller portion or fewer pieces than expected' },
        ]
      },
      {
        id: 'delivery_handling',
        title: 'Delivery Speed & Service',
        icon: 'Clock',
        keywords: ['delivery', 'late', 'fast', 'delay', 'rider', 'driver', 'on time', 'arrived', 'service', 'time'],
        goodPatterns: [
          { pattern: /fast delivery|on time|quick|arrived early/i, point: 'Prompt delivery right on time' },
          { pattern: /polite|careful|good service/i, point: 'Careful handling by delivery personnel' },
        ],
        badPatterns: [
          { pattern: /late|delayed|delayed delivery|took 1 hour|took forever/i, point: 'Significant dispatch or delivery delays' },
          { pattern: /wrong item|missing|careless/i, point: 'Missing cutlery or misplaced order add-ons' },
        ]
      }
    ];

    const pairedTypeAnalysis = aspectDefinitions.map(aspect => {
      // Find reviews that mention any keywords for this aspect
      const aspectReviews = reviews.filter(r => {
        const text = (r.customer_review || '').toLowerCase();
        return aspect.keywords.some(kw => text.includes(kw));
      });

      const aspectPos = aspectReviews.filter(r => r.sentiment === 'positive');
      const aspectNeg = aspectReviews.filter(r => r.sentiment === 'negative');

      // Extract repetitive good points
      const goodPointsMap = new Map<string, { count: number; quote: string }>();
      aspectPos.forEach(r => {
        const text = r.customer_review || '';
        let matched = false;
        for (const gp of aspect.goodPatterns) {
          if (gp.pattern.test(text)) {
            const cur = goodPointsMap.get(gp.point) || { count: 0, quote: text };
            cur.count++;
            goodPointsMap.set(gp.point, cur);
            matched = true;
          }
        }
        if (!matched) {
          const defaultPoint = `Positive customer experience with ${aspect.title.toLowerCase()}`;
          const cur = goodPointsMap.get(defaultPoint) || { count: 0, quote: text };
          cur.count++;
          goodPointsMap.set(defaultPoint, cur);
        }
      });

      // Extract repetitive bad points
      const badPointsMap = new Map<string, { count: number; quote: string }>();
      aspectNeg.forEach(r => {
        const text = r.customer_review || '';
        let matched = false;
        for (const bp of aspect.badPatterns) {
          if (bp.pattern.test(text)) {
            const cur = badPointsMap.get(bp.point) || { count: 0, quote: text };
            cur.count++;
            badPointsMap.set(bp.point, cur);
            matched = true;
          }
        }
        if (!matched) {
          const defaultPoint = `Customer concern noted regarding ${aspect.title.toLowerCase()}`;
          const cur = badPointsMap.get(defaultPoint) || { count: 0, quote: text };
          cur.count++;
          badPointsMap.set(defaultPoint, cur);
        }
      });

      const goodPoints = Array.from(goodPointsMap.entries())
        .map(([point, data]) => ({ point, count: data.count, quote: data.quote }))
        .sort((a, b) => b.count - a.count);

      const badPoints = Array.from(badPointsMap.entries())
        .map(([point, data]) => ({ point, count: data.count, quote: data.quote }))
        .sort((a, b) => b.count - a.count);

      const posCount = aspectPos.length;
      const negCount = aspectNeg.length;
      const totalAspect = posCount + negCount;
      const sentimentScore = totalAspect > 0 ? Math.round((posCount / totalAspect) * 100) : 100;

      return {
        id: aspect.id,
        category: aspect.title,
        icon: aspect.icon,
        positiveCount: posCount,
        negativeCount: negCount,
        sentimentScore,
        goodPoints,
        badPoints,
      };
    });

    // ============ 2. FAKE & DUPLICATE REVIEW DETECTION ============
    interface FlaggedReview {
      id: string;
      customerReview: string;
      rating: number | null;
      reviewDate: string;
      platform: string;
      issueType: 'duplicate' | 'gibberish' | 'mismatch' | 'spam';
      reason: string;
      severity: 'high' | 'medium' | 'low';
      explanation: string;
    }

    const flaggedReviews: FlaggedReview[] = [];
    const normalizedSeen = new Map<string, string>(); // normalizedText -> originalId

    reviews.forEach(r => {
      const rawText = (r.customer_review || '').trim();
      const normText = rawText.toLowerCase().replace(/[^a-z0-9]/g, '');
      const rating = r.rating;

      let isFlagged = false;

      // 1) Duplicate Detection
      if (normText.length >= 8) {
        if (normalizedSeen.has(normText)) {
          flaggedReviews.push({
            id: r.id,
            customerReview: rawText,
            rating,
            reviewDate: r.review_date,
            platform: r.platform,
            issueType: 'duplicate',
            reason: 'Identical Duplicate Review',
            severity: 'high',
            explanation: `Exact identical review text was previously submitted (matching review #${normalizedSeen.get(normText)}). Typically indicates automated bot submissions or duplicate paste.`
          });
          isFlagged = true;
        } else {
          normalizedSeen.set(normText, r.id);
        }
      }

      if (isFlagged) return;

      // 2) Gibberish & Nonsense Detection ("reviews that don't have any sense")
      // a) Keyboard mashing (e.g. asdfghjk, qwerty, zxcvbnm)
      const isKeyboardMash = /(asdfgh|qwerty|zxcvbn|poiuyt|lkjhgf|mnbvcx)/i.test(rawText);
      // b) Repeated identical characters (e.g. "aaaaaa", "zzzzzzz", ".....", "?????")
      const hasCharRepetition = /(.)\1{4,}/.test(rawText);
      // c) Repeated identical words (e.g. "good good good good", "nice nice nice nice")
      const hasWordRepetition = /\b([a-zA-Z]{2,})\b(\s+\1\b){2,}/i.test(rawText);
      // d) Meaningless very short text with no food/service relevance
      const isUltraShortSymbols = rawText.length <= 4 && !/^(ok|good|yum|nice|bad|love)$/i.test(rawText);
      // e) Low vowel ratio in text with > 8 characters (gibberish consonant clusters like "gfdsqwrty")
      const vowels = (rawText.match(/[aeiou]/gi) || []).length;
      const letters = (rawText.match(/[a-z]/gi) || []).length;
      const isConsonantMash = letters >= 10 && (vowels / letters) < 0.15;

      if (isKeyboardMash || hasCharRepetition || hasWordRepetition || isUltraShortSymbols || isConsonantMash) {
        let explanation = 'Review text contains nonsense gibberish, repeated characters, or keyboard mash with no real feedback.';
        if (hasWordRepetition) explanation = 'Repetitive robotic word patterns (e.g., repeating the same word multiple times without sentence structure).';
        if (isKeyboardMash) explanation = 'Contains keyboard mashing sequences (e.g. "asdfgh" or "qwerty").';

        flaggedReviews.push({
          id: r.id,
          customerReview: rawText,
          rating,
          reviewDate: r.review_date,
          platform: r.platform,
          issueType: 'gibberish',
          reason: "Nonsense / Gibberish Text (Doesn't make sense)",
          severity: 'high',
          explanation
        });
        return;
      }

      // 3) Rating vs Sentiment Mismatch (Contradictory Review)
      const hasStrongNegatives = /\b(terrible|worst|disgusting|horrible|pathetic|stale|vomit|waste of money|never order|rotten|spoiled|unhygienic)\b/i.test(rawText);
      const hasStrongPositives = /\b(delicious|amazing|superb|loved it|best ever|outstanding|heavenly|phenomenal|finger licking|excellent)\b/i.test(rawText);

      if (rating !== null && rating >= 4 && hasStrongNegatives) {
        flaggedReviews.push({
          id: r.id,
          customerReview: rawText,
          rating,
          reviewDate: r.review_date,
          platform: r.platform,
          issueType: 'mismatch',
          reason: 'Severe Rating vs Text Contradiction',
          severity: 'medium',
          explanation: `Customer gave a high score (${rating}★) but the review text is severely negative ("${rawText.slice(0, 60)}..."). Makes no logical sense.`
        });
        return;
      }

      if (rating !== null && rating <= 2 && hasStrongPositives && !/\b(not|never|wasn't|hardly)\b/i.test(rawText)) {
        flaggedReviews.push({
          id: r.id,
          customerReview: rawText,
          rating,
          reviewDate: r.review_date,
          platform: r.platform,
          issueType: 'mismatch',
          reason: 'Severe Rating vs Text Contradiction',
          severity: 'medium',
          explanation: `Customer gave a low score (${rating}★) but the review text is purely positive ("${rawText.slice(0, 60)}..."). Makes no logical sense.`
        });
        return;
      }

      // 4) Promotional spam / Bot patterns
      const hasPhone = /\b\d{10}\b|\+91[- ]?\d{10}/.test(rawText);
      const hasUrl = /https?:\/\/|www\./i.test(rawText);
      if (hasPhone || hasUrl) {
        flaggedReviews.push({
          id: r.id,
          customerReview: rawText,
          rating,
          reviewDate: r.review_date,
          platform: r.platform,
          issueType: 'spam',
          reason: 'Promotional Spam / Contact Numbers',
          severity: 'high',
          explanation: 'Review contains phone numbers or external web links.'
        });
      }
    });

    const duplicateCount = flaggedReviews.filter(f => f.issueType === 'duplicate').length;
    const nonsenseCount = flaggedReviews.filter(f => f.issueType === 'gibberish').length;
    const contradictionCount = flaggedReviews.filter(f => f.issueType === 'mismatch').length;
    const spamCount = flaggedReviews.filter(f => f.issueType === 'spam').length;
    const totalFlagged = flaggedReviews.length;
    const authenticityScore = Math.max(0, Math.round(((total - totalFlagged) / total) * 100));

    // Star rating distribution
    const ratingDistribution: Record<string, { count: number; percentage: number }> = {
      '5': { count: 0, percentage: 0 },
      '4': { count: 0, percentage: 0 },
      '3': { count: 0, percentage: 0 },
      '2': { count: 0, percentage: 0 },
      '1': { count: 0, percentage: 0 },
    };
    ratingsList.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r))).toString();
      if (ratingDistribution[star]) ratingDistribution[star].count++;
    });
    Object.keys(ratingDistribution).forEach(k => {
      const c = ratingDistribution[k].count;
      ratingDistribution[k].percentage = ratingsList.length > 0 ? Math.round((c / ratingsList.length) * 100) : 0;
    });

    // Generate concise, contextual AI Summary
    let summary = `Based on ${total} uploaded customer review${total > 1 ? 's' : ''}, `;
    const posPct = Math.round((positiveReviews.length / total) * 100);
    const negPct = Math.round((negativeReviews.length / total) * 100);

    if (posPct >= 70) {
      summary += `${productName} is a top customer favorite with ${posPct}% positive sentiment. `;
      if (positiveThemes[0]) {
        summary += `Patrons frequently highlight ${positiveThemes[0].theme.toLowerCase()}. `;
      }
      if (negativeThemes[0]) {
        summary += `Minor complaints focus on ${negativeThemes[0].theme.toLowerCase()}.`;
      }
    } else if (negPct >= 40) {
      summary += `${productName} has received notable customer criticism (${negPct}% negative sentiment). `;
      if (negativeThemes[0]) {
        summary += `The most critical issue is ${negativeThemes[0].theme.toLowerCase()} ("${negativeThemes[0].representativeQuote.slice(0, 80)}..."). `;
      }
      summary += 'Immediate kitchen and dispatch adjustments are recommended.';
    } else {
      summary += `${productName} shows balanced feedback (${posPct}% positive, ${negPct}% negative). `;
      if (positiveThemes[0]) summary += `Strengths include ${positiveThemes[0].theme.toLowerCase()}, `;
      if (negativeThemes[0]) summary += `while areas for improvement include ${negativeThemes[0].theme.toLowerCase()}.`;
    }

    res.json({
      productName,
      totalReviews: total,
      positiveCount: positiveReviews.length,
      negativeCount: negativeReviews.length,
      neutralCount: neutralReviews.length,
      positivePercentage: Math.round((positiveReviews.length / total) * 100),
      negativePercentage: Math.round((negativeReviews.length / total) * 100),
      neutralPercentage: Math.round((neutralReviews.length / total) * 100),
      averageRating,
      ratingDistribution,
      positiveThemes,
      negativeThemes,
      pairedTypeAnalysis,
      qualityAnalysis: {
        authenticityScore,
        totalFlagged,
        duplicateCount,
        nonsenseCount,
        contradictionCount,
        spamCount,
        flaggedReviews,
      },
      customerPreferences,
      improvementOpportunities,
      aiSummary: summary,
      sampleReviews: reviews.slice(0, 50).map(r => ({
        id: r.id,
        customerReview: r.customer_review,
        rating: r.rating,
        reviewDate: r.review_date,
        platform: r.platform,
        sentiment: r.sentiment,
        theme: r.theme,
      })),
    });
  } catch (error: any) {
    console.error('Product review analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze product reviews' });
  }
});

// 6. GET /api/reviews/products-summary: Summary of all dishes found in manual reviews
reviewsRouter.get('/products-summary', (req: Request, res: Response) => {
  try {
    const rawRestId = (req.query.restaurantId as string) || 'restaurant_nelam_001';
    const restaurantId = ensureValidRestaurant(rawRestId);

    const rows = db.prepare(`
      SELECT 
        product_name,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive_count,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative_count,
        SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral_count,
        ROUND(AVG(rating), 1) as avg_rating,
        MAX(created_at) as last_analyzed,
        MAX(review_date) as latest_review_date
      FROM manual_reviews
      WHERE restaurant_id = ? AND is_general = 0 AND product_name IS NOT NULL AND TRIM(product_name) != ''
      GROUP BY product_name
      ORDER BY total_reviews DESC
    `).all(restaurantId) as any[];

    const inferCategory = (name: string): string => {
      const lower = name.toLowerCase();
      if (/biryani|rice|pulao|fried rice/i.test(lower)) return 'Biryani & Rice';
      if (/naan|roti|paratha|kulcha|bread/i.test(lower)) return 'Breads';
      if (/tikka|kebab|starter|fry|crispy|chilli|paneer tikka/i.test(lower)) return 'Appetizers & Starters';
      if (/coffee|shake|tea|beverage|drink|juice|cooler/i.test(lower)) return 'Beverages';
      if (/curry|gravy|masala|butter chicken|dal|paneer butter/i.test(lower)) return 'Main Course';
      if (/dessert|ice cream|jamun|halwa|sweet/i.test(lower)) return 'Desserts';
      return 'Main Course';
    };

    const products = rows.map((r, i) => {
      const total = r.total_reviews || 0;
      const pos = r.positive_count || 0;
      const neg = r.negative_count || 0;
      const neu = r.neutral_count || 0;

      return {
        id: `prod_uploaded_${i + 1}`,
        name: r.product_name,
        category: inferCategory(r.product_name),
        totalReviews: total,
        positiveCount: pos,
        negativeCount: neg,
        neutralCount: neu,
        positivePercentage: total > 0 ? Math.round((pos / total) * 100) : 0,
        negativePercentage: total > 0 ? Math.round((neg / total) * 100) : 0,
        neutralPercentage: total > 0 ? Math.round((neu / total) * 100) : 0,
        averageRating: r.avg_rating || null,
        lastAnalyzed: r.last_analyzed || new Date().toISOString(),
        latestReviewDate: r.latest_review_date || null,
        platforms: ['Spreadsheet / CSV', 'Uploaded Data'],
        imageUrl: getDishImage(r.product_name),
        dataMode: 'UPLOADED',
      };
    });

    res.json({ products, total: products.length });
  } catch (error: any) {
    console.error('Products summary error:', error);
    res.status(500).json({ error: 'Failed to retrieve products summary' });
  }
});

function getDishImage(name: string): string {
  const lower = name.toLowerCase();
  if (/chicken|butter chicken/i.test(lower)) return 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80';
  if (/paneer|paneer butter/i.test(lower)) return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80';
  if (/biryani|rice/i.test(lower)) return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80';
  if (/naan|roti/i.test(lower)) return 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80';
  if (/coffee|drink|beverage/i.test(lower)) return 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80';
  if (/tikka|kebab/i.test(lower)) return 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80';
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
}

