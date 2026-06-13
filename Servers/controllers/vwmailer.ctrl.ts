import { Request, Response } from "express";
import { logProcessing, logSuccess, logFailure } from "../utils/logger/logHelper";
import logger from "../utils/logger/fileLogger";
import { markInvitationAcceptedQuery } from "../utils/invitation.utils";
import { createNewUserQuery, getUserByEmailQuery } from "../utils/user.utils";
import { UserModel } from "../domain.layer/models/user/user.model";
import { sequelize } from "../database/db";

const DEFAULT_INVITED_USER_PASSWORD =
  process.env.INVITED_USER_DEFAULT_PASSWORD || process.env.SUPERADMIN_PASSWORD || "ChangeMe!Str0ng";

export const invite = async (
  req: Request,
  res: Response,
  body: {
    to: string;
    name: string;
    surname?: string;
    roleId: number;
    organizationId: number;
  },
) => {
  const { to, name, surname, roleId, organizationId } = body;

  logProcessing({
    description: `starting invite email for user: ${to}`,
    functionName: "invite",
    fileName: "vwmailer.ctrl.ts",
    userId: req.userId!,
    tenantId: req.organizationId!,
  });
  logger.debug(`Creating invited user directly for ${to}: ${name} ${surname || ""}`);

  const transaction = await sequelize.transaction();
  let transactionFinished = false;
  try {
    const existingUser = await getUserByEmailQuery(to);

    if (existingUser) {
      await transaction.rollback();
      transactionFinished = true;
      return res.status(409).json({
        error: req.t!("User with this email already exists"),
      });
    }

    const userModel = await UserModel.createNewUser(
      name,
      surname?.trim() || "User",
      to,
      DEFAULT_INVITED_USER_PASSWORD,
      Number(roleId),
      Number(organizationId),
    );
    await userModel.validateUserData();

    const user = await createNewUserQuery(userModel, transaction);

    try {
      await markInvitationAcceptedQuery(organizationId, to);
    } catch {
      // Non-critical; direct-created users should not be blocked by invitation cleanup.
    }

    await transaction.commit();
    transactionFinished = true;

    await logSuccess({
      eventType: "Create",
      description: `Successfully created user ${to} directly without invitation email`,
      functionName: "invite",
      fileName: "vwmailer.ctrl.ts",
      userId: req.userId!,
      tenantId: req.organizationId!,
    });

    return res.status(200).json({
      message: req.t!("User added successfully"),
      user: user.toSafeJSON(),
      temporaryPassword: DEFAULT_INVITED_USER_PASSWORD,
    });
  } catch (error) {
    if (!transactionFinished) {
      await transaction.rollback();
    }
    console.error("Error adding user:", error);
    await logFailure({
      eventType: "Create",
      description: `Failed to create user directly for ${to}`,
      functionName: "invite",
      fileName: "vwmailer.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.organizationId!,
    });
    return res.status(500).json({
      error: req.t!("Failed to add user"),
      details: (error as Error).message,
    });
  }
};
