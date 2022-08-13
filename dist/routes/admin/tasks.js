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
const requestUtils_1 = require("../../utils/requestUtils");
const errors_1 = require("../../utils/errors");
const defaultView_1 = require("../../utils/defaultView");
const table_1 = require("../../utils/views/table");
const strings_1 = require("../../utils/strings");
const time_1 = require("../../utils/time");
const csrf_1 = require("../../utils/csrf");
const TaskService_1 = require("../../services/TaskService");
const NotificationModel_1 = require("../../models/NotificationModel");
const types_2 = require("../../services/database/types");
const prettyCron = require('prettycron');
const router = new Router_1.default(types_1.RouteType.Web);
router.post('admin/tasks', (_path, ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const user = ctx.joplin.owner;
    if (!user.is_admin)
        throw new errors_1.ErrorForbidden();
    const taskService = ctx.joplin.services.tasks;
    const fields = yield requestUtils_1.bodyFields(ctx.req);
    if (fields.startTaskButton) {
        const errors = [];
        for (const k of Object.keys(fields)) {
            if (k.startsWith('checkbox_')) {
                const taskId = Number(k.substr(9));
                try {
                    void taskService.runTask(taskId, TaskService_1.RunType.Manual);
                }
                catch (error) {
                    errors.push(error);
                }
            }
        }
        if (errors.length) {
            yield ctx.joplin.models.notification().add(user.id, NotificationModel_1.NotificationKey.Any, types_2.NotificationLevel.Error, `Some tasks could not be started: ${errors.join('. ')}`);
        }
    }
    else {
        throw new errors_1.ErrorBadRequest('Invalid action');
    }
    return routeUtils_1.redirect(ctx, routeUtils_1.makeUrl(routeUtils_1.UrlType.Tasks));
}));
router.get('admin/tasks', (_path, ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const user = ctx.joplin.owner;
    if (!user.is_admin)
        throw new errors_1.ErrorForbidden();
    const taskService = ctx.joplin.services.tasks;
    const taskRows = [];
    for (const [taskIdString, task] of Object.entries(taskService.tasks)) {
        const taskId = Number(taskIdString);
        const state = taskService.taskState(taskId);
        const events = yield taskService.taskLastEvents(taskId);
        taskRows.push([
            {
                value: `checkbox_${taskId}`,
                checkbox: true,
            },
            {
                value: taskId.toString(),
            },
            {
                value: task.description,
            },
            {
                value: task.schedule,
                hint: prettyCron.toString(task.schedule),
            },
            {
                value: strings_1.yesOrNo(state.running),
            },
            {
                value: events.taskStarted ? time_1.formatDateTime(events.taskStarted.created_time) : '-',
            },
            {
                value: events.taskCompleted ? time_1.formatDateTime(events.taskCompleted.created_time) : '-',
            },
        ]);
    }
    const table = {
        headers: [
            {
                name: 'select',
                label: '',
            },
            {
                name: 'id',
                label: 'ID',
            },
            {
                name: 'description',
                label: 'Description',
            },
            {
                name: 'schedule',
                label: 'Schedule',
            },
            {
                name: 'running',
                label: 'Running',
            },
            {
                name: 'lastRunTime',
                label: 'Last Run',
            },
            {
                name: 'lastCompletionTime',
                label: 'Last Completion',
            },
        ],
        rows: taskRows,
    };
    return Object.assign(Object.assign({}, defaultView_1.default('admin/tasks', 'Tasks')), { content: {
            itemTable: table_1.makeTableView(table),
            postUrl: routeUtils_1.makeUrl(routeUtils_1.UrlType.Tasks),
            csrfTag: yield csrf_1.createCsrfTag(ctx),
        } });
}));
exports.default = router;
//# sourceMappingURL=tasks.js.map