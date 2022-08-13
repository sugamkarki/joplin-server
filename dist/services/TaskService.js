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
exports.taskIdToLabel = exports.RunType = exports.TaskId = void 0;
const Logger_1 = require("@joplin/lib/Logger");
const BaseService_1 = require("./BaseService");
const types_1 = require("./database/types");
const locale_1 = require("@joplin/lib/locale");
const cron = require('node-cron');
const logger = Logger_1.default.create('TaskService');
var TaskId;
(function (TaskId) {
    TaskId[TaskId["DeleteExpiredTokens"] = 1] = "DeleteExpiredTokens";
    TaskId[TaskId["UpdateTotalSizes"] = 2] = "UpdateTotalSizes";
    TaskId[TaskId["HandleOversizedAccounts"] = 3] = "HandleOversizedAccounts";
    TaskId[TaskId["HandleBetaUserEmails"] = 4] = "HandleBetaUserEmails";
    TaskId[TaskId["HandleFailedPaymentSubscriptions"] = 5] = "HandleFailedPaymentSubscriptions";
    TaskId[TaskId["DeleteExpiredSessions"] = 6] = "DeleteExpiredSessions";
    TaskId[TaskId["CompressOldChanges"] = 7] = "CompressOldChanges";
    TaskId[TaskId["ProcessUserDeletions"] = 8] = "ProcessUserDeletions";
    TaskId[TaskId["AutoAddDisabledAccountsForDeletion"] = 9] = "AutoAddDisabledAccountsForDeletion";
})(TaskId = exports.TaskId || (exports.TaskId = {}));
var RunType;
(function (RunType) {
    RunType[RunType["Scheduled"] = 1] = "Scheduled";
    RunType[RunType["Manual"] = 2] = "Manual";
})(RunType = exports.RunType || (exports.RunType = {}));
const taskIdToLabel = (taskId) => {
    const strings = {
        [TaskId.DeleteExpiredTokens]: locale_1._('Delete expired tokens'),
        [TaskId.UpdateTotalSizes]: locale_1._('Update total sizes'),
        [TaskId.HandleOversizedAccounts]: locale_1._('Process oversized accounts'),
        [TaskId.HandleBetaUserEmails]: 'Process beta user emails',
        [TaskId.HandleFailedPaymentSubscriptions]: locale_1._('Process failed payment subscriptions'),
        [TaskId.DeleteExpiredSessions]: locale_1._('Delete expired sessions'),
        [TaskId.CompressOldChanges]: locale_1._('Compress old changes'),
        [TaskId.ProcessUserDeletions]: locale_1._('Process user deletions'),
        [TaskId.AutoAddDisabledAccountsForDeletion]: locale_1._('Auto-add disabled accounts for deletion'),
    };
    const s = strings[taskId];
    if (!s)
        throw new Error(`No such task: ${taskId}`);
    return s;
};
exports.taskIdToLabel = taskIdToLabel;
const runTypeToString = (runType) => {
    if (runType === RunType.Scheduled)
        return 'scheduled';
    if (runType === RunType.Manual)
        return 'manual';
    throw new Error(`Unknown run type: ${runType}`);
};
const defaultTaskState = {
    running: false,
};
class TaskService extends BaseService_1.default {
    constructor(env, models, config, services) {
        super(env, models, config);
        this.tasks_ = {};
        this.taskStates_ = {};
        this.services_ = services;
    }
    registerTask(task) {
        if (this.tasks_[task.id])
            throw new Error(`Already a task with this ID: ${task.id}`);
        this.tasks_[task.id] = task;
        this.taskStates_[task.id] = Object.assign({}, defaultTaskState);
    }
    registerTasks(tasks) {
        for (const task of tasks)
            this.registerTask(task);
    }
    get tasks() {
        return this.tasks_;
    }
    taskState(id) {
        if (!this.taskStates_[id])
            throw new Error(`No such task: ${id}`);
        return this.taskStates_[id];
    }
    taskLastEvents(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                taskStarted: yield this.models.event().lastEventByTypeAndName(types_1.EventType.TaskStarted, id.toString()),
                taskCompleted: yield this.models.event().lastEventByTypeAndName(types_1.EventType.TaskCompleted, id.toString()),
            };
        });
    }
    taskById(id) {
        if (!this.tasks_[id])
            throw new Error(`No such task: ${id}`);
        return this.tasks_[id];
    }
    taskDisplayString(id) {
        const task = this.taskById(id);
        return `#${task.id} (${task.description})`;
    }
    runTask(id, runType) {
        return __awaiter(this, void 0, void 0, function* () {
            const displayString = this.taskDisplayString(id);
            const state = this.taskState(id);
            if (state.running)
                throw new Error(`Already running: ${displayString}`);
            const startTime = Date.now();
            this.taskStates_[id] = Object.assign(Object.assign({}, this.taskStates_[id]), { running: true });
            yield this.models.event().create(types_1.EventType.TaskStarted, id.toString());
            try {
                logger.info(`Running ${displayString} (${runTypeToString(runType)})...`);
                yield this.tasks_[id].run(this.models, this.services_);
            }
            catch (error) {
                logger.error(`On ${displayString}`, error);
            }
            this.taskStates_[id] = Object.assign(Object.assign({}, this.taskStates_[id]), { running: false });
            yield this.models.event().create(types_1.EventType.TaskCompleted, id.toString());
            logger.info(`Completed ${this.taskDisplayString(id)} in ${Date.now() - startTime}ms`);
        });
    }
    runInBackground() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const [taskId, task] of Object.entries(this.tasks_)) {
                if (!task.schedule)
                    continue;
                logger.info(`Scheduling ${this.taskDisplayString(task.id)}: ${task.schedule}`);
                cron.schedule(task.schedule, () => __awaiter(this, void 0, void 0, function* () {
                    yield this.runTask(Number(taskId), RunType.Scheduled);
                }));
            }
        });
    }
}
exports.default = TaskService;
//# sourceMappingURL=TaskService.js.map