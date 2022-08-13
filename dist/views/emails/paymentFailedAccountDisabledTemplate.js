"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const markdownUtils_1 = require("@joplin/lib/markdownUtils");
const config_1 = require("../../config");
const urlUtils_1 = require("../../utils/urlUtils");
exports.default = () => {
    return {
        subject: `Your ${config_1.default().appName} payment could not be processed`,
        body: `

Your last ${config_1.default().appName} payment could not be processed. As a result your account has disabled.

To re-activate your account, please update your payment details, or contact us for more details.

[Manage your subscription](${markdownUtils_1.default.escapeLinkUrl(urlUtils_1.stripePortalUrl())})

`.trim(),
    };
};
//# sourceMappingURL=paymentFailedAccountDisabledTemplate.js.map