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
const fs_extra_1 = require("fs-extra");
const testUtils_1 = require("../../../utils/testing/testUtils");
const types_1 = require("../../../utils/types");
const testUtils_2 = require("./testUtils");
const fsDriverPath_ = testUtils_1.tempDirPath();
const newConfig = () => {
    return {
        type: types_1.StorageDriverType.Memory,
    };
};
describe('StorageDriverMemory', function () {
    beforeAll(() => __awaiter(this, void 0, void 0, function* () {
        yield testUtils_1.beforeAllDb('StorageDriverMemory');
    }));
    afterAll(() => __awaiter(this, void 0, void 0, function* () {
        yield testUtils_1.afterAllTests();
    }));
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield testUtils_1.beforeEachDb();
        yield fs_extra_1.mkdirp(fsDriverPath_);
    }));
    afterEach(() => __awaiter(this, void 0, void 0, function* () {
        yield fs_extra_1.remove(fsDriverPath_);
    }));
    testUtils_2.shouldWriteToContentAndReadItBack(newConfig());
    testUtils_2.shouldDeleteContent(newConfig());
    testUtils_2.shouldNotCreateItemIfContentNotSaved(newConfig());
    testUtils_2.shouldNotUpdateItemIfContentNotSaved(newConfig());
    testUtils_2.shouldSupportFallbackDriver(newConfig(), { type: types_1.StorageDriverType.Filesystem, path: fsDriverPath_ });
    testUtils_2.shouldSupportFallbackDriverInReadWriteMode(newConfig(), { type: types_1.StorageDriverType.Filesystem, path: fsDriverPath_, mode: types_1.StorageDriverMode.ReadAndWrite });
    testUtils_2.shouldUpdateContentStorageIdAfterSwitchingDriver(newConfig(), { type: types_1.StorageDriverType.Filesystem, path: fsDriverPath_ });
    testUtils_2.shouldThrowNotFoundIfNotExist(newConfig());
});
//# sourceMappingURL=StorageDriverMemory.test.js.map