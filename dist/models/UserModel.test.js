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
const testUtils_1 = require("../utils/testing/testUtils");
const types_1 = require("../services/database/types");
const errors_1 = require("../utils/errors");
const stripe_1 = require("../utils/stripe");
const UserModel_1 = require("./UserModel");
const SubscriptionModel_1 = require("./SubscriptionModel");
const urlUtils_1 = require("../utils/urlUtils");
describe('UserModel', function () {
    beforeAll(() => __awaiter(this, void 0, void 0, function* () {
        yield testUtils_1.beforeAllDb('UserModel');
    }));
    afterAll(() => __awaiter(this, void 0, void 0, function* () {
        yield testUtils_1.afterAllTests();
    }));
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield testUtils_1.beforeEachDb();
    }));
    test('should validate user objects', () => __awaiter(this, void 0, void 0, function* () {
        const { user: user1 } = yield testUtils_1.createUserAndSession(2, false);
        const { user: user2 } = yield testUtils_1.createUserAndSession(3, false);
        let error = null;
        // Email must be set
        error = yield testUtils_1.checkThrowAsync(() => __awaiter(this, void 0, void 0, function* () { return yield testUtils_1.models().user().save({ email: '', password: '1234546' }); }));
        expect(error instanceof errors_1.ErrorUnprocessableEntity).toBe(true);
        // Password must be set
        error = yield testUtils_1.checkThrowAsync(() => __awaiter(this, void 0, void 0, function* () { return yield testUtils_1.models().user().save({ email: 'newone@example.com', password: '' }); }));
        expect(error instanceof errors_1.ErrorUnprocessableEntity).toBe(true);
        // email must be set
        error = yield testUtils_1.checkThrowAsync(() => __awaiter(this, void 0, void 0, function* () { return yield testUtils_1.models().user().save({ id: user1.id, email: '' }); }));
        expect(error instanceof errors_1.ErrorUnprocessableEntity).toBe(true);
        // password must be set
        error = yield testUtils_1.checkThrowAsync(() => __awaiter(this, void 0, void 0, function* () { return yield testUtils_1.models().user().save({ id: user1.id, password: '' }); }));
        expect(error instanceof errors_1.ErrorUnprocessableEntity).toBe(true);
        // there is already a user with this email
        error = yield testUtils_1.checkThrowAsync(() => __awaiter(this, void 0, void 0, function* () { return yield testUtils_1.models().user().save({ id: user1.id, email: user2.email }); }));
        expect(error instanceof errors_1.ErrorUnprocessableEntity).toBe(true);
        // check that the email is valid
        error = yield testUtils_1.checkThrowAsync(() => __awaiter(this, void 0, void 0, function* () { return yield testUtils_1.models().user().save({ id: user1.id, email: 'ohno' }); }));
        expect(error instanceof errors_1.ErrorUnprocessableEntity).toBe(true);
    }));
    // test('should delete a user', async () => {
    // 	const { session: session1, user: user1 } = await createUserAndSession(2, false);
    // 	const userModel = models().user();
    // 	const allUsers: User[] = await userModel.all();
    // 	const beforeCount: number = allUsers.length;
    // 	await createItem(session1.id, 'root:/test.txt:', 'testing');
    // 	// Admin can delete any user
    // 	expect(!!(await models().session().load(session1.id))).toBe(true);
    // 	expect((await models().item().all()).length).toBe(1);
    // 	expect((await models().userItem().all()).length).toBe(1);
    // 	await models().user().delete(user1.id);
    // 	expect((await userModel.all()).length).toBe(beforeCount - 1);
    // 	expect(!!(await models().session().load(session1.id))).toBe(false);
    // 	expect((await models().item().all()).length).toBe(0);
    // 	expect((await models().userItem().all()).length).toBe(0);
    // });
    test('should push an email when creating a new user', () => __awaiter(this, void 0, void 0, function* () {
        const { user: user1 } = yield testUtils_1.createUserAndSession(1);
        const { user: user2 } = yield testUtils_1.createUserAndSession(2);
        const emails = yield testUtils_1.models().email().all();
        expect(emails.length).toBe(2);
        expect(emails.find(e => e.recipient_email === user1.email)).toBeTruthy();
        expect(emails.find(e => e.recipient_email === user2.email)).toBeTruthy();
        const email = emails[0];
        expect(email.subject.trim()).toBeTruthy();
        expect(email.body.includes('/confirm?token=')).toBeTruthy();
        expect(email.sender_id).toBe(types_1.EmailSender.NoReply);
        expect(email.sent_success).toBe(0);
        expect(email.sent_time).toBe(0);
        expect(email.error).toBe('');
    }));
    test('should send a beta reminder email', () => __awaiter(this, void 0, void 0, function* () {
        stripe_1.stripeConfig().enabled = true;
        const { user: user1 } = yield testUtils_1.createUserAndSession(1, false, { email: 'toto@example.com' });
        const range = stripe_1.betaUserDateRange();
        yield testUtils_1.models().user().save({
            id: user1.id,
            created_time: range[0],
            account_type: UserModel_1.AccountType.Pro,
        });
        Date.now = jest.fn(() => range[0] + 6912000 * 1000); // 80 days later
        yield testUtils_1.models().user().handleBetaUserEmails();
        expect((yield testUtils_1.models().email().all()).length).toBe(2);
        {
            const email = (yield testUtils_1.models().email().all()).pop();
            expect(email.recipient_email).toBe('toto@example.com');
            expect(email.subject.indexOf('10 days') > 0).toBe(true);
            expect(email.body.indexOf('10 days') > 0).toBe(true);
            expect(email.body.indexOf('toto%40example.com') > 0).toBe(true);
            expect(email.body.indexOf('account_type=2') > 0).toBe(true);
        }
        yield testUtils_1.models().user().handleBetaUserEmails();
        // It should not send a second email
        expect((yield testUtils_1.models().email().all()).length).toBe(2);
        Date.now = jest.fn(() => range[0] + 7603200 * 1000); // 88 days later
        yield testUtils_1.models().user().handleBetaUserEmails();
        expect((yield testUtils_1.models().email().all()).length).toBe(3);
        {
            const email = (yield testUtils_1.models().email().all()).pop();
            expect(email.subject.indexOf('2 days') > 0).toBe(true);
            expect(email.body.indexOf('2 days') > 0).toBe(true);
        }
        yield testUtils_1.models().user().handleBetaUserEmails();
        expect((yield testUtils_1.models().email().all()).length).toBe(3);
        stripe_1.stripeConfig().enabled = false;
    }));
    test('should disable beta account once expired', () => __awaiter(this, void 0, void 0, function* () {
        stripe_1.stripeConfig().enabled = true;
        const { user: user1 } = yield testUtils_1.createUserAndSession(1, false, { email: 'toto@example.com' });
        const range = stripe_1.betaUserDateRange();
        yield testUtils_1.models().user().save({
            id: user1.id,
            created_time: range[0],
            account_type: UserModel_1.AccountType.Pro,
        });
        Date.now = jest.fn(() => range[0] + 8640000 * 1000); // 100 days later
        yield testUtils_1.models().user().handleBetaUserEmails();
        expect((yield testUtils_1.models().email().all()).length).toBe(4);
        const email = (yield testUtils_1.models().email().all()).pop();
        expect(email.subject.indexOf('beta account is expired') > 0).toBe(true);
        const reloadedUser = yield testUtils_1.models().user().load(user1.id);
        expect(reloadedUser.can_upload).toBe(0);
        const userFlag = yield testUtils_1.models().userFlag().byUserId(user1.id, types_1.UserFlagType.AccountWithoutSubscription);
        expect(userFlag).toBeTruthy();
        stripe_1.stripeConfig().enabled = false;
    }));
    test('should disable upload and send an email if payment failed recently', () => __awaiter(this, void 0, void 0, function* () {
        stripe_1.stripeConfig().enabled = true;
        const { user: user1 } = yield testUtils_1.models().subscription().saveUserAndSubscription('toto@example.com', 'Toto', UserModel_1.AccountType.Basic, 'usr_111', 'sub_111');
        yield testUtils_1.models().subscription().saveUserAndSubscription('tutu@example.com', 'Tutu', UserModel_1.AccountType.Basic, 'usr_222', 'sub_222');
        const sub = yield testUtils_1.models().subscription().byUserId(user1.id);
        const now = Date.now();
        const paymentFailedTime = now - SubscriptionModel_1.failedPaymentWarningInterval - 10;
        yield testUtils_1.models().subscription().save({
            id: sub.id,
            last_payment_time: now - SubscriptionModel_1.failedPaymentWarningInterval * 2,
            last_payment_failed_time: paymentFailedTime,
        });
        yield testUtils_1.models().user().handleFailedPaymentSubscriptions();
        {
            const user1 = yield testUtils_1.models().user().loadByEmail('toto@example.com');
            expect(user1.can_upload).toBe(0);
            const email = (yield testUtils_1.models().email().all()).pop();
            expect(email.key).toBe(`payment_failed_upload_disabled_${paymentFailedTime}`);
            expect(email.body).toContain(urlUtils_1.stripePortalUrl());
            expect(email.body).toContain('14 days');
        }
        const beforeEmailCount = (yield testUtils_1.models().email().all()).length;
        yield testUtils_1.models().user().handleFailedPaymentSubscriptions();
        const afterEmailCount = (yield testUtils_1.models().email().all()).length;
        expect(beforeEmailCount).toBe(afterEmailCount);
        {
            const user2 = yield testUtils_1.models().user().loadByEmail('tutu@example.com');
            expect(user2.can_upload).toBe(1);
        }
        stripe_1.stripeConfig().enabled = false;
    }));
    test('should disable disable the account and send an email if payment failed for good', () => __awaiter(this, void 0, void 0, function* () {
        stripe_1.stripeConfig().enabled = true;
        const { user: user1 } = yield testUtils_1.models().subscription().saveUserAndSubscription('toto@example.com', 'Toto', UserModel_1.AccountType.Basic, 'usr_111', 'sub_111');
        const sub = yield testUtils_1.models().subscription().byUserId(user1.id);
        const now = Date.now();
        const paymentFailedTime = now - SubscriptionModel_1.failedPaymentFinalAccount - 10;
        yield testUtils_1.models().subscription().save({
            id: sub.id,
            last_payment_time: now - SubscriptionModel_1.failedPaymentFinalAccount * 2,
            last_payment_failed_time: paymentFailedTime,
        });
        yield testUtils_1.models().user().handleFailedPaymentSubscriptions();
        {
            const user1 = yield testUtils_1.models().user().loadByEmail('toto@example.com');
            expect(user1.enabled).toBe(0);
            const email = (yield testUtils_1.models().email().all()).pop();
            expect(email.key).toBe(`payment_failed_account_disabled_${paymentFailedTime}`);
            expect(email.body).toContain(urlUtils_1.stripePortalUrl());
        }
        stripe_1.stripeConfig().enabled = false;
    }));
    test('should disable disable the account and send an email if payment failed for good', () => __awaiter(this, void 0, void 0, function* () {
        stripe_1.stripeConfig().enabled = true;
        const { user: user1 } = yield testUtils_1.models().subscription().saveUserAndSubscription('toto@example.com', 'Toto', UserModel_1.AccountType.Basic, 'usr_111', 'sub_111');
        const sub = yield testUtils_1.models().subscription().byUserId(user1.id);
        const now = Date.now();
        const paymentFailedTime = now - SubscriptionModel_1.failedPaymentFinalAccount - 10;
        yield testUtils_1.models().subscription().save({
            id: sub.id,
            last_payment_time: now - SubscriptionModel_1.failedPaymentFinalAccount * 2,
            last_payment_failed_time: paymentFailedTime,
        });
        yield testUtils_1.models().user().handleFailedPaymentSubscriptions();
        {
            const user1 = yield testUtils_1.models().user().loadByEmail('toto@example.com');
            expect(user1.enabled).toBe(0);
            const email = (yield testUtils_1.models().email().all()).pop();
            expect(email.key).toBe(`payment_failed_account_disabled_${paymentFailedTime}`);
            expect(email.body).toContain(urlUtils_1.stripePortalUrl());
        }
        stripe_1.stripeConfig().enabled = false;
    }));
    test('should send emails and flag accounts when it is over the size limit', () => __awaiter(this, void 0, void 0, function* () {
        const { user: user1 } = yield testUtils_1.createUserAndSession(1);
        const { user: user2 } = yield testUtils_1.createUserAndSession(2);
        yield testUtils_1.models().user().save({
            id: user1.id,
            account_type: UserModel_1.AccountType.Basic,
            total_item_size: Math.round(UserModel_1.accountByType(UserModel_1.AccountType.Basic).max_total_item_size * 0.85),
        });
        yield testUtils_1.models().user().save({
            id: user2.id,
            account_type: UserModel_1.AccountType.Pro,
            total_item_size: Math.round(UserModel_1.accountByType(UserModel_1.AccountType.Pro).max_total_item_size * 0.2),
        });
        const emailBeforeCount = (yield testUtils_1.models().email().all()).length;
        yield testUtils_1.models().user().handleOversizedAccounts();
        const emailAfterCount = (yield testUtils_1.models().email().all()).length;
        expect(emailAfterCount).toBe(emailBeforeCount + 1);
        const email = (yield testUtils_1.models().email().all()).pop();
        expect(email.recipient_id).toBe(user1.id);
        expect(email.subject).toContain('80%');
        {
            // Running it again should not send a second email
            yield testUtils_1.models().user().handleOversizedAccounts();
            expect((yield testUtils_1.models().email().all()).length).toBe(emailBeforeCount + 1);
        }
        {
            // Now check that the 100% email is sent too
            yield testUtils_1.models().user().save({
                id: user2.id,
                total_item_size: Math.round(UserModel_1.accountByType(UserModel_1.AccountType.Pro).max_total_item_size * 1.1),
            });
            // User upload should be enabled at this point
            expect((yield testUtils_1.models().user().load(user2.id)).can_upload).toBe(1);
            const emailBeforeCount = (yield testUtils_1.models().email().all()).length;
            yield testUtils_1.models().user().handleOversizedAccounts();
            const emailAfterCount = (yield testUtils_1.models().email().all()).length;
            // User upload should be disabled
            expect((yield testUtils_1.models().user().load(user2.id)).can_upload).toBe(0);
            expect(yield testUtils_1.models().userFlag().byUserId(user2.id, types_1.UserFlagType.AccountOverLimit)).toBeTruthy();
            expect(emailAfterCount).toBe(emailBeforeCount + 1);
            const email = (yield testUtils_1.models().email().all()).pop();
            expect(email.recipient_id).toBe(user2.id);
            expect(email.subject).toContain('100%');
            // Running it again should not send a second email
            yield testUtils_1.models().user().handleOversizedAccounts();
            expect((yield testUtils_1.models().email().all()).length).toBe(emailBeforeCount + 1);
        }
    }));
    test('should get the user public key', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const { user: user1 } = yield testUtils_1.createUserAndSession(1);
            const { user: user2 } = yield testUtils_1.createUserAndSession(2);
            const { user: user3 } = yield testUtils_1.createUserAndSession(3);
            const { user: user4 } = yield testUtils_1.createUserAndSession(4);
            const syncInfo1 = {
                'version': 3,
                'e2ee': {
                    'value': false,
                    'updatedTime': 0,
                },
                'ppk': {
                    'value': {
                        publicKey: 'PUBLIC_KEY_1',
                        privateKey: {
                            encryptionMode: 4,
                            ciphertext: 'PRIVATE_KEY',
                        },
                    },
                    'updatedTime': 0,
                },
            };
            const syncInfo2 = JSON.parse(JSON.stringify(syncInfo1));
            syncInfo2.ppk.value.publicKey = 'PUBLIC_KEY_2';
            const syncInfo3 = JSON.parse(JSON.stringify(syncInfo1));
            delete syncInfo3.ppk;
            yield testUtils_1.models().item().saveFromRawContent(user1, {
                body: Buffer.from(JSON.stringify(syncInfo1)),
                name: 'info.json',
            });
            yield testUtils_1.models().item().saveFromRawContent(user2, {
                body: Buffer.from(JSON.stringify(syncInfo2)),
                name: 'info.json',
            });
            yield testUtils_1.models().item().saveFromRawContent(user3, {
                body: Buffer.from(JSON.stringify(syncInfo3)),
                name: 'info.json',
            });
            expect((yield testUtils_1.models().user().publicPrivateKey(user1.id)).publicKey).toBe('PUBLIC_KEY_1');
            expect((yield testUtils_1.models().user().publicPrivateKey(user2.id)).publicKey).toBe('PUBLIC_KEY_2');
            expect((yield testUtils_1.models().user().publicPrivateKey(user3.id))).toBeFalsy();
            yield testUtils_1.expectThrow(() => __awaiter(this, void 0, void 0, function* () { return testUtils_1.models().user().publicPrivateKey(user4.id); }));
        });
    });
    test('should remove flag when account goes under the limit', () => __awaiter(this, void 0, void 0, function* () {
        const { user: user1 } = yield testUtils_1.createUserAndSession(1);
        yield testUtils_1.models().user().save({
            id: user1.id,
            account_type: UserModel_1.AccountType.Basic,
            total_item_size: Math.round(UserModel_1.accountByType(UserModel_1.AccountType.Basic).max_total_item_size * 1.1),
        });
        yield testUtils_1.models().user().handleOversizedAccounts();
        expect(yield testUtils_1.models().userFlag().byUserId(user1.id, types_1.UserFlagType.AccountOverLimit)).toBeTruthy();
        yield testUtils_1.models().user().save({
            id: user1.id,
            total_item_size: Math.round(UserModel_1.accountByType(UserModel_1.AccountType.Basic).max_total_item_size * 0.5),
        });
        yield testUtils_1.models().user().handleOversizedAccounts();
        expect(yield testUtils_1.models().userFlag().byUserId(user1.id, types_1.UserFlagType.AccountOverLimit)).toBeFalsy();
    }));
});
//# sourceMappingURL=UserModel.test.js.map