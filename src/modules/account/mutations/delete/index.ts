/*
 * IMPORTS
 */
import { Context } from "../../../../context";
import { producer as _Producer } from "../../../../kafka/kafkaClient";

/*
 * RESOLVER: Account Delete
 */
export async function AccountDelete(
  _parent: unknown,
  _args: unknown,
  Context: Context
) {
  try {
    // Check authentication
    if (!Context.user || !Context.user.id) {
      throw new Error("Unauthorized: User must be logged in");
    }

    const userId = Context.user.id;

    // Delete account
    const _Account = await Context.prisma.account.delete({
      where: { id: userId },
    });

    // If error persists
    if (_Account instanceof Error) {
      return _Account;
    }

    // If empty
    if (!_Account) {
      return new Error("Something went wrong in account");
    }

    // Published Kafka event using already connected producer
    await _Producer.send({
      topic: "account-deleted",
      messages: [
        {
          key: userId,
          value: JSON.stringify({
            userId,
            email: _Account.email,
            deletedAt: _Account.updatedAt || new Date().toISOString(),
          }),
        },
      ],
    });

    // Return response
    return {
      status: "ACCOUNT_DELETED",
      message: "Account deleted successfully. Cleanup is in progress.",
    };
  } catch (err: any) {
    console.error("AccountDelete Error:", err.message);
    throw new Error("Failed to delete account. Please try again later.");
  }
}
