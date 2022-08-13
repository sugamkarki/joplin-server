"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TaskService_1 = require("../services/TaskService");
function default_1(env, models, config, services) {
    const taskService = new TaskService_1.default(env, models, config, services);
    let tasks = [
        {
            id: TaskService_1.TaskId.DeleteExpiredTokens,
            description: TaskService_1.taskIdToLabel(TaskService_1.TaskId.DeleteExpiredTokens),
            schedule: '0 */6 * * *',
            run: (models) => models.token().deleteExpiredTokens(),
        },
        {
            id: TaskService_1.TaskId.UpdateTotalSizes,
            description: TaskService_1.taskIdToLabel(TaskService_1.TaskId.UpdateTotalSizes),
            schedule: '0 * * * *',
            run: (models) => models.item().updateTotalSizes(),
        },
        {
            id: TaskService_1.TaskId.CompressOldChanges,
            description: TaskService_1.taskIdToLabel(TaskService_1.TaskId.CompressOldChanges),
            schedule: '0 0 */2 * *',
            run: (models) => models.change().compressOldChanges(),
        },
        {
            id: TaskService_1.TaskId.ProcessUserDeletions,
            description: TaskService_1.taskIdToLabel(TaskService_1.TaskId.ProcessUserDeletions),
            schedule: '10 * * * *',
            run: (_models, services) => services.userDeletion.runMaintenance(),
        },
        // Need to do it relatively frequently so that if the user fixes
        // whatever was causing the oversized account, they can get it
        // re-enabled quickly. Also it's done on minute 30 because it depends on
        // the UpdateTotalSizes task being run.
        {
            id: TaskService_1.TaskId.HandleOversizedAccounts,
            description: TaskService_1.taskIdToLabel(TaskService_1.TaskId.HandleOversizedAccounts),
            schedule: '30 */2 * * *',
            run: (models) => models.user().handleOversizedAccounts(),
        },
        {
            id: TaskService_1.TaskId.DeleteExpiredSessions,
            description: TaskService_1.taskIdToLabel(TaskService_1.TaskId.DeleteExpiredSessions),
            schedule: '0 */6 * * *',
            run: (models) => models.session().deleteExpiredSessions(),
        },
    ];
    if (config.USER_DATA_AUTO_DELETE_ENABLED) {
        tasks.push({
            id: TaskService_1.TaskId.AutoAddDisabledAccountsForDeletion,
            description: TaskService_1.taskIdToLabel(TaskService_1.TaskId.AutoAddDisabledAccountsForDeletion),
            schedule: '0 14 * * *',
            run: (_models, services) => services.userDeletion.autoAddForDeletion(),
        });
    }
    if (config.isJoplinCloud) {
        tasks = tasks.concat([
            {
                id: TaskService_1.TaskId.HandleBetaUserEmails,
                description: TaskService_1.taskIdToLabel(TaskService_1.TaskId.HandleBetaUserEmails),
                schedule: '0 12 * * *',
                run: (models) => models.user().handleBetaUserEmails(),
            },
            {
                id: TaskService_1.TaskId.HandleFailedPaymentSubscriptions,
                description: TaskService_1.taskIdToLabel(TaskService_1.TaskId.HandleFailedPaymentSubscriptions),
                schedule: '0 13 * * *',
                run: (models) => models.user().handleFailedPaymentSubscriptions(),
            },
        ]);
    }
    taskService.registerTasks(tasks);
    return taskService;
}
exports.default = default_1;
//# sourceMappingURL=setupTaskService.js.map