import type { Review, ReviewTheme, AnalysisResult, PlatformStats, TrendData, Sentiment } from '../types';

export const analyzeReviews = (productId: string, reviews: Review[]): AnalysisResult => {
  // Filter reviews for this product (exclude restaurant-level Google reviews for delivery platform analysis)
  const productReviews = reviews.filter(
    (r) => r.productId === productId && r.scope === 'product'
  );

  const totalReviews = productReviews.length;
  const positiveCount = productReviews.filter((r) => r.sentiment === 'positive').length;
  const negativeCount = productReviews.filter((r) => r.sentiment === 'negative').length;
  const neutralCount = productReviews.filter((r) => r.sentiment === 'neutral').length;

  // Extract positive themes
  const positiveThemes = extractThemes(
    productReviews.filter((r) => r.sentiment === 'positive'),
    'positive'
  );

  // Extract negative themes
  const negativeThemes = extractThemes(
    productReviews.filter((r) => r.sentiment === 'negative'),
    'negative'
  );

  // Calculate platform distribution
  const platformDistribution = calculatePlatformStats(productReviews);

  // Generate trend data
  const trends = generateTrends(productReviews);

  // Generate recommendations
  const recommendations = generateRecommendations(positiveThemes, negativeThemes);

  // Detect fake and duplicate reviews
  const { fakeCount, duplicateCount } = detectFakeAndDuplicateReviews(productReviews);

  return {
    productId,
    totalReviews,
    positiveCount,
    negativeCount,
    neutralCount,
    positiveThemes,
    negativeThemes,
    platformDistribution,
    trends,
    recommendations,
    fakeReviewsCount: fakeCount,
    fakeReviewsPercentage: totalReviews > 0 ? (fakeCount / totalReviews) * 100 : 0,
    duplicateReviewsCount: duplicateCount,
    duplicateReviewsPercentage: totalReviews > 0 ? (duplicateCount / totalReviews) * 100 : 0,
  };
};

export const analyzeGoogleReviews = (productId: string, reviews: Review[]): AnalysisResult => {
  // Filter Google reviews for this product (include restaurant-level reviews)
  const googleReviews = reviews.filter(
    (r) => r.productId === productId && r.platform === 'Google'
  );

  const totalReviews = googleReviews.length;
  const positiveCount = googleReviews.filter((r) => r.sentiment === 'positive').length;
  const negativeCount = googleReviews.filter((r) => r.sentiment === 'negative').length;
  const neutralCount = googleReviews.filter((r) => r.sentiment === 'neutral').length;

  const positiveThemes = extractThemes(
    googleReviews.filter((r) => r.sentiment === 'positive'),
    'positive'
  );

  const negativeThemes = extractThemes(
    googleReviews.filter((r) => r.sentiment === 'negative'),
    'negative'
  );

  const platformDistribution: PlatformStats[] = [
    {
      platform: 'Google',
      count: totalReviews,
      positive: positiveCount,
      negative: negativeCount,
      neutral: neutralCount,
    },
  ];

  const trends = generateTrends(googleReviews);
  const recommendations = generateRecommendations(positiveThemes, negativeThemes);

  // Detect fake and duplicate reviews
  const { fakeCount, duplicateCount } = detectFakeAndDuplicateReviews(googleReviews);

  return {
    productId,
    totalReviews,
    positiveCount,
    negativeCount,
    neutralCount,
    positiveThemes,
    negativeThemes,
    platformDistribution,
    trends,
    recommendations,
    fakeReviewsCount: fakeCount,
    fakeReviewsPercentage: totalReviews > 0 ? (fakeCount / totalReviews) * 100 : 0,
    duplicateReviewsCount: duplicateCount,
    duplicateReviewsPercentage: totalReviews > 0 ? (duplicateCount / totalReviews) * 100 : 0,
  };
};

const extractThemes = (reviews: Review[], sentiment: Sentiment): ReviewTheme[] => {
  const themeMap = new Map<string, Review[]>();

  reviews.forEach((review) => {
    const theme = review.theme;
    if (!themeMap.has(theme)) {
      themeMap.set(theme, []);
    }
    themeMap.get(theme)!.push(review);
  });

  const themes: ReviewTheme[] = Array.from(themeMap.entries())
    .map(([theme, themeReviews]) => ({
      theme,
      count: themeReviews.length,
      percentage: (themeReviews.length / reviews.length) * 100,
      sentiment,
      representativeQuote: themeReviews[0].reviewText,
    }))
    .sort((a, b) => b.count - a.count);

  return themes;
};

const calculatePlatformStats = (reviews: Review[]): PlatformStats[] => {
  const platformMap = new Map<string, Review[]>();

  reviews.forEach((review) => {
    const platform = review.platform;
    if (!platformMap.has(platform)) {
      platformMap.set(platform, []);
    }
    platformMap.get(platform)!.push(review);
  });

  const stats: PlatformStats[] = Array.from(platformMap.entries()).map(
    ([platform, platformReviews]) => ({
      platform: platform as any,
      count: platformReviews.length,
      positive: platformReviews.filter((r) => r.sentiment === 'positive').length,
      negative: platformReviews.filter((r) => r.sentiment === 'negative').length,
      neutral: platformReviews.filter((r) => r.sentiment === 'neutral').length,
    })
  );

  return stats;
};

const generateTrends = (reviews: Review[]): TrendData[] => {
  const dateMap = new Map<string, Review[]>();

  reviews.forEach((review) => {
    const date = review.createdAt.split('T')[0]; // Get date part only
    if (!dateMap.has(date)) {
      dateMap.set(date, []);
    }
    dateMap.get(date)!.push(review);
  });

  const trends: TrendData[] = Array.from(dateMap.entries())
    .map(([date, dateReviews]) => ({
      date,
      positive: dateReviews.filter((r) => r.sentiment === 'positive').length,
      negative: dateReviews.filter((r) => r.sentiment === 'negative').length,
      neutral: dateReviews.filter((r) => r.sentiment === 'neutral').length,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return trends;
};

const detectFakeAndDuplicateReviews = (reviews: Review[]): { fakeCount: number; duplicateCount: number } => {
  let fakeCount = 0;
  let duplicateCount = 0;

  // Detect duplicates: reviews with identical or very similar text
  const reviewTexts = new Map<string, number>();

  reviews.forEach((review) => {
    const normalizedText = review.reviewText.toLowerCase().trim();

    // Check for exact duplicates
    if (reviewTexts.has(normalizedText)) {
      duplicateCount++;
      reviewTexts.set(normalizedText, reviewTexts.get(normalizedText)! + 1);
    } else {
      reviewTexts.set(normalizedText, 1);
    }

    // Detect potential fake reviews based on patterns
    const text = review.reviewText.toLowerCase();

    // Very short reviews (less than 10 characters)
    if (text.length < 10) {
      fakeCount++;
      return;
    }

    // Generic phrases that appear in fake reviews
    const genericPhrases = [
      'good', 'nice', 'ok', 'awesome', 'great', 'bad', 'worst',
      'best ever', 'highly recommend', 'must try', 'amazing experience',
      'excellent service', 'poor quality', 'waste of money'
    ];

    const exactMatch = genericPhrases.some(phrase => text === phrase || text === phrase + '!' || text === phrase + '.');
    if (exactMatch) {
      fakeCount++;
      return;
    }

    // Reviews with excessive repetition of characters (e.g., "gooooood", "baaaad")
    if (/(.)\1{4,}/.test(text)) {
      fakeCount++;
      return;
    }

    // Reviews that are all caps and very short
    if (review.reviewText === review.reviewText.toUpperCase() && review.reviewText.length < 30) {
      fakeCount++;
      return;
    }
  });

  return { fakeCount, duplicateCount };
};

const generateRecommendations = (
  positiveThemes: ReviewTheme[],
  negativeThemes: ReviewTheme[]
): string[] => {
  const recommendations: string[] = [];

  // Generate recommendations based on negative themes
  negativeThemes.slice(0, 3).forEach((theme) => {
    if (theme.theme.toLowerCase().includes('cold') || theme.theme.toLowerCase().includes('temperature')) {
      recommendations.push(
        'Several customers mention that food arrives cold. Review preparation and packaging handoff times.'
      );
    } else if (theme.theme.toLowerCase().includes('spice') || theme.theme.toLowerCase().includes('spicy')) {
      recommendations.push(
        'Multiple reviews mention spice levels. Consider offering spice level customization options.'
      );
    } else if (theme.theme.toLowerCase().includes('packaging') || theme.theme.toLowerCase().includes('leaking')) {
      recommendations.push(
        'Repeated packaging complaints suggest that packaging quality should be reviewed.'
      );
    } else if (theme.theme.toLowerCase().includes('portion')) {
      recommendations.push(
        'Some customers feel portions are smaller than expected. Review portion sizes relative to pricing.'
      );
    } else if (theme.theme.toLowerCase().includes('oil')) {
      recommendations.push(
        'Oil content is a concern for some customers. Consider adjusting the recipe or offering a lighter version.'
      );
    } else if (theme.theme.toLowerCase().includes('waiting') || theme.theme.toLowerCase().includes('time')) {
      recommendations.push(
        'Delivery time concerns appear in reviews. Work with delivery partners to reduce wait times.'
      );
    }
  });

  // Generate recommendations based on positive themes
  positiveThemes.slice(0, 2).forEach((theme) => {
    if (theme.theme.toLowerCase().includes('taste') || theme.theme.toLowerCase().includes('flavor')) {
      recommendations.push(
        'Customers frequently praise the flavor. Maintain consistency in the recipe and ingredient quality.'
      );
    } else if (theme.theme.toLowerCase().includes('fresh')) {
      recommendations.push(
        'Freshness is appreciated by customers. Continue sourcing quality ingredients.'
      );
    } else if (theme.theme.toLowerCase().includes('portion')) {
      recommendations.push(
        'Portion sizes are appreciated. This is a competitive advantage worth maintaining.'
      );
    }
  });

  // Default recommendation if no specific themes found
  if (recommendations.length === 0) {
    recommendations.push(
      'Continue monitoring customer feedback to identify trends and improvement opportunities.'
    );
  }

  return recommendations;
};

export const getSentimentColor = (sentiment: Sentiment): string => {
  switch (sentiment) {
    case 'positive':
      return '#10b981'; // Muted green
    case 'negative':
      return '#dc2626'; // Soft brick red
    case 'neutral':
      return '#77716A'; // Warm gray
    default:
      return '#77716A';
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
