"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const routeUtils_1 = require("../../utils/routeUtils");
const Router_1 = require("../../utils/Router");
const types_1 = require("../../utils/types");
const joplinCloud_1 = require("@joplin/lib/utils/joplinCloud");
const config_1 = require("../../config");
const defaultView_1 = require("../../utils/defaultView");
const stripe_1 = require("../../utils/stripe");
const requestUtils_1 = require("../../utils/requestUtils");
const NotificationModel_1 = require("../../models/NotificationModel");
const UserModel_1 = require("../../models/UserModel");
const errors_1 = require("../../utils/errors");
const csrf_1 = require("../../utils/csrf");
const router = new Router_1.default(types_1.RouteType.Web);
function upgradeUrl() {
    return `${config_1.default().baseUrl}/upgrade`;
}
router.get('upgrade', (_path, ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const featureIds = joplinCloud_1.getAllFeatureIds();
    const planRows = [];
    for (let i = 0; i < featureIds.length; i++) {
        const featureId = featureIds[i];
        const basicLabel = joplinCloud_1.getFeatureLabel(joplinCloud_1.PlanName.Basic, featureId);
        const proLabel = joplinCloud_1.getFeatureLabel(joplinCloud_1.PlanName.Pro, featureId);
        const basicEnabled = joplinCloud_1.getFeatureEnabled(joplinCloud_1.PlanName.Basic, featureId);
        const proEnabled = joplinCloud_1.getFeatureEnabled(joplinCloud_1.PlanName.Pro, featureId);
        if (basicLabel === proLabel && basicEnabled === proEnabled)
            continue;
        planRows.push({
            basicLabel: basicEnabled ? basicLabel : '-',
            proLabel: proLabel,
        });
    }
    const priceId = yield stripe_1.stripePriceIdByUserId(ctx.joplin.models, ctx.joplin.owner.id);
    const currentPrice = joplinCloud_1.findPrice(stripe_1.stripeConfig().prices, { priceId });
    const upgradePrice = joplinCloud_1.findPrice(stripe_1.stripeConfig().prices, {
        accountType: UserModel_1.AccountType.Pro,
        period: currentPrice.period,
    });
    const view = defaultView_1.default('upgrade', 'Upgrade');
    view.content = {
        planRows,
        basicPrice: currentPrice,
        proPrice: upgradePrice,
        postUrl: upgradeUrl(),
        csrfTag: yield csrf_1.createCsrfTag(ctx),
        showYearlyPrices: currentPrice.period === joplinCloud_1.PricePeriod.Yearly,
    };
    view.cssFiles = ['index/upgrade'];
    return view;
}));
router.post('upgrade', (_path, ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const fields = yield requestUtils_1.bodyFields(ctx.req);
    const joplin = ctx.joplin;
    const models = joplin.models;
    if (fields.upgrade_button) {
        yield stripe_1.updateSubscriptionType(models, joplin.owner.id, UserModel_1.AccountType.Pro);
        yield models.user().save({ id: joplin.owner.id, account_type: UserModel_1.AccountType.Pro });
        yield models.notification().add(joplin.owner.id, NotificationModel_1.NotificationKey.UpgradedToPro);
        return routeUtils_1.redirect(ctx, `${config_1.default().baseUrl}/home`);
    }
    throw new errors_1.ErrorBadRequest('Invalid button');
}));
exports.default = router;
//# sourceMappingURL=upgrade.js.map