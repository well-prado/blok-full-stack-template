import EmailServiceManager from "./EmailServiceManager";
import EmailTemplates from "./EmailTemplates";
import EmailVerification from "./EmailVerification";

export {
  EmailServiceManager,
  EmailVerification,
  EmailTemplates,
};

// Export instances for direct use in Nodes.ts
export default {
  "email-service-manager": new EmailServiceManager(),
  "email-verification": new EmailVerification(),
  "email-templates": new EmailTemplates(),
};
