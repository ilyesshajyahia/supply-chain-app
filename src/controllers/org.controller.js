const asyncHandler = require("../utils/asyncHandler");
const orgService = require("../services/org.service");

const listUsers = asyncHandler(async (req, res) => {
  const data = await orgService.listOrgUsers(req.user.orgId);
  res.json({ ok: true, data });
});

const setUserActive = asyncHandler(async (req, res) => {
  const data = await orgService.setUserActive({
    orgId: req.user.orgId,
    userId: req.params.userId,
    isActive: req.body.isActive,
    actorUser: req.user,
    req,
  });
  res.json({ ok: true, data });
});

const setUserOrgAdmin = asyncHandler(async (req, res) => {
  const data = await orgService.setUserOrgAdmin({
    orgId: req.user.orgId,
    userId: req.params.userId,
    isOrgAdmin: req.body.isOrgAdmin,
    actorUser: req.user,
    req,
  });
  res.json({ ok: true, data });
});

const gasMetrics = asyncHandler(async (req, res) => {
  const days = req.query.days;
  const data = await orgService.getGasMetrics({
    orgId: req.user.orgId,
    days,
  });
  res.json({ ok: true, data });
});

module.exports = { listUsers, setUserActive, setUserOrgAdmin, gasMetrics };
