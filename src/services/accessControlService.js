const { getEntitlements } = require("./monetizationService");

async function getUsageSnapshot({ userId, getSimulationCountToday }) {
  const entitlements = getEntitlements(userId);
  const usedToday = await getSimulationCountToday(userId);
  const limit = entitlements.simulationLimitPerDay;
  const remainingToday = limit === null ? null : Math.max(limit - usedToday, 0);

  return {
    ...entitlements,
    usage: {
      usedToday,
      remainingToday
    }
  };
}

function canRunSimulation(usageSnapshot) {
  const { simulationLimitPerDay, usage } = usageSnapshot;
  if (simulationLimitPerDay === null) return { allowed: true };

  if (usage.usedToday >= simulationLimitPerDay) {
    return {
      allowed: false,
      reason: "free_limit_reached",
      message: "Free daily simulation limit reached. Upgrade to Pro to unlock unlimited simulations."
    };
  }

  return { allowed: true };
}

function canGeneratePremiumReport(usageSnapshot) {
  if (!usageSnapshot.premiumReportsEnabled) {
    return {
      allowed: false,
      reason: "premium_locked",
      message: "Premium Decision Report is available on Pro subscription."
    };
  }

  return { allowed: true };
}

module.exports = {
  getUsageSnapshot,
  canRunSimulation,
  canGeneratePremiumReport
};
