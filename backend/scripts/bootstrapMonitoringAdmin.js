"use strict";

require("dotenv").config();
const { prisma } = require("../src/config/prisma");

const permissionsByRole = {
  OWNER: ["merchant_applications.read", "merchant_applications.manage"],
  REVIEWER: ["merchant_applications.read", "merchant_applications.manage"],
  READ_ONLY: ["merchant_applications.read"]
};

async function main() {
  const email = String(process.env.MONITORING_ADMIN_BOOTSTRAP_EMAIL || "").trim().toLowerCase();
  if (!email) throw new Error("MONITORING_ADMIN_BOOTSTRAP_EMAIL is required.");
  const role = process.env.MONITORING_ADMIN_BOOTSTRAP_ROLE || "OWNER";
  if (!permissionsByRole[role]) throw new Error("MONITORING_ADMIN_BOOTSTRAP_ROLE must be OWNER, REVIEWER, or READ_ONLY.");
  const fullName = String(process.env.MONITORING_ADMIN_BOOTSTRAP_NAME || "Signal Operations").trim();

  const admin = await prisma.monitoringAdmin.upsert({
    where: { email },
    update: { fullName, role, permissions: permissionsByRole[role], status: "ACTIVE" },
    create: { email, fullName, role, permissions: permissionsByRole[role], status: "ACTIVE" },
    select: { email: true, fullName: true, role: true, status: true }
  });

  console.log(JSON.stringify({ message: "Monitoring administrator ready.", ...admin }));
}

main()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
