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
const config_1 = require("../config");
const testUtils_1 = require("../utils/testing/testUtils");
const types_1 = require("../utils/types");
const TaskService_1 = require("./TaskService");
const newService = () => {
    return new TaskService_1.default(types_1.Env.Dev, testUtils_1.models(), config_1.default(), {
        share: null,
        email: null,
        mustache: null,
        tasks: null,
        userDeletion: null,
    });
};
describe('TaskService', function () {
    beforeAll(() => __awaiter(this, void 0, void 0, function* () {
        yield testUtils_1.beforeAllDb('TaskService');
    }));
    afterAll(() => __awaiter(this, void 0, void 0, function* () {
        yield testUtils_1.afterAllTests();
    }));
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield testUtils_1.beforeEachDb();
    }));
    test('should register a task', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const service = newService();
            const task = {
                id: 123456,
                description: '',
                run: (_models) => { },
                schedule: '',
            };
            service.registerTask(task);
            expect(service.tasks[123456]).toBeTruthy();
            yield testUtils_1.expectThrow(() => __awaiter(this, void 0, void 0, function* () { return service.registerTask(task); }));
        });
    });
    test('should run a task', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const service = newService();
            let finishTask = false;
            let taskHasRan = false;
            const taskId = 123456;
            const task = {
                id: taskId,
                description: '',
                run: (_models) => __awaiter(this, void 0, void 0, function* () {
                    const iid = setInterval(() => {
                        if (finishTask) {
                            clearInterval(iid);
                            taskHasRan = true;
                        }
                    }, 1);
                }),
                schedule: '',
            };
            service.registerTask(task);
            expect(service.taskState(taskId).running).toBe(false);
            const startTime = new Date();
            void service.runTask(taskId, TaskService_1.RunType.Manual);
            expect(service.taskState(taskId).running).toBe(true);
            while (!taskHasRan) {
                yield testUtils_1.msleep(1);
                finishTask = true;
            }
            expect(service.taskState(taskId).running).toBe(false);
            const events = yield service.taskLastEvents(taskId);
            expect(events.taskStarted.created_time).toBeGreaterThanOrEqual(startTime.getTime());
            expect(events.taskCompleted.created_time).toBeGreaterThan(startTime.getTime());
        });
    });
});
//# sourceMappingURL=TaskService.test.js.map