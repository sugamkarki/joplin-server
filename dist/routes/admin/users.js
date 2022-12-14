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
exports.checkRepeatPassword = void 0;
const routeUtils_1 = require("../../utils/routeUtils");
const Router_1 = require("../../utils/Router");
const types_1 = require("../../utils/types");
const types_2 = require("../../utils/types");
const requestUtils_1 = require("../../utils/requestUtils");
const errors_1 = require("../../utils/errors");
const types_3 = require("../../services/database/types");
const config_1 = require("../../config");
const defaultView_1 = require("../../utils/defaultView");
const BaseModel_1 = require("../../models/BaseModel");
const UserModel_1 = require("../../models/UserModel");
const uuidgen_1 = require("../../utils/uuidgen");
const strings_1 = require("../../utils/strings");
const user_1 = require("../../models/utils/user");
const select_1 = require("../../utils/views/select");
const urlUtils_1 = require("../../utils/urlUtils");
const stripe_1 = require("../../utils/stripe");
const csrf_1 = require("../../utils/csrf");
const time_1 = require("../../utils/time");
const impersonate_1 = require("./utils/users/impersonate");
const UserFlagModel_1 = require("../../models/UserFlagModel");
const locale_1 = require("@joplin/lib/locale");
function checkRepeatPassword(fields, required) {
    if (fields.password) {
        if (fields.password !== fields.password2)
            throw new errors_1.ErrorUnprocessableEntity('Passwords do not match');
        return fields.password;
    }
    else {
        if (required)
            throw new errors_1.ErrorUnprocessableEntity('Password is required');
    }
    return '';
}
exports.checkRepeatPassword = checkRepeatPassword;
function boolOrDefaultToValue(fields, fieldName) {
    if (fields[fieldName] === '')
        return null;
    const output = Number(fields[fieldName]);
    if (isNaN(output) || (output !== 0 && output !== 1))
        throw new Error(`Invalid value for ${fieldName}`);
    return output;
}
function intOrDefaultToValue(fields, fieldName) {
    if (fields[fieldName] === '')
        return null;
    const output = Number(fields[fieldName]);
    if (isNaN(output))
        throw new Error(`Invalid value for ${fieldName}`);
    return output;
}
function makeUser(isNew, fields) {
    const user = {};
    if ('email' in fields)
        user.email = fields.email;
    if ('full_name' in fields)
        user.full_name = fields.full_name;
    if ('is_admin' in fields)
        user.is_admin = fields.is_admin;
    if ('max_item_size' in fields)
        user.max_item_size = intOrDefaultToValue(fields, 'max_item_size');
    if ('max_total_item_size' in fields)
        user.max_total_item_size = intOrDefaultToValue(fields, 'max_total_item_size');
    if ('can_share_folder' in fields)
        user.can_share_folder = boolOrDefaultToValue(fields, 'can_share_folder');
    if ('can_upload' in fields)
        user.can_upload = intOrDefaultToValue(fields, 'can_upload');
    if ('account_type' in fields)
        user.account_type = Number(fields.account_type);
    const password = checkRepeatPassword(fields, false);
    if (password)
        user.password = password;
    if (!isNew)
        user.id = fields.id;
    if (isNew) {
        user.must_set_password = user.password ? 0 : 1;
        user.password = user.password ? user.password : uuidgen_1.default();
    }
    return user;
}
function defaultUser() {
    return {};
}
function userIsNew(path) {
    return path.id === 'new';
}
function userIsMe(path) {
    return path.id === 'me';
}
const router = new Router_1.default(types_1.RouteType.Web);
router.get('admin/users', (_path, ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const userModel = ctx.joplin.models.user();
    yield userModel.checkIfAllowed(ctx.joplin.owner, BaseModel_1.AclAction.List);
    const users = yield userModel.all();
    users.sort((u1, u2) => {
        if (u1.full_name && u2.full_name)
            return u1.full_name.toLowerCase() < u2.full_name.toLowerCase() ? -1 : +1;
        if (u1.full_name && !u2.full_name)
            return +1;
        if (!u1.full_name && u2.full_name)
            return -1;
        return u1.email.toLowerCase() < u2.email.toLowerCase() ? -1 : +1;
    });
    const view = defaultView_1.default('admin/users', locale_1._('Users'));
    view.content = {
        users: users.map(user => {
            return Object.assign(Object.assign({}, user), { url: urlUtils_1.adminUserUrl(user.id), displayName: user.full_name ? user.full_name : '(not set)', formattedItemMaxSize: strings_1.formatMaxItemSize(user), formattedTotalSize: strings_1.formatTotalSize(user), formattedMaxTotalSize: strings_1.formatMaxTotalSize(user), formattedTotalSizePercent: strings_1.formatTotalSizePercent(user), totalSizeClass: user_1.totalSizeClass(user), formattedAccountType: UserModel_1.accountTypeToString(user.account_type), formattedCanShareFolder: strings_1.yesOrNo(user_1.getCanShareFolder(user)), rowClassName: user.enabled ? '' : 'is-disabled' });
        }),
    };
    return view;
}));
router.get('admin/users/:id', (path, ctx, user = null, error = null) => __awaiter(void 0, void 0, void 0, function* () {
    const owner = ctx.joplin.owner;
    const isMe = userIsMe(path);
    const isNew = userIsNew(path);
    const models = ctx.joplin.models;
    const userId = userIsMe(path) ? owner.id : path.id;
    user = !isNew ? user || (yield models.user().load(userId)) : user;
    if (isNew && !user)
        user = defaultUser();
    yield models.user().checkIfAllowed(ctx.joplin.owner, BaseModel_1.AclAction.Read, user);
    let postUrl = '';
    if (isNew) {
        postUrl = urlUtils_1.adminUserUrl('new');
    }
    else if (isMe) {
        postUrl = urlUtils_1.adminUserUrl('me');
    }
    else {
        postUrl = urlUtils_1.adminUserUrl(user.id);
    }
    const userFlagViews = isNew ? [] : (yield models.userFlag().allByUserId(user.id)).map(f => {
        return Object.assign(Object.assign({}, f), { message: UserFlagModel_1.userFlagToString(f) });
    });
    userFlagViews.sort((a, b) => {
        return a.created_time < b.created_time ? +1 : -1;
    });
    const subscription = !isNew ? yield ctx.joplin.models.subscription().byUserId(userId) : null;
    const isScheduledForDeletion = yield ctx.joplin.models.userDeletion().isScheduledForDeletion(userId);
    const view = defaultView_1.default('admin/user', locale_1._('Profile'));
    view.content.user = user;
    view.content.isNew = isNew;
    view.content.buttonTitle = isNew ? locale_1._('Create user') : locale_1._('Update profile');
    view.content.error = error;
    view.content.postUrl = postUrl;
    view.content.showDisableButton = !isNew && owner.id !== user.id && user.enabled;
    view.content.csrfTag = yield csrf_1.createCsrfTag(ctx);
    if (subscription) {
        const lastPaymentAttempt = models.subscription().lastPaymentAttempt(subscription);
        view.content.subscription = subscription;
        view.content.showManageSubscription = !isNew;
        view.content.showUpdateSubscriptionBasic = !isNew && user.account_type !== UserModel_1.AccountType.Basic;
        view.content.showUpdateSubscriptionPro = !isNew && user.account_type !== UserModel_1.AccountType.Pro;
        view.content.subLastPaymentStatus = lastPaymentAttempt.status;
        view.content.subLastPaymentDate = time_1.formatDateTime(lastPaymentAttempt.time);
    }
    view.content.showImpersonateButton = !isNew && user.enabled && user.id !== owner.id;
    view.content.showRestoreButton = !isNew && !user.enabled;
    view.content.showScheduleDeletionButton = !isNew && !isScheduledForDeletion;
    view.content.showResetPasswordButton = !isNew && user.enabled;
    view.content.canShareFolderOptions = select_1.yesNoDefaultOptions(user, 'can_share_folder');
    view.content.canUploadOptions = select_1.yesNoOptions(user, 'can_upload');
    view.content.hasFlags = !!userFlagViews.length;
    view.content.userFlagViews = userFlagViews;
    view.content.stripePortalUrl = urlUtils_1.stripePortalUrl();
    view.content.pageTitle = view.content.buttonTitle;
    view.jsFiles.push('zxcvbn');
    view.cssFiles.push('index/user');
    if (config_1.default().accountTypesEnabled) {
        view.content.showAccountTypes = true;
        view.content.accountTypes = UserModel_1.accountTypeOptions().map((o) => {
            o.selected = user.account_type === o.value;
            return o;
        });
    }
    return view;
}));
router.alias(types_2.HttpMethod.POST, 'admin/users/:id', 'admin/users');
router.post('admin/users', (path, ctx) => __awaiter(void 0, void 0, void 0, function* () {
    let user = {};
    const owner = ctx.joplin.owner;
    let userId = userIsMe(path) ? owner.id : path.id;
    try {
        const body = yield requestUtils_1.formParse(ctx.req);
        const fields = body.fields;
        const isNew = userIsNew(path);
        if (userIsMe(path))
            fields.id = userId;
        user = makeUser(isNew, fields);
        const models = ctx.joplin.models;
        if (fields.post_button) {
            const userToSave = models.user().fromApiInput(user);
            yield models.user().checkIfAllowed(owner, isNew ? BaseModel_1.AclAction.Create : BaseModel_1.AclAction.Update, userToSave);
            if (isNew) {
                const savedUser = yield models.user().save(userToSave);
                userId = savedUser.id;
            }
            else {
                yield models.user().save(userToSave, { isNew: false });
                // When changing the password, we also clear all session IDs for
                // that user, except the current one (otherwise they would be
                // logged out).
                if (userToSave.password)
                    yield models.session().deleteByUserId(userToSave.id, requestUtils_1.contextSessionId(ctx));
            }
        }
        else if (fields.stop_impersonate_button) {
            yield impersonate_1.stopImpersonating(ctx);
            return routeUtils_1.redirect(ctx, config_1.default().baseUrl);
        }
        else if (fields.disable_button || fields.restore_button) {
            const user = yield models.user().load(path.id);
            yield models.user().checkIfAllowed(owner, BaseModel_1.AclAction.Delete, user);
            yield models.userFlag().toggle(user.id, types_3.UserFlagType.ManuallyDisabled, !fields.restore_button);
        }
        else if (fields.send_account_confirmation_email) {
            const user = yield models.user().load(path.id);
            yield models.user().save({ id: user.id, must_set_password: 1 });
            yield models.user().sendAccountConfirmationEmail(user);
        }
        else if (fields.impersonate_button) {
            yield impersonate_1.startImpersonating(ctx, userId);
            return routeUtils_1.redirect(ctx, config_1.default().baseUrl);
        }
        else if (fields.cancel_subscription_button) {
            yield stripe_1.cancelSubscriptionByUserId(models, userId);
        }
        else if (fields.update_subscription_basic_button) {
            yield stripe_1.updateSubscriptionType(models, userId, UserModel_1.AccountType.Basic);
        }
        else if (fields.update_subscription_pro_button) {
            yield stripe_1.updateSubscriptionType(models, userId, UserModel_1.AccountType.Pro);
        }
        else if (fields.schedule_deletion_button) {
            const deletionDate = Date.now() + 24 * time_1.Hour;
            yield models.userDeletion().add(userId, deletionDate, {
                processAccount: true,
                processData: true,
            });
            yield models.notification().addInfo(owner.id, `User ${user.email} has been scheduled for deletion on ${time_1.formatDateTime(deletionDate)}. [View deletion list](${urlUtils_1.adminUserDeletionsUrl()})`);
        }
        else if (fields.delete_user_flags) {
            const userFlagTypes = [];
            for (const key of Object.keys(fields)) {
                if (key.startsWith('user_flag_')) {
                    const type = Number(key.substr(10));
                    userFlagTypes.push(type);
                }
            }
            yield models.userFlag().removeMulti(userId, userFlagTypes);
        }
        else {
            throw new Error('Invalid form button');
        }
        return routeUtils_1.redirect(ctx, urlUtils_1.adminUserUrl(userIsMe(path) ? '/me' : `/${userId}`));
    }
    catch (error) {
        error.message = `Error: Your changes were not saved: ${error.message}`;
        if (error instanceof errors_1.ErrorForbidden)
            throw error;
        const endPoint = router.findEndPoint(types_2.HttpMethod.GET, 'admin/users/:id');
        return endPoint.handler(path, ctx, user, error);
    }
}));
exports.default = router;
//# sourceMappingURL=users.js.map