import React from "react";
const CouponsTab = ({
  allCoupons,
  couponsLoading,
  couponsError,
  copiedCoupon,
  handleCopyCoupon,
  getPlanNames,
}) => (
  <div>
    <h2 className="text-2xl font-bold mb-4">Available Coupons</h2>
    {couponsLoading ? (
      <div className="py-8 text-center text-gray-500">Loading coupons...</div>
    ) : couponsError ? (
      <div className="py-8 text-center text-red-500">{couponsError}</div>
    ) : allCoupons.length === 0 ? (
      <div className="py-8 text-center text-gray-500">
        No coupons available at the moment.
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allCoupons.map((coupon) => {
          // Always use backend fields for display
          const discountLabel =
            coupon.type === "percentage"
              ? `${coupon.value}% OFF${
                  coupon.maximumDiscount
                    ? ` (Max ₹${coupon.maximumDiscount})`
                    : ""
                }`
              : `₹${coupon.value} OFF`;

          const expiry =
            coupon.expiresAt
              ? new Date(coupon.expiresAt).toLocaleDateString()
              : coupon.validTill
              ? new Date(coupon.validTill).toLocaleDateString()
              : "N/A";

          return (
            <div
              key={coupon._id}
              className={`relative rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-6 shadow-lg flex flex-col gap-3 transition-all duration-200 hover:shadow-xl`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl font-extrabold text-blue-700 tracking-wider">
                  {coupon.code}
                </span>
                <button
                  className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold border border-blue-500 text-blue-600 bg-white hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 transition`}
                  onClick={() => handleCopyCoupon(coupon.code)}
                >
                  {copiedCoupon === coupon.code ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="text-gray-700 dark:text-gray-200 font-medium mb-1">
                {coupon.description}
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {discountLabel}
                </span>
                {coupon.usageLimit && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Uses Left: {coupon.usageLimit - (coupon.usageCount || 0)}
                  </span>
                )}
              </div>
              <div className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                <span className="font-semibold">Applicable Plans:</span>{" "}
                {
                  (() => {
                    const planNames = getPlanNames(coupon.applicablePlans);
                    return planNames.length === 1 && planNames[0] === "All"
                      ? "All"
                      : planNames.join(", ");
                  })()
                }
              </div>
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <span className="font-semibold">Expires:</span> {expiry}
              </div>
              {!coupon.isActive && (
                <div className="absolute top-2 right-2 bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold shadow">
                  Inactive
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);

export default CouponsTab;
