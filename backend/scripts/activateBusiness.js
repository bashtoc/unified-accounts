"use strict";

const { prisma } = require("../src/config/prisma");
const { merchantApprovalService } = require("../src/services/merchantApprovalService");

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error("Usage: npm run business:activate -- merchant@example.com");
  }

  const application = await prisma.developerApplication.findFirst({
    where: { user: { email } },
    include: { user: { select: { email: true } } }
  });
  if (!application) throw new Error(`No monitoring workspace found for ${email}.`);
  if (application.status === "DELETED") throw new Error("Deleted workspaces cannot be activated.");

  const reviewerId = String(process.env.MONITORING_ADMIN_REVIEWER_ID || "").trim();
  const reviewerEmail = String(process.env.MONITORING_ADMIN_REVIEWER_EMAIL || "").trim().toLowerCase();
  if (!reviewerId || !reviewerEmail) {
    throw new Error("MONITORING_ADMIN_REVIEWER_ID and MONITORING_ADMIN_REVIEWER_EMAIL are required");
  }
  const result = await merchantApprovalService.decide({
    applicationId: application.id,
    action: "APPROVED",
    reviewer: { id: reviewerId, email: reviewerEmail },
    reason: "Controlled operator approval"
  });

  console.log(JSON.stringify({
    applicationId: application.id,
    email,
    status: result.application.status,
    changed: result.changed,
    scopes: result.application.apiKeys.flatMap((key) => key.scopes)
  }, null, 2));
}

main()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
