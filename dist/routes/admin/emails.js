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
const Router_1 = require("../../utils/Router");
const types_1 = require("../../utils/types");
const defaultView_1 = require("../../utils/defaultView");
const table_1 = require("../../utils/views/table");
const pagination_1 = require("../../models/utils/pagination");
const time_1 = require("../../utils/time");
const urlUtils_1 = require("../../utils/urlUtils");
const csrf_1 = require("../../utils/csrf");
const email_1 = require("../../models/utils/email");
const locale_1 = require("@joplin/lib/locale");
const utils_1 = require("../../services/email/utils");
const { substrWithEllipsis } = require('@joplin/lib/string-utils');
const router = new Router_1.default(types_1.RouteType.Web);
router.get('admin/emails', (_path, ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const models = ctx.joplin.models;
    const pagination = table_1.makeTablePagination(ctx.query, 'created_time', pagination_1.PaginationOrderDir.DESC);
    const page = yield models.email().allPaginated(pagination);
    const table = {
        baseUrl: urlUtils_1.adminEmailsUrl(),
        requestQuery: ctx.query,
        pageCount: page.page_count,
        pagination,
        headers: [
            {
                name: 'id',
                label: 'ID',
            },
            {
                name: 'sender_id',
                label: 'From',
            },
            {
                name: 'recipient_name',
                label: 'To',
            },
            {
                name: 'user_id',
                label: 'User',
            },
            {
                name: 'subject',
                label: 'Subject',
            },
            {
                name: 'created_time',
                label: 'Created',
            },
            {
                name: 'sent_time',
                label: 'Sent',
            },
            {
                name: 'error',
                label: 'Error',
            },
        ],
        rows: page.items.map(d => {
            const sender = email_1.senderInfo(d.sender_id);
            const senderName = sender.name || sender.email || `Sender ${d.sender_id.toString()}`;
            let error = '';
            if (d.sent_time && !d.sent_success) {
                error = d.error ? d.error : '(Unspecified error)';
            }
            const row = [
                {
                    value: d.id.toString(),
                },
                {
                    value: senderName,
                    url: sender.email ? `mailto:${escape(sender.email)}` : '',
                },
                {
                    value: d.recipient_name || d.recipient_email,
                    url: `mailto:${escape(d.recipient_email)}`,
                },
                {
                    value: d.recipient_id,
                    url: d.recipient_id ? urlUtils_1.adminUserUrl(d.recipient_id) : '',
                    render: () => {
                        return '<i class="fas fa-user-alt"></i>';
                    },
                },
                {
                    value: substrWithEllipsis(d.subject, 0, 32),
                    url: urlUtils_1.adminEmailUrl(d.id),
                },
                {
                    value: time_1.formatDateTime(d.created_time),
                },
                {
                    value: time_1.formatDateTime(d.sent_time),
                },
                {
                    value: error,
                },
            ];
            return row;
        }),
    };
    const view = Object.assign(Object.assign({}, defaultView_1.default('admin/emails', locale_1._('Emails'))), { content: {
            emailTable: table_1.makeTableView(table),
            csrfTag: yield csrf_1.createCsrfTag(ctx),
        } });
    return view;
}));
router.get('admin/emails/:id', (path, ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const models = ctx.joplin.models;
    const email = yield models.email().load(path.id);
    const view = Object.assign(Object.assign({}, defaultView_1.default('admin/email', locale_1._('Email'))), { content: {
            email,
            emailSentTime: email.sent_time ? time_1.formatDateTime(email.sent_time) : null,
            sender: email_1.senderInfo(email.sender_id),
            bodyHtml: utils_1.markdownBodyToHtml(email.body),
        } });
    return view;
}));
exports.default = router;
//# sourceMappingURL=emails.js.map