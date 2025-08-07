import express from 'express';
import Coupon from '../models/Coupon.js';

const router = express.Router();

// Debug route to test if routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Analytics routes are working', timestamp: new Date().toISOString() });
});

// Get overview statistics - TEMP: Remove auth
router.get('/overview', async (req, res) => {
  try {
    // Only include non-deleted coupons for dashboard stats
    const totalCoupons = await Coupon.countDocuments({ deleted: false }); // only non-deleted coupons
    const activeCoupons = await Coupon.countDocuments({ 
      isActive: true, 
      expiresAt: { $gt: new Date() },
      deleted: false
    });
    const expiredCoupons = await Coupon.countDocuments({ 
      expiresAt: { $lt: new Date() },
      deleted: false
    });
    
    // Calculate total redemptions and revenue from non-deleted coupons
    const coupons = await Coupon.find({ deleted: false }); // only non-deleted
    const totalRedemptions = coupons.reduce((sum, coupon) => sum + coupon.usageCount, 0);
    const totalRevenue = coupons.reduce((sum, coupon) => {
      return sum + coupon.redemptions.reduce((redemptionSum, redemption) => {
        return redemptionSum + redemption.discountAmount;
      }, 0);
    }, 0);
    
    // Calculate average discount
    const totalDiscountAmount = coupons.reduce((sum, coupon) => {
      return sum + coupon.redemptions.reduce((redemptionSum, redemption) => {
        return redemptionSum + redemption.discountAmount;
      }, 0);
    }, 0);
    const avgDiscountValue = totalRedemptions > 0 ? totalDiscountAmount / totalRedemptions : 0;
    
    res.json({
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      totalRedemptions,
      totalRevenue,
      avgDiscountValue,
      conversionRate: totalRedemptions > 0 ? (totalRedemptions / totalCoupons) * 100 : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get revenue and redemption trends - TEMP: Remove auth
router.get('/revenue-trends', async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const monthsBack = parseInt(months);

    // Calculate the first day of the earliest month to include
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1, 0, 0, 0, 0);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch all coupons with redemptions in the range (only non-deleted)
    const coupons = await Coupon.find({
      deleted: false,
      'redemptions.redeemedAt': { $gte: startMonth, $lte: endMonth }
    });

    // Prepare a map for each month in the range
    const monthlyData = [];
    const monthLabels = [];
    for (let i = 0; i < monthsBack; i++) {
      const date = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
      const label = `${date.toLocaleString('default', { month: 'short' })} '${String(date.getFullYear()).slice(-2)}`;
      monthLabels.push({
        label,
        year: date.getFullYear(),
        month: date.getMonth()
      });
      monthlyData.push({
        month: label,
        revenue: 0,
        redemptions: 0,
        newUsers: new Set()
      });
    }

    // Aggregate redemptions into the correct month bucket
    coupons.forEach(coupon => {
      coupon.redemptions.forEach(redemption => {
        const rDate = new Date(redemption.redeemedAt);
        for (let i = 0; i < monthLabels.length; i++) {
          if (
            rDate.getFullYear() === monthLabels[i].year &&
            rDate.getMonth() === monthLabels[i].month
          ) {
            monthlyData[i].revenue += redemption.discountAmount;
            monthlyData[i].redemptions += 1;
            monthlyData[i].newUsers.add(String(redemption.userId));
            break;
          }
        }
      });
    });

    // Convert newUsers Set to count
    monthlyData.forEach(md => {
      md.newUsers = md.newUsers.size;
    });

    res.json(monthlyData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top performing coupons - TEMP: Remove auth
router.get('/top-performers', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Only non-deleted coupons for top performers
    const coupons = await Coupon.find({ deleted: false }).sort({ usageCount: -1 }).limit(parseInt(limit));
    
    const topPerformers = coupons.map(coupon => {
      const revenue = coupon.redemptions.reduce((sum, redemption) => {
        return sum + redemption.discountAmount;
      }, 0);
      
      const conversionRate = coupon.usageLimit ? (coupon.usageCount / coupon.usageLimit) * 100 : 0;
      
      return {
        code: coupon.code,
        redemptions: coupon.usageCount,
        revenue,
        conversionRate: conversionRate.toFixed(1)
      };
    });
    
    res.json(topPerformers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user segments - TEMP: Remove auth
router.get('/user-segments', async (req, res) => {
  try {
    // Use only non-deleted coupons
    const coupons = await Coupon.find({ deleted: false });
    const userStats = {};

    coupons.forEach(coupon => {
      coupon.redemptions.forEach(redemption => {
        const userId = redemption.userId?.toString();
        if (!userStats[userId]) {
          userStats[userId] = {
            redemptions: [],
            plans: new Set()
          };
        }
        userStats[userId].redemptions.push(redemption.planId);
        userStats[userId].plans.add(redemption.planId);
      });
    });

    let newBasic = 0, newPremium = 0, returningBasic = 0, returningPremium = 0;

    Object.values(userStats).forEach(user => {
      const isPremium = [...user.plans].some(
        p => p === 'premium-499' || p === 'elite vip-999'
      );
      if (user.redemptions.length === 1) {
        if (isPremium) newPremium += 1;
        else newBasic += 1;
      } else {
        if (isPremium) returningPremium += 1;
        else returningBasic += 1;
      }
    });

    const total = newBasic + newPremium + returningBasic + returningPremium || 1;

    res.json([
      { name: 'New Basic', value: Math.round((newBasic / total) * 100), color: '#8B5CF6' },
      { name: 'New Premium', value: Math.round((newPremium / total) * 100), color: '#06B6D4' },
      { name: 'Returning Basic', value: Math.round((returningBasic / total) * 100), color: '#F59E42' },
      { name: 'Returning Premium', value: Math.round((returningPremium / total) * 100), color: '#10B981' }
    ]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get plan distribution - TEMP: Remove auth
router.get('/plan-distribution', async (req, res) => {
  try {
    // Use only non-deleted coupons
    const coupons = await Coupon.find({ deleted: false });
    // Dynamically collect all planIds from redemptions
    const planStats = {};
    coupons.forEach(coupon => {
      coupon.redemptions.forEach(redemption => {
        const planId = redemption.planId;
        if (!planStats[planId]) planStats[planId] = { usage: 0, revenue: 0 };
        planStats[planId].usage += 1;
        planStats[planId].revenue += redemption.discountAmount;
      });
    });
    const planDistribution = Object.entries(planStats).map(([plan, stats]) => ({
      plan,
      usage: stats.usage,
      revenue: stats.revenue
    }));
    res.json(planDistribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get conversion funnel - TEMP: Remove auth
router.get('/conversion-funnel', async (req, res) => {
  try {
    // Use only non-deleted coupons
    const totalCoupons = await Coupon.countDocuments({ deleted: false });
    const couponsWithRedemptions = await Coupon.countDocuments({ usageCount: { $gt: 0 }, deleted: false });
    const totalRedemptions = await Coupon.aggregate([
      { $match: { deleted: false } },
      { $group: { _id: null, total: { $sum: '$usageCount' } } }
    ]);
    
    const redemptionCount = totalRedemptions.length > 0 ? totalRedemptions[0].total : 0;
    
    // Mock data for demonstration - in real app, you'd track views and attempts
    const mockViews = redemptionCount * 2.5;
    const mockAttempts = redemptionCount * 1.8;
    
    res.json([
      { stage: 'Coupon Views', value: Math.round(mockViews), percentage: 100 },
      { stage: 'Attempted Use', value: Math.round(mockAttempts), percentage: Math.round((mockAttempts / mockViews) * 100) },
      { stage: 'Successful Redemption', value: redemptionCount, percentage: Math.round((redemptionCount / mockViews) * 100) },
      { stage: 'Completed Purchase', value: Math.round(redemptionCount * 0.85), percentage: Math.round((redemptionCount * 0.85 / mockViews) * 100) }
    ]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

