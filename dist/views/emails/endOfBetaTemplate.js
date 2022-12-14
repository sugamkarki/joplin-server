"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../config");
function default_1(view) {
    if (view.expireDays <= 0) {
        return {
            subject: `Your ${config_1.default().appName} beta account is expired`,
            body: `

Your ${config_1.default().appName} beta account is expired.

To continue using it, please start the subscription by following the link below. From that page, select either monthly or yearly payments and click "Buy now".

Note that remaining days on the beta trial period will be transferred to the new subscription, so you will not lose any trial day. It means you do not need to wait till the last day to start the subscription.

${view.startSubUrl}

If you have any question please contact support at ${config_1.default().supportEmail}.

`.trim(),
        };
    }
    else {
        return {
            subject: `Your ${config_1.default().appName} beta account will expire in ${view.expireDays} days`,
            body: `

Your ${config_1.default().appName} beta account will expire in ${view.expireDays} days.

To continue using it after this date, please start the subscription by following the link below. From that page, select either monthly or yearly payments and click "Buy now".

Note that remaining days on the beta trial period will be transferred to the new subscription, so you will not lose any trial day. It means you do not need to wait till the last day to start the subscription.

${view.startSubUrl}

If you have any question please contact support at ${config_1.default().supportEmail}.

`.trim(),
        };
    }
}
exports.default = default_1;
//# sourceMappingURL=endOfBetaTemplate.js.map